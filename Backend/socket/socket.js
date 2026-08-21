const { Server } = require('socket.io');
const registerConsultationSocket = require('./consultation.socket');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

let io;

function initializeSocket(server){
    io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST']
        }
    });

    io.use((socket, next) => {
        try {
            if (!JWT_SECRET) {
                return next(new Error('JWT_SECRET is not configured'));
            }

            const token = socket.handshake.auth?.token?.replace(/^Bearer\s+/i, '');
            if (!token) {
                return next(new Error('Authentication required'));
            }

            socket.user = jwt.verify(token, JWT_SECRET);
            next();
        } catch (error) {
            next(new Error('Socket authentication failed'));
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