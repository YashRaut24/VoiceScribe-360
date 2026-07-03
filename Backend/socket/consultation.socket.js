function registerConsultationSocket(io, socket) {

    socket.on('join-room', (roomId) => {

        socket.join(roomId);

        console.log(`${socket.id} joined ${roomId}`);

    });

}

module.exports = registerConsultationSocket;