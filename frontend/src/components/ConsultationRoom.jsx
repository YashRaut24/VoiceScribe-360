import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';

function ConsultationRoom() {

    const { sessionId } = useParams();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();
    const [doctorConnected, setDoctorConnected] = useState(false);
    const [patientConnected, setPatientConnected] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {

    if (!socket) return;

        const handleParticipantUpdate = ({
            doctorConnected,
            patientConnected
        }) => {

            console.log("Received:", {
            doctorConnected,
            patientConnected
        });
            setDoctorConnected(doctorConnected);
            setPatientConnected(patientConnected);

        };

        socket.on('participant-update', handleParticipantUpdate);

        return () => {
            socket.off('participant-update', handleParticipantUpdate);
        };

    }, [socket]);

    useEffect(() => {

        if (!socket || !session) return;

        const joinRoom = () => {
            socket.emit('join-room', {
                roomId: session.roomId,
                role: user.userType
            });

            console.log("Joined room");
        };

        if (socket.connected) {
            joinRoom();
        } else {
            socket.once("connect", joinRoom);
        }

        return () => {
            socket.off("connect", joinRoom);
        };

    }, [socket, session, user]);
    
    useEffect(() => {

    const loadSession = async () => {

        try {

                const data = await apiService.getConsultationSession(sessionId);

                setSession(data);

        } catch (error) {

                console.error(error);

        } finally {

                setLoading(false);

            }

        };

        loadSession();

    }, [sessionId]);

    useEffect(() => {

        if (!socket) return;

        const handleConsultationEnded = () => {

            alert('Consultation has ended.');

            if (user.userType === 'doctor') {

                navigate('/doctor-dashboard');

            } else {

                navigate('/patient-dashboard');

            }

        };

        socket.on(
            'consultation-ended',
            handleConsultationEnded
        );

        return () => {

            socket.off(
                'consultation-ended',
                handleConsultationEnded
            );

        };

}, [socket]);


    if (loading) {
        return <h2>Loading consultation...</h2>;
    }

    if (!session) {
        return <h2>Consultation not found.</h2>;
    }


    

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#f8fafc',
                padding: '2rem'
            }}
        >
            <div
                style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
            >
                <h1>🩺 Online Consultation</h1>

                <p>
                    Session ID:
                    {session._id}
                </p>

                <hr />

                <h2>Participants</h2> 

                    <p>
                        {doctorConnected ? '🟢' : '🔴'}{' '}
                        {session.doctorId.firstName} {session.doctorId.lastName}
                    </p>

                    <p>
                        {patientConnected ? '🟢' : '🔴'}{' '}
                        {session.patientId.firstName} {session.patientId.lastName}
                    </p>

                <p>
                    Status: {session.status}
                </p>

                <p>
                    Started:
                    {' '}
                    {session.startedAt
                        ? new Date(session.startedAt).toLocaleTimeString()
                        : 'Not started'}
                </p>

                <hr />

                <h2>Transcript</h2>

                <div
                    style={{
                        height: '250px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '1rem'
                    }}
                >
                    Waiting for conversation...
                </div>

                <div
                    style={{
                        marginTop: '2rem'
                    }}
                >
                    <button
                        onClick={async () => {

                            try {

                                await apiService.endConsultationSession(session._id);

                                socket.emit(
                                    'end-consultation',
                                    session.roomId
                                );

                            } catch (error) {

                                console.error(error);

                                alert(error.message);

                            }

                        }}
                    >
                        End Consultation
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ConsultationRoom;