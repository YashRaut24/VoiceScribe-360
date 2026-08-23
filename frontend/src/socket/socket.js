import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_ORIGIN || 'http://localhost:3000';

const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['websocket', 'polling'],
    auth: {
        token: localStorage.getItem('token')
    }
});

export default socket;
