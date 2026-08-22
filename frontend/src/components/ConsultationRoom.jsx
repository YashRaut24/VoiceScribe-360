import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Activity,
    ArrowLeft,
    CheckCircle2,
    CircleAlert,
    ClipboardList,
    Clock,
    FileText,
    Loader2,
    Mic,
    Save,
    Square,
    Stethoscope,
    UserRound,
    WandSparkles
} from 'lucide-react';
import apiService from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/useAuth';
import './ConsultationRoom.css';

const EMPTY_SOAP_NOTES = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
};

const SOAP_FIELDS = [
    {
        key: 'subjective',
        label: 'Subjective',
        helper: 'Symptoms, history, patient concerns'
    },
    {
        key: 'objective',
        label: 'Objective',
        helper: 'Observed findings, vitals, exam notes'
    },
    {
        key: 'assessment',
        label: 'Assessment',
        helper: 'Clinical impression and working diagnosis'
    },
    {
        key: 'plan',
        label: 'Plan',
        helper: 'Treatment, medication, follow-up'
    }
];

const getFullName = (person) => {
    if (!person) {
        return 'Not assigned';
    }

    return `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Not assigned';
};

const normalizeSoapNotes = (notes = {}) => ({
    subjective: notes.subjective || '',
    objective: notes.objective || '',
    assessment: notes.assessment || '',
    plan: notes.plan || ''
});

const hasSoapContent = (notes) => (
    Object.values(normalizeSoapNotes(notes)).some((value) => value.trim())
);

const appendTranscriptText = (previous, next) => {
    const cleanNext = String(next || '').trim();

    if (!cleanNext) {
        return previous || '';
    }

    const cleanPrevious = String(previous || '').trimEnd();

    if (!cleanPrevious) {
        return cleanNext;
    }

    if (cleanPrevious.endsWith(cleanNext)) {
        return cleanPrevious;
    }

    return `${cleanPrevious}\n${cleanNext}`;
};

const formatDateTime = (value) => {
    if (!value) {
        return 'Not scheduled';
    }

    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatDuration = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

function ConsultationRoom() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const { user } = useAuth();

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [doctorConnected, setDoctorConnected] = useState(false);
    const [patientConnected, setPatientConnected] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [soapNotes, setSoapNotes] = useState(EMPTY_SOAP_NOTES);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [generatingSoap, setGeneratingSoap] = useState(false);
    const [savingTranscript, setSavingTranscript] = useState(false);
    const [savingSoap, setSavingSoap] = useState(false);
    const [savingRecord, setSavingRecord] = useState(false);
    const [recordSaved, setRecordSaved] = useState(false);
    const [endingConsultation, setEndingConsultation] = useState(false);
    const [notice, setNotice] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    const isDoctor = user?.userType === 'doctor';
    const backPath = isDoctor ? '/doctor-dashboard' : '/patient-dashboard';
    const soapHasContent = hasSoapContent(soapNotes);
    const transcriptHasContent = transcript.trim().length > 0;

    const sessionSummary = useMemo(() => {
        const appointment = session?.appointmentId;

        return [
            {
                label: 'Status',
                value: session?.status || 'Unknown'
            },
            {
                label: 'Appointment',
                value: formatDateTime(appointment?.date)
            },
            {
                label: 'Duration',
                value: appointment?.duration ? `${appointment.duration} min` : 'Not set'
            },
            {
                label: 'Room',
                value: session?.roomId || 'Unavailable'
            }
        ];
    }, [session]);

    useEffect(() => {
        const loadSession = async () => {
            try {
                const data = await apiService.getConsultationSession(sessionId);

                setSession(data);
                setTranscript(data.transcript || '');
                setSoapNotes(normalizeSoapNotes(data.soapNotes));
            } catch (error) {
                console.error(error);
                setNotice({
                    type: 'error',
                    text: error.message || 'Unable to load consultation.'
                });
            } finally {
                setLoading(false);
            }
        };

        loadSession();
    }, [sessionId]);

    useEffect(() => {
        if (!socket) {
            return undefined;
        }

        const handleParticipantUpdate = ({ doctorConnected, patientConnected }) => {
            setDoctorConnected(Boolean(doctorConnected));
            setPatientConnected(Boolean(patientConnected));
        };

        const handleAuthorizationError = ({ message }) => {
            setNotice({
                type: 'error',
                text: message || 'Unable to join this consultation room.'
            });
        };

        socket.on('participant-update', handleParticipantUpdate);
        socket.on('authorization-error', handleAuthorizationError);

        return () => {
            socket.off('participant-update', handleParticipantUpdate);
            socket.off('authorization-error', handleAuthorizationError);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) {
            return undefined;
        }

        const handleTranscriptUpdate = ({ transcript }) => {
            setTranscript((previous) => appendTranscriptText(previous, transcript));
        };

        socket.on('transcript-update', handleTranscriptUpdate);

        return () => {
            socket.off('transcript-update', handleTranscriptUpdate);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket || !session || !user) {
            return undefined;
        }

        const joinRoom = () => {
            socket.emit('join-room', {
                roomId: session.roomId,
                role: user.userType
            });
        };

        if (socket.connected) {
            joinRoom();
        } else {
            socket.once('connect', joinRoom);
        }

        return () => {
            socket.off('connect', joinRoom);
        };
    }, [socket, session, user]);

    useEffect(() => {
        if (!socket) {
            return undefined;
        }

        const handleConsultationEnded = () => {
            setSession((current) => (
                current
                    ? { ...current, status: 'completed', endedAt: current.endedAt || new Date().toISOString() }
                    : current
            ));
            setNotice({
                type: 'success',
                text: 'Consultation ended.'
            });

            window.setTimeout(() => navigate(backPath), 1200);
        };

        socket.on('consultation-ended', handleConsultationEnded);

        return () => {
            socket.off('consultation-ended', handleConsultationEnded);
        };
    }, [backPath, navigate, socket]);

    useEffect(() => {
        if (!isRecording) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setRecordingSeconds((current) => current + 1);
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [isRecording]);

    useEffect(() => (
        () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        }
    ), []);

    const setDoctorNotice = (type, text) => {
        setNotice({ type, text });
    };

    const startRecording = async () => {
        if (!isDoctor || isRecording || isTranscribing) {
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setDoctorNotice('error', 'Recording is not supported in this browser.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            streamRef.current = stream;
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;

                if (!audioChunksRef.current.length) {
                    setDoctorNotice('error', 'No audio was captured.');
                    return;
                }

                setIsTranscribing(true);

                try {
                    const audioBlob = new Blob(audioChunksRef.current, {
                        type: 'audio/webm'
                    });
                    const result = await apiService.transcribeAudio(audioBlob);

                    if (socket?.connected && session?.roomId) {
                        socket.emit('transcript-update', {
                            roomId: session.roomId,
                            transcript: result.transcript
                        });
                    } else {
                        setTranscript((previous) => appendTranscriptText(previous, result.transcript));
                    }

                    setDoctorNotice('success', 'Recording transcribed.');
                } catch (error) {
                    console.error('Transcription failed:', error);
                    setDoctorNotice('error', error.message || 'Transcription failed.');
                } finally {
                    setIsTranscribing(false);
                    audioChunksRef.current = [];
                }
            };

            mediaRecorder.start();
            setRecordingSeconds(0);
            setRecordSaved(false);
            setIsRecording(true);
            setDoctorNotice('info', 'Recording started.');
        } catch (error) {
            console.error('Microphone error:', error);
            setDoctorNotice('error', 'Unable to access microphone.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
    };

    const handleSaveTranscript = async () => {
        if (!isDoctor || !transcriptHasContent || !session) {
            return;
        }

        try {
            setSavingTranscript(true);
            await apiService.saveConsultationContent(session._id, { transcript });
            setDoctorNotice('success', 'Transcript saved.');
        } catch (error) {
            console.error('Failed to save transcript:', error);
            setDoctorNotice('error', error.message || 'Failed to save transcript.');
        } finally {
            setSavingTranscript(false);
        }
    };

    const handleGenerateSoap = async () => {
        if (!isDoctor || !transcriptHasContent) {
            return;
        }

        try {
            setGeneratingSoap(true);
            const result = await apiService.generateSoap(transcript);

            setSoapNotes(normalizeSoapNotes(result.soapNotes));
            setRecordSaved(false);
            setDoctorNotice('success', 'SOAP notes generated.');
        } catch (error) {
            console.error('SOAP generation failed:', error);
            setDoctorNotice('error', error.message || 'Failed to generate SOAP notes.');
        } finally {
            setGeneratingSoap(false);
        }
    };

    const handleSaveSoap = async () => {
        if (!isDoctor || !soapHasContent || !session) {
            return;
        }

        try {
            setSavingSoap(true);
            await apiService.saveConsultationContent(session._id, { soapNotes });
            setDoctorNotice('success', 'SOAP notes saved.');
        } catch (error) {
            console.error('Failed to save SOAP notes:', error);
            setDoctorNotice('error', error.message || 'Failed to save SOAP notes.');
        } finally {
            setSavingSoap(false);
        }
    };

    const handleSaveMedicalRecord = async () => {
        if (!isDoctor || !soapHasContent || !session) {
            return;
        }

        if (!session.appointmentId?._id) {
            setDoctorNotice('error', 'This consultation is missing an appointment reference.');
            return;
        }

        try {
            setSavingRecord(true);

            await apiService.createMedicalRecord({
                patientId: session.patientId._id,
                appointmentId: session.appointmentId._id,
                voiceTranscription: transcript,
                soapNotes
            });

            setRecordSaved(true);
            setDoctorNotice('success', 'Medical record saved.');
        } catch (error) {
            console.error('Failed to save medical record:', error);
            setDoctorNotice('error', error.message || 'Failed to save medical record.');
        } finally {
            setSavingRecord(false);
        }
    };

    const handleEndConsultation = async () => {
        if (!isDoctor || !session) {
            navigate(backPath);
            return;
        }

        if (isRecording || isTranscribing) {
            setDoctorNotice('info', 'Finish the current recording before ending the consultation.');
            return;
        }

        try {
            setEndingConsultation(true);
            const endedSession = await apiService.endConsultationSession(session._id);

            setSession((current) => ({
                ...current,
                ...endedSession
            }));

            socket?.emit('end-consultation', session.roomId);
            setDoctorNotice('success', 'Consultation ended.');
            window.setTimeout(() => navigate(backPath), 1000);
        } catch (error) {
            console.error(error);
            setDoctorNotice('error', error.message || 'Failed to end consultation.');
        } finally {
            setEndingConsultation(false);
        }
    };

    const handleSoapChange = (field, value) => {
        setSoapNotes((current) => ({
            ...normalizeSoapNotes(current),
            [field]: value
        }));
        setRecordSaved(false);
    };

    const connectionRows = [
        {
            label: 'Doctor',
            name: getFullName(session?.doctorId),
            detail: session?.doctorId?.specialization || 'Care provider',
            connected: doctorConnected,
            icon: Stethoscope
        },
        {
            label: 'Patient',
            name: getFullName(session?.patientId),
            detail: session?.patientId?.email || 'Patient',
            connected: patientConnected,
            icon: UserRound
        }
    ];

    if (loading) {
        return (
            <main className="consultation-page consultation-centered">
                <Loader2 className="consultation-spinner" size={34} />
                <p>Loading consultation...</p>
            </main>
        );
    }

    if (!session) {
        return (
            <main className="consultation-page consultation-centered">
                <CircleAlert size={36} />
                <h1>Consultation not found</h1>
                <p>{notice?.text || 'The consultation room could not be loaded.'}</p>
                <button className="secondary-action" onClick={() => navigate(backPath)}>
                    <ArrowLeft size={18} />
                    Back
                </button>
            </main>
        );
    }

    return (
        <main className="consultation-page">
            <div className="consultation-shell">
                <header className="consultation-topbar">
                    <button className="back-button" onClick={() => navigate(backPath)}>
                        <ArrowLeft size={18} />
                        Back
                    </button>

                    <div className="consultation-title-block">
                        <div className="eyebrow-row">
                            <span className="status-dot online" />
                            Live consultation
                        </div>
                        <h1>Consultation Room</h1>
                        <p>
                            Dr. {getFullName(session.doctorId)} with {getFullName(session.patientId)}
                        </p>
                    </div>

                    <div className={`session-status status-${session.status || 'unknown'}`}>
                        <Activity size={16} />
                        {session.status || 'Unknown'}
                    </div>
                </header>

                {notice && (
                    <div className={`consultation-notice notice-${notice.type}`}>
                        {notice.type === 'error' ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
                        <span>{notice.text}</span>
                    </div>
                )}

                <section className="consultation-summary">
                    {sessionSummary.map((item) => (
                        <div className="summary-item" key={item.label}>
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </div>
                    ))}
                </section>

                <div className="consultation-layout">
                    <section className="workspace-column">
                        <div className="consultation-panel transcript-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-kicker">
                                        <FileText size={16} />
                                        Transcript
                                    </span>
                                    <h2>Conversation Notes</h2>
                                </div>

                                <div className="panel-actions">
                                    {isDoctor && (
                                        <>
                                            <button
                                                className="secondary-action"
                                                onClick={handleSaveTranscript}
                                                disabled={!transcriptHasContent || savingTranscript}
                                            >
                                                <Save size={16} />
                                                {savingTranscript ? 'Saving' : 'Save'}
                                            </button>
                                            <button
                                                className="primary-action"
                                                onClick={handleGenerateSoap}
                                                disabled={!transcriptHasContent || generatingSoap}
                                            >
                                                {generatingSoap ? <Loader2 className="spin" size={16} /> : <WandSparkles size={16} />}
                                                {generatingSoap ? 'Generating' : 'Generate SOAP'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <textarea
                                className="transcript-editor"
                                value={transcript}
                                onChange={(event) => {
                                    setTranscript(event.target.value);
                                    setRecordSaved(false);
                                }}
                                readOnly={!isDoctor}
                                placeholder="Transcript will appear here after recording."
                            />

                            <div className="transcript-footer">
                                <span>{transcript.trim().length} characters</span>
                                {isTranscribing && (
                                    <span className="inline-status">
                                        <Loader2 className="spin" size={14} />
                                        Transcribing audio
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="consultation-panel soap-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-kicker">
                                        <ClipboardList size={16} />
                                        SOAP
                                    </span>
                                    <h2>Clinical Note</h2>
                                </div>

                                {isDoctor && (
                                    <div className="panel-actions">
                                        <button
                                            className="secondary-action"
                                            onClick={handleSaveSoap}
                                            disabled={!soapHasContent || savingSoap}
                                        >
                                            <Save size={16} />
                                            {savingSoap ? 'Saving' : 'Save SOAP'}
                                        </button>
                                        <button
                                            className="primary-action"
                                            onClick={handleSaveMedicalRecord}
                                            disabled={!soapHasContent || savingRecord || recordSaved}
                                        >
                                            {recordSaved ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                                            {recordSaved ? 'Saved' : savingRecord ? 'Saving' : 'Save Record'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {(isDoctor || soapHasContent) ? (
                                <div className="soap-grid">
                                    {SOAP_FIELDS.map((field) => (
                                        <label className="soap-field" key={field.key}>
                                            <span>
                                                {field.label}
                                                <small>{field.helper}</small>
                                            </span>
                                            <textarea
                                                value={soapNotes[field.key]}
                                                onChange={(event) => handleSoapChange(field.key, event.target.value)}
                                                readOnly={!isDoctor}
                                                placeholder={`${field.label} notes`}
                                            />
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <ClipboardList size={26} />
                                    <p>SOAP notes have not been added yet.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className="consultation-sidebar">
                        <div className="consultation-panel">
                            <div className="panel-header compact">
                                <div>
                                    <span className="panel-kicker">
                                        <UserRound size={16} />
                                        Participants
                                    </span>
                                    <h2>Room Status</h2>
                                </div>
                            </div>

                            <div className="participant-list">
                                {connectionRows.map(({ label, name, detail, connected, icon: Icon }) => (
                                    <div className="participant-row" key={label}>
                                        <div className="participant-icon">
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <span>{label}</span>
                                            <strong>{name}</strong>
                                            <small>{detail}</small>
                                        </div>
                                        <span className={`presence-pill ${connected ? 'connected' : 'offline'}`}>
                                            {connected ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="consultation-panel recording-panel">
                            <div className="panel-header compact">
                                <div>
                                    <span className="panel-kicker">
                                        <Mic size={16} />
                                        Recording
                                    </span>
                                    <h2>Capture</h2>
                                </div>
                                <span className={`recording-state ${isRecording ? 'active' : ''}`}>
                                    {isRecording ? 'Live' : isTranscribing ? 'Processing' : 'Idle'}
                                </span>
                            </div>

                            <div className="recording-meter">
                                <div className={`recording-orb ${isRecording ? 'active' : ''}`}>
                                    {isRecording ? <Square size={28} /> : <Mic size={30} />}
                                </div>
                                <strong>{formatDuration(recordingSeconds)}</strong>
                                <span>
                                    {isRecording
                                        ? 'Recording in progress'
                                        : isTranscribing
                                            ? 'Audio is being transcribed'
                                            : 'Ready to record'}
                                </span>
                            </div>

                            {isDoctor ? (
                                <button
                                    className={`record-action ${isRecording ? 'stop' : ''}`}
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={isTranscribing}
                                >
                                    {isRecording ? <Square size={18} /> : <Mic size={18} />}
                                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                                </button>
                            ) : (
                                <div className="readonly-note">
                                    <Clock size={16} />
                                    Recording controls are available to the doctor.
                                </div>
                            )}
                        </div>

                        <div className="consultation-panel action-panel">
                            <button
                                className={isDoctor ? 'danger-action' : 'secondary-action full-width'}
                                onClick={handleEndConsultation}
                                disabled={endingConsultation}
                            >
                                {endingConsultation ? <Loader2 className="spin" size={16} /> : <ArrowLeft size={16} />}
                                {isDoctor ? (endingConsultation ? 'Ending' : 'End Consultation') : 'Leave Room'}
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

export default ConsultationRoom;
