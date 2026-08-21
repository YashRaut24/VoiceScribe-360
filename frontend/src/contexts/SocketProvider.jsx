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

        socket.auth = {
            token: localStorage.getItem('token')
        };
        socket.connect();

        console.log('Socket Connected');

        return () => {
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