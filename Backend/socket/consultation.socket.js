const { Appointment, ConsultationSession } = require('../models');

const rooms = new Map();
const ACTIVE_SESSION_STATUSES = ['waiting', 'ongoing'];

const getRoom = (roomId) => {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            doctorSockets: new Set(),
            patientSockets: new Set()
        });
    }

    return rooms.get(roomId);
};

const getRoomPresence = (roomId) => {
    const room = rooms.get(roomId);

    return {
        doctorConnected: Boolean(room?.doctorSockets.size),
        patientConnected: Boolean(room?.patientSockets.size)
    };
};

const serializeSession = (session) => ({
    _id: String(session._id),
    roomId: session.roomId,
    status: session.status,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    duration: session.duration,
    transcript: session.transcript || '',
    soapNotes: session.soapNotes || {
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
    }
});

const acknowledge = (callback, payload) => {
    if (typeof callback === 'function') {
        callback(payload);
    }
};

const emitRoomPresence = (io, roomId) => {
    io.to(roomId).emit('participant-update', getRoomPresence(roomId));
};

const removeSocketFromRoom = (io, socket) => {
    if (!socket.roomId || !socket.role) {
        return;
    }

    const roomId = socket.roomId;
    const room = rooms.get(roomId);

    if (!room) {
        socket.roomId = null;
        socket.role = null;
        return;
    }

    if (socket.role === 'doctor') {
        room.doctorSockets.delete(socket.id);
    }

    if (socket.role === 'patient') {
        room.patientSockets.delete(socket.id);
    }

    socket.leave(roomId);
    socket.roomId = null;
    socket.role = null;

    if (!room.doctorSockets.size && !room.patientSockets.size) {
        rooms.delete(roomId);
        return;
    }

    emitRoomPresence(io, roomId);
};

const emitConsultationError = (socket, callback, message, code = 'CONSULTATION_ERROR', extra = {}) => {
    const payload = {
        ok: false,
        code,
        message,
        ...extra
    };

    socket.emit('consultation-error', payload);

    if (code === 'AUTHORIZATION_ERROR') {
        socket.emit('authorization-error', { message });
    }

    acknowledge(callback, payload);
};

const completeConsultation = async (session, doctorId) => {
    if (session.status !== 'completed') {
        session.status = 'completed';
        session.endedAt = new Date();

        if (session.startedAt) {
            session.duration = Math.floor((session.endedAt - session.startedAt) / 1000);
        }

        await session.save();
    }

    if (session.appointmentId) {
        await Appointment.updateOne(
            {
                _id: session.appointmentId,
                doctorId
            },
            {
                status: 'completed'
            }
        );
    }

    return session;
};

function registerConsultationSocket(io, socket) {
    socket.on('join-room', async ({ roomId } = {}, callback) => {
        try {
            if (!roomId) {
                emitConsultationError(socket, callback, 'Consultation room is required.', 'VALIDATION_ERROR');
                return;
            }

            const session = await ConsultationSession.findOne({
                roomId,
                $or: [
                    { doctorId: socket.user.userId },
                    { patientId: socket.user.userId }
                ]
            });

            if (!session) {
                emitConsultationError(
                    socket,
                    callback,
                    'You are not authorized to join this consultation.',
                    'AUTHORIZATION_ERROR'
                );
                return;
            }

            if (session.status === 'completed') {
                socket.emit('consultation-ended', {
                    session: serializeSession(session)
                });
                acknowledge(callback, {
                    ok: false,
                    ended: true,
                    message: 'Consultation has already ended.',
                    session: serializeSession(session)
                });
                return;
            }

            if (!ACTIVE_SESSION_STATUSES.includes(session.status)) {
                emitConsultationError(
                    socket,
                    callback,
                    'This consultation is not ready to join.',
                    'SESSION_NOT_ACTIVE'
                );
                return;
            }

            const role = String(session.doctorId) === String(socket.user.userId)
                ? 'doctor'
                : 'patient';

            if (socket.roomId && socket.roomId !== roomId) {
                removeSocketFromRoom(io, socket);
            }

            socket.join(roomId);
            socket.roomId = roomId;
            socket.role = role;

            const room = getRoom(roomId);

            if (role === 'doctor') {
                room.doctorSockets.add(socket.id);
            }

            if (role === 'patient') {
                room.patientSockets.add(socket.id);
            }

            const payload = {
                ok: true,
                role,
                room: getRoomPresence(roomId),
                session: serializeSession(session)
            };

            emitRoomPresence(io, roomId);
            socket.emit('consultation-state', payload);
            acknowledge(callback, payload);
        } catch (error) {
            console.error('Join consultation room failed:', error);
            emitConsultationError(
                socket,
                callback,
                'Unable to join this consultation room.',
                'JOIN_FAILED'
            );
        }
    });

    socket.on('transcript-update', ({ roomId, transcript } = {}, callback) => {
        if (socket.role !== 'doctor' || socket.roomId !== roomId || !String(transcript || '').trim()) {
            emitConsultationError(socket, callback, 'Unable to sync transcript update.', 'TRANSCRIPT_SYNC_ERROR');
            return;
        }

        socket.to(roomId).emit('transcript-update', {
            transcript
        });

        acknowledge(callback, {
            ok: true
        });
    });

    socket.on('end-consultation', async (roomId, callback) => {
        try {
            if (socket.role !== 'doctor' || socket.roomId !== roomId) {
                emitConsultationError(socket, callback, 'Only the doctor can end this consultation.', 'AUTHORIZATION_ERROR');
                return;
            }

            const session = await ConsultationSession.findOne({
                roomId,
                doctorId: socket.user.userId
            });

            if (!session) {
                emitConsultationError(socket, callback, 'Consultation session not found.', 'SESSION_NOT_FOUND');
                return;
            }

            const endedSession = await completeConsultation(session, socket.user.userId);

            io.to(roomId).emit('consultation-ended', {
                session: serializeSession(endedSession)
            });

            acknowledge(callback, {
                ok: true,
                session: serializeSession(endedSession)
            });
        } catch (error) {
            console.error('End consultation failed:', error);
            emitConsultationError(socket, callback, 'Unable to end this consultation.', 'END_FAILED');
        }
    });

    socket.on('disconnect', () => {
        removeSocketFromRoom(io, socket);
    });
}

module.exports = registerConsultationSocket;
