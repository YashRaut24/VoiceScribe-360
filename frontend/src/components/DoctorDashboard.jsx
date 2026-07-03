import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import "../components/DoctorDashboard.css";
import { 
  Mic, 
  MicOff, 
  FileText, 
  Calendar, 
  Users, 
  Activity, 
  LogOut, 
  User,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  Square,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import apiService from '../services/api';
import socket from '../socket/socket';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentConsultation, setCurrentConsultation] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [audioURL, setAudioURL] = useState(null);
  const [micError, setMicError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const transcriptRef = useRef('');
  const [recordSearch, setRecordSearch] = useState('');
  const [recordDateFrom, setRecordDateFrom] = useState('');
  const [recordDateTo, setRecordDateTo] = useState('');
  const [savingRecord, setSavingRecord] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [consultationRequests, setConsultationRequests] = useState([]);
  const [activeConsultations, setActiveConsultations] = useState([]);

  const [stats, setStats] = useState({
      totalAppointments: 0,
      totalRecords: 0,
      upcomingAppointments: 0,
      patientsThisMonth: 0,
      recentRecords: []
  });
  const [generatedSoap, setGeneratedSoap] = useState({
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
  });

  const [showSoapReview, setShowSoapReview] = useState(false);

  const [pendingRecord, setPendingRecord] = useState(null);

  const [editingRecord, setEditingRecord] = useState(false);

  const [editedRecord, setEditedRecord] = useState({
      diagnosis: '',
      prescription: '',
      soapNotes: {
          subjective: '',
          objective: '',
          assessment: '',
          plan: ''
      }
  });

    useEffect(() => {
        loadData();

        socket.on('connect', () => {
            console.log('Connected:', socket.id);
        });

        socket.connect();

        console.log('Socket connected?', socket.connected);
        console.log('Socket ID:', socket.id);

        const interval = setInterval(async () => {
            try {
                const notifications = await apiService.getNotifications();
                setNotifications(notifications);
            } catch (error) {
                console.error(error);
            }
        }, 10000);

        return () => {
            clearInterval(interval);

            socket.off('connect');

            socket.disconnect();
        };
    }, []);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
      if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
          setSpeechSupported(false);
      }
  }, []);

  const loadData = async () => {
      try {
          const [appointmentsData, recordsData, patientsData, statsData,notificationsData, consultationRequestsData,activeConsultationsData] = await Promise.all([
              apiService.getAppointments(),
              apiService.getMedicalRecords(),
              apiService.getPatients(),
              apiService.getDashboardStats(),
              apiService.getNotifications(),
              apiService.getConsultationRequests(),
              apiService.getActiveConsultations()
          ]);
          setAppointments(appointmentsData);
          setMedicalRecords(recordsData);
          setPatients(patientsData);
          setStats(statsData);
          setNotifications(notificationsData);
          setConsultationRequests(consultationRequestsData);
          setActiveConsultations(activeConsultationsData);
      } catch (error) {
          console.error('Error loading data:', error);
      } finally {
          setLoading(false);
      }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };  

  const startRecording = async () => {
      setMicError('');
      setAudioURL(null);
      setTranscription('');
      audioChunksRef.current = [];

      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingTime(0);

          if (speechSupported) {
              const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
              const recognition = new SpeechRecognition();
              recognitionRef.current = recognition;

              recognition.continuous = true;
              recognition.interimResults = true;
              recognition.lang = 'en-US';

              let finalTranscript = '';

             recognition.onresult = (event) => {
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                transcriptRef.current = finalTranscript;
                setTranscription(finalTranscript + interimTranscript);
            };

              recognition.onerror = (event) => {
                  console.error('Speech recognition error:', event.error);
              };

              recognition.start();
          }

      } catch (error) {
          console.error('Microphone access error:', error);
          setMicError('Microphone access was denied or is unavailable. Please allow microphone permissions and try again.');
      }
  };

  const handleUpdateMedicalRecord = async () => {
    try {
        const updatedRecord = await apiService.updateMedicalRecord(
            selectedRecord._id,
            editedRecord
        );

        await loadData();

        setSelectedRecord(updatedRecord);

        setEditingRecord(false);

        alert('Medical record updated successfully.');

    } catch (error) {
        console.error(error);
        alert('Failed to update medical record.');
    }
};

  const stopRecording = async () => {
      setIsRecording(false);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      let audioUrl = null;

      try {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              audioUrl = await new Promise((resolve) => {
                  mediaRecorderRef.current.onstop = async () => {
                      try {
                          if (audioChunksRef.current.length > 0) {
                              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                              const url = URL.createObjectURL(audioBlob);
                              setAudioURL(url);
                              const uploadResponse = await apiService.uploadAudio(audioBlob);
                              resolve(uploadResponse.audioUrl);
                          } else {
                              resolve(null);
                          }
                      } catch (uploadError) {
                          console.error('Audio upload failed:', uploadError);
                          resolve(null);
                      }
                  };
                  mediaRecorderRef.current.stop();
              });
          }
      } catch (error) {
          console.error('Recording stop error:', error);
      }


      let soapNotes = {
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
      };

      const currentTranscript = transcriptRef.current;

      if (currentTranscript && currentTranscript.trim()) {
          try {
              const soapResponse = await apiService.generateSoap(currentTranscript);
              soapNotes = soapResponse.soapNotes;
              console.log("SOAP Response:", soapResponse);
              console.log("SOAP Notes:", soapNotes);
              console.log("Transcript:", currentTranscript);
          } catch (soapError) {
              console.error('SOAP generation failed:', soapError);
          }
      }

      const mockRecord = {
          patientId: selectedPatientId,
          voiceTranscription: currentTranscript || `Consultation recording - ${formatTime(recordingTime)} duration`,
          soapNotes,
          diagnosis: '',
          prescription: '',
          audioFileUrl: audioUrl
      };

      setGeneratedSoap(soapNotes);

        setPendingRecord({
            patientId: selectedPatientId,
            voiceTranscription: currentTranscript || `Consultation recording - ${formatTime(recordingTime)} duration`,
            diagnosis: '',
            prescription: '',
            audioFileUrl: audioUrl
        });

        setShowSoapReview(true);

        setTranscription('');
        transcriptRef.current = '';
        setRecordingTime(0);
        setSelectedPatientId('');
        setAudioURL(null);
        };

  const handleSaveMedicalRecord = async () => {
    try {
        setSavingRecord(true);

        await apiService.createMedicalRecord({
            ...pendingRecord,
            soapNotes: generatedSoap
        });

        setShowSoapReview(false);
        setPendingRecord(null);

        setGeneratedSoap({
            subjective: '',
            objective: '',
            assessment: '',
            plan: ''
        });

        loadData();

        setSaveSuccess(true);

        setTimeout(() => {
            setSaveSuccess(false);
        }, 2500);

    } catch (error) {
        console.error(error);
        alert('Failed to save medical record: ' + error.message);
    } finally {
        setSavingRecord(false);
    }
};

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading dashboard...
      </div>
    );
  }

