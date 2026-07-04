import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

const PatientWaitingRoom = () => {

    const { appointmentId } = useParams();

    const [session, setSession] = useState(null);

    const [loading, setLoading] = useState(true);
    const [doctorConnected, setDoctorConnected] = useState(false);
    const socket = useSocket();
    const navigate = useNavigate();
    useEffect(() => {

        socket.on('connect', () => {
            console.log('Patient Connected:', socket.id);
        });


       socket.on('participant-update', ({ doctorConnected, patientConnected }) => {

            console.log('Waiting room update:', {
                doctorConnected,
                patientConnected
            });

            setDoctorConnected(doctorConnected);

        });

        const loadSession = async () => {

            try {

                const data = await apiService.getConsultationSessionByAppointment(appointmentId)

                setSession(data);

               if (socket.connected) {
                    socket.emit('join-room', {
                        roomId: data.roomId,
                        role: 'patient'
                    });
                } else {
                    socket.once('connect', () => {
                        socket.emit('join-room', {
                            roomId: data.roomId,
                            role: 'patient'
                        });
                    });
                }

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
        socket.off('participant-update');

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

               {doctorConnected ? (

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
                            onClick={() => {
                                navigate(`/consultation/${session._id}`);
                            }}
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