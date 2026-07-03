function registerConsultationSocket(io, socket) {

    socket.on('join-room', (roomId) => {

        socket.join(roomId);

        console.log(`${socket.id} joined ${roomId}`);

    });

    socket.on('doctor-joined', (roomId) => {

        console.log(`Doctor joined room: ${roomId}`);

        io.to(roomId).emit('doctor-joined');

    });

}

module.exports = registerConsultationSocket;