const filteredRecords = medicalRecords.filter(record => {
    const searchLower = recordSearch.toLowerCase().trim();

    const fullName = `${record.patientId?.firstName || ''} ${record.patientId?.lastName || ''}`.toLowerCase();
    const diagnosis = (record.diagnosis || '').toLowerCase();

    const matchesSearch = !searchLower || searchLower.length < 2 ||
    fullName.includes(searchLower) ||
    (searchLower.length >= 4 && diagnosis.includes(searchLower));
    
    const recordDate = new Date(record.createdAt);
    const matchesFrom = !recordDateFrom || recordDate >= new Date(recordDateFrom);
    const matchesTo = !recordDateTo || recordDate <= new Date(recordDateTo + 'T23:59:59');

    return matchesSearch && matchesFrom && matchesTo;
});

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Mic style={{ color: '#3b82f6' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>VoiceScribe</h1>
          </div>
          
<div
    style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'relative'
    }}
>
    <span>{user?.firstName} {user?.lastName}</span>

    <button
        onClick={() => setShowNotifications(!showNotifications)}
        style={{
            position: 'relative',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '1px solid #e2e8f0',
            background: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}
    >
        <Bell size={20} />

        {notifications.filter(n => !n.isRead).length > 0 && (
            <span
                style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {notifications.filter(n => !n.isRead).length}
            </span>
        )}
    </button>
    {showNotifications && (
    <div
        style={{
            position: 'absolute',
            top: '55px',
            right: '70px',
            width: '340px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 2000,
            maxHeight: '400px',
            overflowY: 'auto'
        }}
    >
        <div
            style={{
                padding: '14px 16px',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: 600
            }}
        >
            Notifications
        </div>

        {notifications.length === 0 ? (
            <p
                style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#64748b'
                }}
            >
                No notifications
            </p>
        ) : (
            notifications.map((notification) => (
                <div
                    key={notification._id}
                    onClick={async () => {
                        if (!notification.isRead) {
                            await apiService.markNotificationRead(notification._id);

                            setNotifications(prev =>
                                prev.map(n =>
                                    n._id === notification._id
                                        ? { ...n, isRead: true }
                                        : n
                                )
                            );
                        }
                    }}
                    style={{
                        padding: '14px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        background: notification.isRead
                            ? '#fff'
                            : '#eff6ff'
                    }}
                >
                    <strong>{notification.title}</strong>

                    <p
                        style={{
                            margin: '6px 0',
                            fontSize: '14px',
                            color: '#475569'
                        }}
                    >
                        {notification.message}
                    </p>

                    <small style={{ color: '#94a3b8' }}>
                        {formatDate(notification.createdAt)}
                    </small>
                </div>
            ))
        )}
    </div>
)}

    <button
        onClick={handleLogout}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
        }}
    >
        <LogOut size={16} />
        Logout
    </button>
