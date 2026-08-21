const rooms = new Map();
const { ConsultationSession } = require('../models');

function registerConsultationSocket(io, socket) {
    

    socket.on('join-room', async ({ roomId }) => {
        try {
            const session = await ConsultationSession.findOne({
                roomId,
                $or: [
                    { doctorId: socket.user.userId },
                    { patientId: socket.user.userId }
                ],
                status: { $in: ['waiting', 'ongoing'] }
            });

            if (!session) {
                socket.emit('authorization-error', {
                    message: 'You are not authorized to join this consultation'
                });
                return;
            }

            const role = String(session.doctorId) === String(socket.user.userId)
                ? 'doctor'
                : 'patient';

            socket.join(roomId);

            // Save information on this socket
            socket.roomId = roomId;
            socket.role = role;

            // Create room if it doesn't exist
            if (!rooms.has(roomId)) {
                rooms.set(roomId, {
                    doctorConnected: false,
                    patientConnected: false
                });
            }

            const room = rooms.get(roomId);

            // Update room state
            if (role === 'doctor') {
                room.doctorConnected = true;
            }

            if (role === 'patient') {
                room.patientConnected = true;
            }

            console.log(roomId, room);

            console.log("Broadcasting:", room);
            io.to(roomId).emit('participant-update', room);
        } catch (error) {
            socket.emit('authorization-error', {
                message: 'Unable to authorize this consultation'
            });
        }

    });
    socket.on(
        'transcript-update',
        ({ roomId, transcript }) => {

            if (socket.role !== 'doctor' || socket.roomId !== roomId || !transcript) {
                return;
            }

            io.to(roomId).emit(
                'transcript-update',
                {
                    transcript
                }
            );

        }
    );
    socket.on('end-consultation', (roomId) => {

        if (socket.role !== 'doctor' || socket.roomId !== roomId) {
            return;
        }

        io.to(roomId).emit('consultation-ended');

        console.log(`Consultation ended: ${roomId}`);

    });

    socket.on('disconnect', () => {

        if (!socket.roomId) return;

        const room = rooms.get(socket.roomId);

        if (!room) return;

        if (socket.role === 'doctor') {
            room.doctorConnected = false;
        }

        if (socket.role === 'patient') {
            room.patientConnected = false;
        }

        io.to(socket.roomId).emit(
            'participant-update',
            room
        );

        console.log(`${socket.role} disconnected from ${socket.roomId}`);

        // Optional cleanup
        if (!room.doctorConnected && !room.patientConnected) {
            rooms.delete(socket.roomId);
        }

    });
    


}

module.exports = registerConsultationSocket;