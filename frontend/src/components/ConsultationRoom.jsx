import React, { useEffect, useState, useRef } from 'react';
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
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [transcribing, setTranscribing] = useState(false);
    const [soapNotes, setSoapNotes] = useState(null);
    const [generatingSoap, setGeneratingSoap] = useState(false);
    const [savingRecord, setSavingRecord] = useState(false);
    const [recordSaved, setRecordSaved] = useState(false);
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

    if (!socket) return;

    const handleTranscriptUpdate = ({ transcript }) => {

        setTranscript(prev => {

            if (!prev) {
                return transcript;
            }

            return `${prev} ${transcript}`;
        });

    };

    socket.on(
        'transcript-update',
        handleTranscriptUpdate
    );

    return () => {

        socket.off(
            'transcript-update',
            handleTranscriptUpdate
        );

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

    const startRecording = async () => {

        try {

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorderRef.current = mediaRecorder;

            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {

                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }

            };

            mediaRecorder.onstop = async () => {

                stream.getTracks().forEach(
                    track => track.stop()
                );

                const audioBlob = new Blob(
                    audioChunksRef.current,
                    {
                        type: 'audio/webm'
                    }
                );

                try {

                    setTranscribing(true);

                    const result = await apiService.transcribeAudio(audioBlob);

                    setTranscript(result.transcript);

                } catch (error) {

                    console.error(
                        'Transcription failed:',
                        error
                    );

                    alert(error.message);

                } finally {

                    setTranscribing(false);

                }

            };

            mediaRecorder.start();

            setIsRecording(true);

        } catch (error) {

            console.error(
                'Microphone error:',
                error
            );

            alert(
                'Unable to access microphone.'
            );

        }

    };
    const stopRecording = () => {

    if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
    ) {

        mediaRecorderRef.current.stop();

        setIsRecording(false);

    }

};
const handleSaveMedicalRecord = async () => {
    if (!soapNotes) {
        alert('Generate SOAP notes first.');
        return;
    }

    try {
        setSavingRecord(true);

        await apiService.createMedicalRecord({
            patientId: session.patientId._id,
            appointmentId: session.appointmentId?._id,
            voiceTranscription: transcript,
            soapNotes: {
                subjective: soapNotes.subjective,
                objective: soapNotes.objective,
                assessment: soapNotes.assessment,
                plan: soapNotes.plan
            }
        });

        setRecordSaved(true);

        alert('Medical record saved successfully.');

    } catch (error) {
        console.error('Failed to save medical record:', error);
        alert(error.message || 'Failed to save medical record');

    } finally {
        setSavingRecord(false);
    }
};
    const handleGenerateSoap = async () => {
        if (!transcript.trim()) {
            alert('No transcript available.');
            return;
        }

        try {
            setGeneratingSoap(true);

            const result = await apiService.generateSoap(transcript);

            setSoapNotes(result.soapNotes);

        } catch (error) {
            console.error('SOAP generation failed:', error);
            alert(error.message || 'Failed to generate SOAP notes');

        } finally {
            setGeneratingSoap(false);
        }
    };

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
                        minHeight: '250px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '1rem',
                        whiteSpace: 'pre-wrap'
                    }}
                >
                    {transcript || 'Waiting for conversation...'}
                </div>

                <button
                    onClick={handleGenerateSoap}
                    disabled={!transcript || generatingSoap}
                    style={{
                        marginTop: '1rem',
                        padding: '12px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#2563eb',
                        color: 'white',
                        cursor: transcript && !generatingSoap
                            ? 'pointer'
                            : 'not-allowed'
                    }}
                >
                    {generatingSoap
                        ? 'Generating SOAP Notes...'
                        : 'Generate SOAP Notes'}
                </button>

                {soapNotes && (
                    <div
                        style={{
                            marginTop: '2rem',
                            padding: '1.5rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            background: '#ffffff'
                        }}
                    >
                        <h2>SOAP Notes</h2>

                        <div style={{ marginTop: '1.5rem' }}>
                            <h3>Subjective</h3>

                            <textarea
                                value={soapNotes.subjective}
                                onChange={(e) =>
                                    setSoapNotes({
                                        ...soapNotes,
                                        subjective: e.target.value
                                    })
                                }
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '12px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    resize: 'vertical',
                                    fontSize: '15px'
                                }}
                            />
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <h3>Objective</h3>

                            <textarea
                                value={soapNotes.objective}
                                onChange={(e) =>
                                    setSoapNotes({
                                        ...soapNotes,
                                        objective: e.target.value
                                    })
                                }
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '12px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    resize: 'vertical',
                                    fontSize: '15px'
                                }}
                            />
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <h3>Assessment</h3>

                            <textarea
                                value={soapNotes.assessment}
                                onChange={(e) =>
                                    setSoapNotes({
                                        ...soapNotes,
                                        assessment: e.target.value
                                    })
                                }
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '12px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    resize: 'vertical',
                                    fontSize: '15px'
                                }}
                            />
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <h3>Plan</h3>

                            <textarea
                                value={soapNotes.plan}
                                onChange={(e) =>
                                    setSoapNotes({
                                        ...soapNotes,
                                        plan: e.target.value
                                    })
                                }
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '12px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    resize: 'vertical',
                                    fontSize: '15px'
                                }}
                            />
                        </div>

                        <button
                            onClick={handleSaveMedicalRecord}
                            disabled={savingRecord || recordSaved}
                            style={{
                                marginTop: '2rem',
                                padding: '12px 24px',
                                border: 'none',
                                borderRadius: '8px',
                                background: recordSaved
                                    ? '#16a34a'
                                    : '#2563eb',
                                color: 'white',
                                cursor: savingRecord || recordSaved
                                    ? 'not-allowed'
                                    : 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            {recordSaved
                                ? '✓ Medical Record Saved'
                                : savingRecord
                                    ? 'Saving...'
                                    : 'Save Medical Record'}
                        </button>
                    </div>
                )}
                {user.userType === 'doctor' && (
                    <div
                        style={{
                            marginTop: '1rem',
                            display: 'flex',
                            gap: '10px'
                        }}
                    >

                    <div style={{ marginTop: '2rem' }}>

                        {!isRecording ? (

                            <button
                                onClick={startRecording}
                                style={{
                                    background: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Start Recording
                            </button>

                        ) : (

                            <button
                                onClick={stopRecording}
                                style={{
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Stop Recording
                            </button>

                        )}

                    </div>

                    </div>
                )}

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