</div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'consultation', label: 'Voice Consultation', icon: Mic },
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'records', label: 'Medical Records', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Dashboard Overview</h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Calendar style={{ color: '#3b82f6' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalAppointments}</h3>
                    <p style={{ margin: 0, color: '#64748b' }}>Total Appointments</p>
                  </div>
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <FileText style={{ color: '#10b981' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalRecords}</h3>
                    <p style={{ margin: 0, color: '#64748b' }}>Medical Records</p>
                  </div>
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Users style={{ color: '#f59e0b' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.patientsThisMonth}</h3>
                    <p style={{ margin: 0, color: '#64748b' }}>Patients This Month</p>
                  </div>
                </div>
              </div>
              <div style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Clock style={{ color: '#8b5cf6' }} />
                      <div>
                          <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.upcomingAppointments}</h3>
                          <p style={{ margin: 0, color: '#64748b' }}>Upcoming Appointments</p>
                      </div>
                  </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div
    style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
    }}
>
    <h3
        style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
        }}
    >
        🌐 Online Consultation Requests
    </h3>

    <div
        style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
        }}
        >
            <h3
                style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem'
                }}
            >
                🎥 Active Online Consultations
            </h3>

            {activeConsultations.length === 0 ? (
                <p style={{ color: '#64748b' }}>
                    No active online consultations.
                </p>
            ) : (
                activeConsultations.map((consultation) => (
                    <div
                        key={consultation._id}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem 0',
                            borderBottom: '1px solid #e2e8f0'
                        }}
                    >
                        <div>
                            <h4 style={{ margin: 0 }}>
                                {consultation.patientId.firstName} {consultation.patientId.lastName}
                            </h4>

                            <p
                                style={{
                                    margin: '6px 0',
                                    color: '#64748b'
                                }}
                            >
                                {formatDate(consultation.appointmentId.date)}
                            </p>

                            <span
                                style={{
                                    color: '#16a34a',
                                    fontWeight: 600
                                }}
                            >
                                Waiting
                            </span>
                        </div>

                        <button
                            onClick={async () => {

                                try {

                                    await apiService.startConsultationSession(
                                        consultation._id
                                    );

                                    socket.emit(
                                        'join-room',
                                        consultation.roomId
                                    );

                                    socket.emit(
                                        'doctor-joined',
                                        consultation.roomId
                                    );

                                    console.log(
                                        'Doctor joined:',
                                        consultation.roomId
                                    );

                                    await loadData();

                                } catch (error) {

                                    console.error(error);

                                    alert(error.message);

                                }

                            }}
                        >
                            Start Consultation
                        </button>
                                            </div>
                ))
            )}
        </div>

    {consultationRequests.length === 0 ? (
        <p style={{ color: '#64748b' }}>
            No pending online consultation requests.
        </p>
    ) : (
        consultationRequests.map((request) => (
            <div
                key={request._id}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 0',
                    borderBottom: '1px solid #e2e8f0'
                }}
            >
                    <div>
                        <h4
                            style={{
                                margin: 0,
                                fontWeight: 600
                            }}
                        >
                            {request.patientId.firstName} {request.patientId.lastName}
                        </h4>

                        <p
                            style={{
                                margin: '4px 0',
                                color: '#64748b'
                            }}
                        >
                            {formatDate(request.date)}
                        </p>
                    </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: '10px'
                            }}
                        >
                        <button
                            onClick={async () => {
                                try {

                                    await apiService.updateConsultationStatus(
                                        request._id,
                                        'accepted'
                                    );

                                    await loadData();

                                    alert('Consultation accepted successfully.');

                                } catch (error) {

                                    alert(error.message);

                                }
                            }}
                            style={{
                                background: '#16a34a',
                                color: 'white',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Accept
</button>

                            <button
                                style={{
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 14px',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Reject
                            </button>
                            </div>
                        </div>
                    ))
                )}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Recent Medical Records</h3>
                {stats.recentRecords.map((record, index) => (
                    <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: index < 4 ? '1px solid #e2e8f0' : 'none'
                }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '500' }}>Patient Record #{index + 1}</p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>{record.diagnosis || 'General Consultation'}</p>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {formatDate(record.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'consultation' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Voice Consultation</h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Voice Recording</h3>

              <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Select Patient
                  </label>
                  <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      disabled={isRecording}
                      style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #e2e8f0'
                      }}
                  >
                      <option value="">-- Choose a patient --</option>
                      {patients.map(patient => (
                          <option key={patient._id} value={patient._id}>
                              {patient.firstName} {patient.lastName} ({patient.email})
                          </option>
                      ))}
                  </select>
              </div>

                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: isRecording ? '#ef4444' : (!selectedPatientId ? '#94a3b8' : '#3b82f6'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem',
                    cursor: (!selectedPatientId && !isRecording) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                }}
                onClick={() => {
                    if (isRecording) {
                        stopRecording();
                    } else if (selectedPatientId) {
                        startRecording();
                    }
                }}
                >
                                  {isRecording ? <Square size={40} color="white" /> : <Mic size={40} color="white" />}
                </div>
                
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  {formatTime(recordingTime)}
                </div>
                
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                  {isRecording ? 'Recording in progress...' : 'Click to start consultation recording'}
                </p>

                {micError && (
                    <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {micError}
                    </p>
                )}

                {audioURL && !isRecording && (
                    <div style={{ marginBottom: '2rem' }}>
                        <audio controls src={audioURL} style={{ width: '100%' }} />
                    </div>
                )}
                
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!isRecording && !selectedPatientId}
                    style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: isRecording ? '#ef4444' : (!selectedPatientId ? '#94a3b8' : '#3b82f6'),
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        cursor: (!selectedPatientId && !isRecording) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: '0 auto'
                    }}
                  >
                  {isRecording ? (
                    <>
                      <Square size={16} />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic size={16} />
                      Start Recording
                    </>
                  )}
                </button>
              </div>
              
              <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Live Transcription</h3>
                
              {!speechSupported && (
                  <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #f59e0b',
                      borderRadius: '0.375rem',
                      marginBottom: '1rem',
                      fontSize: '0.875rem',
                      color: '#92400e'
                  }}>
                      Live transcription is not supported in this browser. 
                      Please use Chrome or Edge for this feature.
                      Audio recording still works normally.
                  </div>
              )}

              <div style={{
                  minHeight: '200px',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '1rem',
                  lineHeight: '1.6'
              }}>
                  {transcription || 'Transcription will appear here when recording starts...'}
              </div>
                
                {transcription && (
                  <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                    <button style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}>
                      Generate SOAP Notes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Appointments</h2>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {appointments.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <Calendar size={48} style={{ margin: '0 auto 1rem' }} />
                  <p>No appointments scheduled</p>
                </div>
              ) : (
                appointments.map((appointment, index) => (
                <div key={appointment._id} style={{
                    padding: '1.5rem',
                    borderBottom: index < appointments.length - 1 ? '1px solid #e2e8f0' : 'none'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                                {appointment.patientId?.firstName} {appointment.patientId?.lastName}
                            </h4>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                                {formatDate(appointment.date)} • {appointment.duration} min
                            </p>
                            {appointment.notes && (
                                <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                                    {appointment.notes}
                                </p>
                            )}
                        </div>
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: appointment.status === 'scheduled' ? '#dbeafe' : appointment.status === 'completed' ? '#d1fae5' : '#fee2e2',
                            color: appointment.status === 'scheduled' ? '#1e40af' : appointment.status === 'completed' ? '#065f46' : '#991b1b'
                        }}>
                            {appointment.status}
                        </span>
                    </div>

                    {appointment.status === 'scheduled' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                                onClick={async () => {
                                    try {
                                        await apiService.updateAppointmentStatus(appointment._id, 'completed');
                                        loadData();
                                    } catch (error) {
                                        alert('Failed to update status: ' + error.message);
                                    }
                                }}
                                style={{ padding: '0.375rem 0.75rem', backgroundColor: '#10b981',
                                    color: 'white', border: 'none', borderRadius: '0.375rem',
                                    cursor: 'pointer', fontSize: '0.8rem' }}>
                                Mark Complete
                            </button>
                            <button
                                onClick={async () => {
                                    if (window.confirm('Cancel this appointment?')) {
                                        try {
                                            await apiService.updateAppointmentStatus(appointment._id, 'cancelled');
                                            loadData();
                                        } catch (error) {
                                            alert('Failed to update status: ' + error.message);
                                        }
                                    }
                                }}
                                style={{ padding: '0.375rem 0.75rem', backgroundColor: '#ef4444',
                                    color: 'white', border: 'none', borderRadius: '0.375rem',
                                    cursor: 'pointer', fontSize: '0.8rem' }}>
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'records' && (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Medical Records</h2>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                {filteredRecords.length} of {medicalRecords.length} records
            </span>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1rem',
            display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    Search by patient or diagnosis
                </label>
                <input
                    type="text"
                    placeholder="e.g. John Smith or Hypertension..."
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem',
                        border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    From date
                </label>
                <input
                    type="date"
                    value={recordDateFrom}
                    onChange={(e) => setRecordDateFrom(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem',
                        border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    To date
                </label>
                <input
                    type="date"
                    value={recordDateTo}
                    onChange={(e) => setRecordDateTo(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem',
                        border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
            </div>
            {(recordSearch || recordDateFrom || recordDateTo) && (
                <button
                    onClick={() => { setRecordSearch(''); setRecordDateFrom(''); setRecordDateTo(''); }}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0',
                        borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    Clear Filters
                </button>
            )}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {filteredRecords.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <FileText size={48} style={{ margin: '0 auto 1rem' }} />
                    <p>{medicalRecords.length === 0 ? 'No medical records found' : 'No records match your search'}</p>
                    {medicalRecords.length > 0 && (
                        <button onClick={() => { setRecordSearch(''); setRecordDateFrom(''); setRecordDateTo(''); }}
                            style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6',
                                color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                filteredRecords.map((record, index) => (
                    <div key={record._id} style={{ padding: '1.5rem',
                        borderBottom: index < filteredRecords.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                                    {record.diagnosis || 'General Consultation'}
                                </h4>
                                <p style={{ margin: '0 0 0.25rem 0', color: '#475569', fontSize: '0.875rem', fontWeight: '500' }}>
                                    {record.patientId?.firstName} {record.patientId?.lastName}
                                </p>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                                    {formatDate(record.createdAt)}
                                </p>
                            </div>
                        <button
                            className="view-details-btn"
                            onClick={() => {
                                setSelectedRecord(record);

                                setEditedRecord({
                                    diagnosis: record.diagnosis || '',
                                    prescription: record.prescription || '',
                                    soapNotes: {
                                        subjective: record.soapNotes?.subjective || '',
                                        objective: record.soapNotes?.objective || '',
                                        assessment: record.soapNotes?.assessment || '',
                                        plan: record.soapNotes?.plan || ''
                                    }
                                });

                                setEditingRecord(false);
                            }}
                        >
                            View Details
                        </button>
                        </div>
                        {record.soapNotes && (record.soapNotes.assessment || record.soapNotes.plan) && (
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                {record.soapNotes.assessment && <p style={{ margin: '0 0 0.25rem 0' }}><strong>Assessment:</strong> {record.soapNotes.assessment}</p>}
                                {record.soapNotes.plan && <p style={{ margin: 0 }}><strong>Plan:</strong> {record.soapNotes.plan}</p>}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
)}
      </div>

      {showSoapReview && (
          <div
              style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 2000
              }}
          >
              <div
                  style={{
                      background: '#fff',
                      width: '90%',
                      maxWidth: '700px',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      borderRadius: '12px',
                      padding: '24px'
                  }}
              >
                  <h2 style={{ marginBottom: '20px' }}>Review SOAP Notes</h2>

                  <label>Subjective</label>
                  <textarea
                      value={generatedSoap.subjective}
                      onChange={(e) =>
                          setGeneratedSoap(prev => ({
                              ...prev,
                              subjective: e.target.value
                          }))
                      }
                      rows={4}
                      style={{ width: '100%', marginBottom: '16px' }}
                  />

                  <label>Objective</label>
                  <textarea
                      value={generatedSoap.objective}
                      onChange={(e) =>
                          setGeneratedSoap(prev => ({
                              ...prev,
                              objective: e.target.value
                          }))
                      }
                      rows={4}
                      style={{ width: '100%', marginBottom: '16px' }}
                  />

                  <label>Assessment</label>
                  <textarea
                      value={generatedSoap.assessment}
                      onChange={(e) =>
                          setGeneratedSoap(prev => ({
                              ...prev,
                              assessment: e.target.value
                          }))
                      }
                      rows={4}
                      style={{ width: '100%', marginBottom: '16px' }}
                  />

                  <label>Plan</label>
                  <textarea
                      value={generatedSoap.plan}
                      onChange={(e) =>
                          setGeneratedSoap(prev => ({
                              ...prev,
                              plan: e.target.value
                          }))
                      }
                      rows={4}
                      style={{ width: '100%', marginBottom: '24px' }}
                  />

                  <div
                      style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '12px'
                      }}
                  >
                      <button onClick={() => setShowSoapReview(false)}>
                          Cancel
                      </button>

                      <button
                          onClick={handleSaveMedicalRecord}
                          disabled={savingRecord}
                          style={{
                              padding: '10px 18px',
                              background: savingRecord ? '#94a3b8' : '#2563eb',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: savingRecord ? 'not-allowed' : 'pointer'
                          }}
                      >
                          {savingRecord ? 'Saving...' : 'Save Medical Record'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {saveSuccess && (
        <div
            style={{
                position: 'fixed',
                top: 20,
                right: 20,
                background: '#16a34a',
                color: '#fff',
                padding: '12px 18px',
                borderRadius: '8px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                zIndex: 3000
            }}
        >
            ✅ Medical record saved successfully
        </div>
      )}

      {selectedRecord && (
          <div
            onClick={() => setSelectedRecord(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                padding: '2rem',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto'
              }}
            >
              <div
                  style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.5rem'
                  }}
              >
                  <h2>Medical Record Details</h2>

                  <button
                      onClick={() => setSelectedRecord(null)}
                      style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          color: '#64748b'
                      }}
                  >
                      ×
                  </button>
              </div>

              <button
                  className="view-details-btn"
                  onClick={() => setEditingRecord(!editingRecord)}
              >
                  {editingRecord ? 'Cancel Edit' : 'Edit'}
              </button>

        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          Patient: {selectedRecord.patientId?.firstName} {selectedRecord.patientId?.lastName} • {formatDate(selectedRecord.createdAt)}
        </p>
        <div style={{ marginBottom: '1.5rem' }}>
          <h4>Diagnosis</h4>

          {editingRecord ? (
              <input
                  type="text"
                  value={editedRecord.diagnosis}
                  onChange={(e) =>
                      setEditedRecord(prev => ({
                          ...prev,
                          diagnosis: e.target.value
                      }))
                  }
                  className="record-input"
              />
          ) : (
              <p>{selectedRecord.diagnosis || 'Not provided'}</p>
          )}
        </div>

            {selectedRecord.voiceTranscription && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Voice Transcription</h4>
                <p style={{ color: '#475569', fontSize: '0.9rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem' }}>
                  {selectedRecord.voiceTranscription}
                </p>
              </div>
            )}

          {selectedRecord.soapNotes && (
              <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>SOAP Notes</h4>

                  {["subjective", "objective", "assessment", "plan"].map((field) => (
                      <div key={field} style={{ marginBottom: '1rem' }}>
                          <strong style={{ display: 'block', marginBottom: '0.35rem', textTransform: 'capitalize' }}>
                              {field}
                          </strong>

                          {editingRecord ? (
                              <textarea
                                  className="record-textarea"
                                  value={editedRecord.soapNotes[field]}
                                  onChange={(e) =>
                                      setEditedRecord(prev => ({
                                          ...prev,
                                          soapNotes: {
                                              ...prev.soapNotes,
                                              [field]: e.target.value
                                          }
                                      }))
                                  }
                              />
                          ) : (
                              <p>{selectedRecord.soapNotes[field]}</p>
                          )}
                      </div>
                  ))}
              </div>
          )}

            {selectedRecord.prescription && (
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Prescription</h4>
                {editingRecord ? (
                    <textarea
                        value={editedRecord.prescription}
                        onChange={(e) =>
                            setEditedRecord(prev => ({
                                ...prev,
                                prescription: e.target.value
                            }))
                        }
                        className="record-textarea"
                    />
                ) : (
                    <p>{selectedRecord.prescription || 'Not provided'}</p>
                )}           
             </div>
            )}
               <div
    style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '2rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb'
    }}
>
    {editingRecord ? (
        <>
            <button
                className="secondary-btn"
                onClick={() => {
                    setEditingRecord(false);

                    // restore original values
                    setEditedRecord({
                        diagnosis: selectedRecord.diagnosis || '',
                        prescription: selectedRecord.prescription || '',
                        soapNotes: {
                            subjective: selectedRecord.soapNotes?.subjective || '',
                            objective: selectedRecord.soapNotes?.objective || '',
                            assessment: selectedRecord.soapNotes?.assessment || '',
                            plan: selectedRecord.soapNotes?.plan || ''
                        }
                    });
                }}
            >
                Cancel
            </button>

            <button
                className="view-details-btn"
                onClick={handleUpdateMedicalRecord}
            >
                Save Changes
            </button>
        </>
    ) : (
        <button
            className="secondary-btn"
            onClick={() => setSelectedRecord(null)}
        >
            Close
        </button>
    )}
</div>

          </div>
          
        </div>
        
      )}
   
    </div>
  );
};
export default DoctorDashboard;
