const { Server } = require('socket.io');
const registerConsultationSocket = require('./consultation.socket');

let io;

function initializeSocket(server){
    io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection',(socket)=> {
        console.log(`Socket connected: ${socket.id}`);
        registerConsultationSocket(io, socket);
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        })
    })

    return io;
}

function getIO(){
    if(!io){
        throw new Error('Socket.IO has not been initialized.');
    }

    return io;
}

module.exports = {
    initializeSocket,
    getIO
}