import { useEffect } from 'react';
import socket from '../socket/socket';
import SocketContext from './SocketContext';
import { useAuth } from './useAuth';

const SocketProvider = ({ children }) => {

    const { user } = useAuth();

    useEffect(() => {

        if (!user) {
            socket.disconnect();
            return;
        }

        const refreshSocketAuth = () => {
            socket.auth = {
                token: localStorage.getItem('token')
            };
        };

        refreshSocketAuth();

        if (!socket.connected) {
            socket.connect();
        }

        socket.io.on('reconnect_attempt', refreshSocketAuth);

        return () => {
            socket.io.off('reconnect_attempt', refreshSocketAuth);
            socket.disconnect();
        };

    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;
