import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../services/api';
import { useSocket } from '../contexts/SocketContext';

const PatientWaitingRoom = () => {

    const { appointmentId } = useParams();

    const [session, setSession] = useState(null);

    const [loading, setLoading] = useState(true);
    const [doctorJoined, setDoctorJoined] = useState(false);
    const socket = useSocket();

    useEffect(() => {

        socket.on('connect', () => {
            console.log('Patient Connected:', socket.id);
        });

        socket.connect();

        socket.on('doctor-joined', () => {

            setDoctorJoined(true);

            console.log('Doctor joined consultation.');

        });

        const loadSession = async () => {

            try {

                const data = await apiService.getConsultationSession(
                    appointmentId
                );

                setSession(data);

                socket.emit('join-room', data.roomId);

                console.log('Joined room:', data.roomId);

            } catch (error) {

                console.error(error);

            } finally {

                setLoading(false);

        }

    };

    loadSession();

    return () => {

        socket.off('connect');
        socket.off('doctor-joined');
        socket.disconnect();

    };

}, [appointmentId]);
    if (loading) {
        return <h2>Loading...</h2>;
    }

    if (!session) {
    return (
        <h2 style={{ textAlign: 'center', marginTop: '2rem' }}>
            Consultation session not found.
        </h2>
    );
}

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#f8fafc'
            }}
        >
            <div
                style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    width: '500px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
            >
                <h1>🩺 Waiting Room</h1>

                <h2>
                    Dr. {session.doctorId.firstName} {session.doctorId.lastName}
                </h2>

                <p>

                    {session.doctorId.specialization}

                </p>

                <p>

                    Status:
                    {' '}

                    {session.status}

                </p>

                <p>

                    Room:
                    {session.roomId}

                </p>

               {doctorJoined ? (

                    <>
                        <div
                            style={{
                                marginTop: '2rem',
                                marginBottom: '1rem',
                                fontSize: '3rem'
                            }}
                        >
                            🟢
                        </div>

                        <h3
                            style={{
                                color: '#16a34a'
                            }}
                        >
                            Doctor is ready
                        </h3>

                        <p>
                            Your doctor has joined the consultation.
                        </p>

                        <button
                            style={{
                                marginTop: '1.5rem',
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Join Consultation
                        </button>
                    </>

                ) : (

                    <>
                        <p>
                            Waiting for your doctor...
                        </p>

                        <div
                            style={{
                                marginTop: '2rem',
                                marginBottom: '2rem',
                                fontSize: '3rem'
                            }}
                        >
                            ⏳
                        </div>

                        <p>
                            Waiting for your doctor to join...
                        </p>
                    </>

                )}
            </div>
        </div>
    );
};

export default PatientWaitingRoom;