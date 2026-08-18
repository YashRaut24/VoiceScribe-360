const rooms = new Map();

function registerConsultationSocket(io, socket) {
    

    socket.on('join-room', ({ roomId, role }) => {

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

    });
    socket.on(
        'transcript-update',
        ({ roomId, transcript }) => {

            if (!roomId || !transcript) {
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