import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  Loader2,
  LogOut,
  Mic,
  Play,
  Search,
  Square,
  Stethoscope,
  UserRound,
  Users,
  Video,
  X
} from 'lucide-react';
import './DoctorDashboard.css';
import { useAuth } from '../contexts/useAuth';
import apiService from '../services/api';
import { useSocket } from '../contexts/SocketContext';

const SOAP_FIELDS = [
  { key: 'subjective', label: 'Subjective' },
  { key: 'objective', label: 'Objective' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'plan', label: 'Plan' }
];

const getFullName = (person) => {
  if (!person) {
    return 'Not assigned';
  }

  return `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Not assigned';
};

const getStatusClass = (status) => `status-${status || 'unknown'}`;

const isSameDay = (left, right) => (
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate()
);

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const socket = useSocket();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transcription, setTranscription] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [audioURL, setAudioURL] = useState(null);
  const [micError, setMicError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recordSearch, setRecordSearch] = useState('');
  const [recordDateFrom, setRecordDateFrom] = useState('');
  const [recordDateTo, setRecordDateTo] = useState('');
  const [savingRecord, setSavingRecord] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [consultationRequests, setConsultationRequests] = useState([]);
  const [activeConsultations, setActiveConsultations] = useState([]);
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
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalRecords: 0,
    upcomingAppointments: 0,
    patientsThisMonth: 0,
    recentRecords: []
  });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  const loadData = async () => {
    try {
      const [
        appointmentsData,
        recordsData,
        patientsData,
        statsData,
        notificationsData,
        consultationRequestsData,
        activeConsultationsData
      ] = await Promise.all([
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

  useEffect(() => {
    loadData();

    const interval = setInterval(async () => {
      try {
        const freshNotifications = await apiService.getNotifications();
        setNotifications(freshNotifications);
      } catch (error) {
        console.error(error);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let interval;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setSpeechSupported(false);
    }
  }, []);

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

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
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

          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              finalTranscript += `${transcript} `;
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

    const currentTranscript = (transcriptRef.current || transcription).trim();

    if (currentTranscript) {
      try {
        const soapResponse = await apiService.generateSoap(currentTranscript);
        soapNotes = soapResponse.soapNotes;
      } catch (soapError) {
        console.error('SOAP generation failed:', soapError);
      }
    }

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
      alert(`Failed to save medical record: ${error.message}`);
    } finally {
      setSavingRecord(false);
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

  const handleOpenRecord = (record) => {
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
  };

  const handleStartConsultation = async (consultation) => {
    try {
      await apiService.startConsultationSession(consultation._id);

      socket?.emit('join-room', {
        roomId: consultation.roomId,
        role: 'doctor'
      });

      socket?.emit('doctor-joined', consultation.roomId);

      await loadData();
      navigate(`/consultation/${consultation._id}`);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleRequestDecision = async (requestId, status) => {
    try {
      await apiService.updateConsultationStatus(requestId, status);
      await loadData();
      alert(status === 'accepted' ? 'Consultation accepted successfully.' : 'Consultation rejected.');
    } catch (error) {
      alert(error.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    if (!date) {
      return 'Not scheduled';
    }

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const today = new Date();
  const doctorName = user?.firstName ? `Dr. ${user.firstName}` : 'Doctor';
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const sortedAppointments = useMemo(() => (
    [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date))
  ), [appointments]);

  const todaysAppointments = useMemo(() => (
    sortedAppointments.filter((appointment) => isSameDay(new Date(appointment.date), today))
  ), [sortedAppointments, today]);

  const filteredRecords = useMemo(() => (
    medicalRecords.filter((record) => {
      const searchLower = recordSearch.toLowerCase().trim();
      const fullName = `${record.patientId?.firstName || ''} ${record.patientId?.lastName || ''}`.toLowerCase();
      const diagnosis = (record.diagnosis || '').toLowerCase();

      const matchesSearch = !searchLower
        || searchLower.length < 2
        || fullName.includes(searchLower)
        || (searchLower.length >= 4 && diagnosis.includes(searchLower));

      const recordDate = new Date(record.createdAt);
      const matchesFrom = !recordDateFrom || recordDate >= new Date(recordDateFrom);
      const matchesTo = !recordDateTo || recordDate <= new Date(`${recordDateTo}T23:59:59`);

      return matchesSearch && matchesFrom && matchesTo;
    })
  ), [medicalRecords, recordDateFrom, recordDateTo, recordSearch]);

  const clinicalStats = [
    {
      label: 'Today\'s Care',
      value: todaysAppointments.length,
      detail: 'scheduled consultations',
      icon: Calendar
    },
    {
      label: 'Patient Care Records',
      value: stats.totalRecords,
      detail: 'clinical documents saved',
      icon: FileText
    },
    {
      label: 'Active Care Queue',
      value: activeConsultations.length,
      detail: 'online rooms waiting',
      icon: Video
    },
    {
      label: 'Patients This Month',
      value: stats.patientsThisMonth,
      detail: 'seen across visits',
      icon: Users
    }
  ];

  const tabs = [
    { id: 'dashboard', label: 'Today\'s Care', icon: Activity },
    { id: 'consultation', label: 'Documentation Capture', icon: Mic },
    { id: 'appointments', label: 'Clinical Schedule', icon: Calendar },
    { id: 'records', label: 'Care Records', icon: ClipboardList }
  ];

  if (loading) {
    return (
      <main className="doctor-dashboard doctor-loading">
        <Loader2 className="spin" size={34} />
        <p>Loading clinical overview...</p>
      </main>
    );
  }

  return (
    <div className="doctor-dashboard">
      <header className="doctor-topbar">
        <div className="doctor-brand">
          <div className="brand-mark">
            <Stethoscope size={22} />
          </div>
          <div>
            <strong>MedScribe 360</strong>
            <span>Clinical Intelligence</span>
          </div>
        </div>

        <div className="doctor-actions">
          <span className="doctor-identity">{getFullName(user)}</span>

          <div className="notification-wrap">
            <button
              className="icon-button"
              type="button"
              aria-label="Notifications"
              onClick={() => setShowNotifications((current) => !current)}
            >
              <Bell size={19} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="notification-popover" role="dialog" aria-label="Notifications">
                <div className="popover-header">
                  <strong>Clinical Activity</strong>
                  <span>{unreadCount} unread</span>
                </div>

                {notifications.length === 0 ? (
                  <p className="empty-copy">No notifications yet.</p>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification._id}
                      className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                      type="button"
                      onClick={async () => {
                        if (!notification.isRead) {
                          await apiService.markNotificationRead(notification._id);
                          setNotifications((prev) => (
                            prev.map((item) => (
                              item._id === notification._id ? { ...item, isRead: true } : item
                            ))
                          ));
                        }
                      }}
                    >
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <small>{formatDate(notification.createdAt)}</small>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button className="danger-button compact" type="button" onClick={handleLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>

      <main className="doctor-main">
        <section className="doctor-hero">
          <div>
            <span className="eyebrow">Doctor dashboard</span>
            <h1>{greeting}, {doctorName}</h1>
            <p>Here is your clinical overview for today: scheduled care, active consultation rooms, pending requests, and recent documentation.</p>
          </div>
          <div className="hero-care-card">
            <span>Today&apos;s Care</span>
            <strong>{todaysAppointments.length}</strong>
            <p>{stats.upcomingAppointments} upcoming appointments across your schedule</p>
          </div>
        </section>

        <nav className="doctor-tabs" aria-label="Doctor dashboard sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={activeTab === id ? 'active' : ''}
              type="button"
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        {activeTab === 'dashboard' && (
          <section className="doctor-section">
            <div className="clinical-stat-grid">
              {clinicalStats.map(({ label, value, detail, icon: Icon }) => (
                <article className="clinical-stat" key={label}>
                  <div className="stat-icon">
                    <Icon size={20} />
                  </div>
                  <div>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <p>{detail}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="care-layout">
              <section className="clinical-panel wide-panel">
                <div className="panel-title-row">
                  <div>
                    <span className="panel-kicker">Schedule</span>
                    <h2>Today&apos;s consultations</h2>
                  </div>
                  <span className="panel-count">{todaysAppointments.length} today</span>
                </div>

                {todaysAppointments.length === 0 ? (
                  <div className="empty-state">
                    <Calendar size={28} />
                    <p>No consultations scheduled for today.</p>
                  </div>
                ) : (
                  <div className="clinical-timeline">
                    {todaysAppointments.map((appointment) => (
                      <article className="timeline-row" key={appointment._id}>
                        <div className="timeline-time">{formatDate(appointment.date)}</div>
                        <div className="timeline-marker" />
                        <div className="timeline-content">
                          <div>
                            <h3>{getFullName(appointment.patientId)}</h3>
                            <p>{appointment.notes || 'Consultation scheduled'}</p>
                          </div>
                          <span className={`status-pill ${getStatusClass(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <aside className="clinical-panel">
                <div className="panel-title-row">
                  <div>
                    <span className="panel-kicker">Current consultation</span>
                    <h2>Online care queue</h2>
                  </div>
                </div>

                {activeConsultations.length === 0 ? (
                  <div className="empty-state compact">
                    <Video size={24} />
                    <p>No active online rooms.</p>
                  </div>
                ) : (
                  <div className="stack-list">
                    {activeConsultations.map((consultation) => (
                      <article className="queue-card" key={consultation._id}>
                        <div>
                          <span className="state-label">Waiting room open</span>
                          <h3>{getFullName(consultation.patientId)}</h3>
                          <p>{formatDate(consultation.appointmentId?.date)}</p>
                        </div>
                        <button
                          className="primary-button"
                          type="button"
                          onClick={() => handleStartConsultation(consultation)}
                        >
                          <Play size={15} />
                          Start
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </aside>
            </div>

            <div className="care-layout lower">
              <section className="clinical-panel">
                <div className="panel-title-row">
                  <div>
                    <span className="panel-kicker">Pending action</span>
                    <h2>Online consultation requests</h2>
                  </div>
                  <span className="panel-count">{consultationRequests.length} pending</span>
                </div>

                {consultationRequests.length === 0 ? (
                  <div className="empty-state compact">
                    <CheckCircle2 size={24} />
                    <p>No pending online consultation requests.</p>
                  </div>
                ) : (
                  <div className="request-list">
                    {consultationRequests.map((request) => (
                      <article className="request-row" key={request._id}>
                        <div>
                          <h3>{getFullName(request.patientId)}</h3>
                          <p>{formatDate(request.date)}</p>
                        </div>
                        <div className="row-actions">
                          <button
                            className="success-button"
                            type="button"
                            onClick={() => handleRequestDecision(request._id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            className="danger-button ghost"
                            type="button"
                            onClick={() => handleRequestDecision(request._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="clinical-panel">
                <div className="panel-title-row">
                  <div>
                    <span className="panel-kicker">Documentation</span>
                    <h2>Recent patient care activity</h2>
                  </div>
                </div>

                {stats.recentRecords.length === 0 ? (
                  <div className="empty-state compact">
                    <FileText size={24} />
                    <p>No recent records yet.</p>
                  </div>
                ) : (
                  <div className="record-activity">
                    {stats.recentRecords.slice(0, 5).map((record, index) => (
                      <article className="activity-row" key={record._id || index}>
                        <div>
                          <span>Record #{index + 1}</span>
                          <strong>{record.diagnosis || 'General Consultation'}</strong>
                        </div>
                        <time>{formatDate(record.createdAt)}</time>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        )}

        {activeTab === 'consultation' && (
          <section className="doctor-section">
            <div className="section-heading-block">
              <span className="eyebrow">AI-assisted documentation</span>
              <h2>Consultation capture</h2>
              <p>Record the visit, review the transcript, then approve the generated SOAP draft before saving it to the patient record.</p>
            </div>

            <div className="capture-layout">
              <section className="clinical-panel recording-workspace">
                <div className="panel-title-row">
                  <div>
                    <span className="panel-kicker">Recording</span>
                    <h2>Voice capture</h2>
                  </div>
                  <span className={`recording-state ${isRecording ? 'active' : ''}`}>
                    {isRecording ? 'Recording' : 'Ready'}
                  </span>
                </div>

                <label className="field-label" htmlFor="patient-select">
                  Select patient
                </label>
                <select
                  id="patient-select"
                  className="clinical-input"
                  value={selectedPatientId}
                  onChange={(event) => setSelectedPatientId(event.target.value)}
                  disabled={isRecording}
                >
                  <option value="">Choose a patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {getFullName(patient)} ({patient.email})
                    </option>
                  ))}
                </select>

                <button
                  className={`recording-button ${isRecording ? 'stop' : ''}`}
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!isRecording && !selectedPatientId}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? <Square size={34} /> : <Mic size={36} />}
                </button>

                <div className="recording-readout">
                  <strong>{formatTime(recordingTime)}</strong>
                  <span>
                    {isRecording
                      ? 'Recording the consultation'
                      : selectedPatientId
                        ? 'Ready to begin capture'
                        : 'Select a patient to begin'}
                  </span>
                </div>

                {micError && <p className="clinical-alert error">{micError}</p>}

                {audioURL && !isRecording && (
                  <audio className="audio-review" controls src={audioURL}>
                    <track kind="captions" />
                  </audio>
                )}
              </section>

              <section className="clinical-panel transcript-workspace">
                <div className="panel-title-row">
                  <div>
                    <span className="panel-kicker">Live transcript</span>
                    <h2>Conversation text</h2>
                  </div>
                </div>

                {!speechSupported && (
                  <p className="clinical-alert warning">
                    Live transcription is not supported in this browser. Use Chrome or Edge for live text while audio recording continues to work.
                  </p>
                )}

                <div className="transcript-document">
                  {transcription || 'Transcript text will appear here while the consultation is being recorded.'}
                </div>

                <p className="document-note">
                  SOAP documentation is generated after recording stops and remains doctor-reviewed before it is saved.
                </p>
              </section>
            </div>
          </section>
        )}

        {activeTab === 'appointments' && (
          <section className="doctor-section">
            <div className="section-heading-block">
              <span className="eyebrow">Clinical schedule</span>
              <h2>Appointments</h2>
              <p>Upcoming, completed, and cancelled consultations organized as a care schedule.</p>
            </div>

            <section className="clinical-panel schedule-list-panel">
              {appointments.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={30} />
                  <p>No appointments scheduled.</p>
                </div>
              ) : (
                <div className="appointment-schedule">
                  {sortedAppointments.map((appointment) => (
                    <article className="appointment-row" key={appointment._id}>
                      <div className="appointment-date">
                        <Clock size={16} />
                        {formatDate(appointment.date)}
                      </div>
                      <div className="appointment-main">
                        <div>
                          <h3>{getFullName(appointment.patientId)}</h3>
                          <p>{appointment.notes || 'No visit notes added'} - {appointment.duration} min - {appointment.type || 'clinic'}</p>
                        </div>
                        <span className={`status-pill ${getStatusClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      {appointment.status === 'scheduled' && (
                        <div className="row-actions appointment-actions">
                          <button
                            className="success-button"
                            type="button"
                            onClick={async () => {
                              try {
                                await apiService.updateAppointmentStatus(appointment._id, 'completed');
                                loadData();
                              } catch (error) {
                                alert(`Failed to update status: ${error.message}`);
                              }
                            }}
                          >
                            Mark complete
                          </button>
                          <button
                            className="danger-button ghost"
                            type="button"
                            onClick={async () => {
                              if (window.confirm('Cancel this appointment?')) {
                                try {
                                  await apiService.updateAppointmentStatus(appointment._id, 'cancelled');
                                  loadData();
                                } catch (error) {
                                  alert(`Failed to update status: ${error.message}`);
                                }
                              }
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        )}

        {activeTab === 'records' && (
          <section className="doctor-section">
            <div className="records-heading">
              <div className="section-heading-block">
                <span className="eyebrow">Patient care records</span>
                <h2>Clinical documentation</h2>
                <p>Search patient records, review SOAP notes, and update care documentation.</p>
              </div>
              <span className="panel-count">{filteredRecords.length} of {medicalRecords.length} records</span>
            </div>

            <section className="clinical-panel filters-panel">
              <div className="filter-icon">
                <Filter size={18} />
              </div>
              <label className="filter-field">
                <span>Patient or diagnosis</span>
                <div className="search-input-wrap">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search records"
                    value={recordSearch}
                    onChange={(event) => setRecordSearch(event.target.value)}
                  />
                </div>
              </label>
              <label className="filter-field">
                <span>From</span>
                <input
                  type="date"
                  value={recordDateFrom}
                  onChange={(event) => setRecordDateFrom(event.target.value)}
                />
              </label>
              <label className="filter-field">
                <span>To</span>
                <input
                  type="date"
                  value={recordDateTo}
                  onChange={(event) => setRecordDateTo(event.target.value)}
                />
              </label>
              {(recordSearch || recordDateFrom || recordDateTo) && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setRecordSearch('');
                    setRecordDateFrom('');
                    setRecordDateTo('');
                  }}
                >
                  Clear
                </button>
              )}
            </section>

            <section className="clinical-panel records-list-panel">
              {filteredRecords.length === 0 ? (
                <div className="empty-state">
                  <FileText size={30} />
                  <p>{medicalRecords.length === 0 ? 'No medical records found.' : 'No records match your filters.'}</p>
                </div>
              ) : (
                <div className="clinical-record-list">
                  {filteredRecords.map((record) => (
                    <article className="record-row" key={record._id}>
                      <div className="record-marker" />
                      <div className="record-body">
                        <div className="record-title-row">
                          <div>
                            <span className="state-label">Clinical document</span>
                            <h3>{record.diagnosis || 'General Consultation'}</h3>
                            <p>{getFullName(record.patientId)} - {formatDate(record.createdAt)}</p>
                          </div>
                          <button
                            className="primary-button"
                            type="button"
                            onClick={() => handleOpenRecord(record)}
                          >
                            View details
                          </button>
                        </div>

                        {record.soapNotes && (record.soapNotes.assessment || record.soapNotes.plan) && (
                          <div className="soap-preview">
                            {record.soapNotes.assessment && <p><strong>Assessment</strong>{record.soapNotes.assessment}</p>}
                            {record.soapNotes.plan && <p><strong>Plan</strong>{record.soapNotes.plan}</p>}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        )}
      </main>

      {showSoapReview && (
        <div className="modal-overlay">
          <section className="clinical-modal soap-review-modal" role="dialog" aria-modal="true" aria-labelledby="soap-review-title">
            <div className="modal-header">
              <div>
                <span className="panel-kicker">AI-assisted draft</span>
                <h2 id="soap-review-title">Review SOAP notes</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close SOAP review" onClick={() => setShowSoapReview(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="soap-edit-grid">
              {SOAP_FIELDS.map((field) => (
                <label className="soap-edit-field" key={field.key}>
                  <span>{field.label}</span>
                  <textarea
                    value={generatedSoap[field.key]}
                    onChange={(event) => (
                      setGeneratedSoap((prev) => ({
                        ...prev,
                        [field.key]: event.target.value
                      }))
                    )}
                    rows={4}
                  />
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setShowSoapReview(false)}>
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleSaveMedicalRecord}
                disabled={savingRecord}
              >
                {savingRecord ? 'Saving...' : 'Save medical record'}
              </button>
            </div>
          </section>
        </div>
      )}

      {saveSuccess && (
        <div className="toast-success">
          <CheckCircle2 size={18} />
          Medical record saved successfully.
        </div>
      )}

      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <section
            className="clinical-modal record-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="panel-kicker">Patient record</span>
                <h2 id="record-detail-title">Medical record details</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close record details" onClick={() => setSelectedRecord(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="record-identity">
              <UserRound size={18} />
              <span>{getFullName(selectedRecord.patientId)}</span>
              <time>{formatDate(selectedRecord.createdAt)}</time>
            </div>

            <div className="record-detail-section">
              <label className="record-field">
                <span>Diagnosis</span>
                {editingRecord ? (
                  <input
                    type="text"
                    value={editedRecord.diagnosis}
                    onChange={(event) => (
                      setEditedRecord((prev) => ({
                        ...prev,
                        diagnosis: event.target.value
                      }))
                    )}
                  />
                ) : (
                  <p>{selectedRecord.diagnosis || 'Not provided'}</p>
                )}
              </label>
            </div>

            {selectedRecord.voiceTranscription && (
              <div className="record-detail-section">
                <h3>Voice transcription</h3>
                <p className="transcript-note">{selectedRecord.voiceTranscription}</p>
              </div>
            )}

            <div className="record-detail-section">
              <h3>SOAP notes</h3>
              <div className="soap-detail-grid">
                {SOAP_FIELDS.map((field) => (
                  <label className="record-field" key={field.key}>
                    <span>{field.label}</span>
                    {editingRecord ? (
                      <textarea
                        value={editedRecord.soapNotes[field.key]}
                        onChange={(event) => (
                          setEditedRecord((prev) => ({
                            ...prev,
                            soapNotes: {
                              ...prev.soapNotes,
                              [field.key]: event.target.value
                            }
                          }))
                        )}
                      />
                    ) : (
                      <p>{selectedRecord.soapNotes?.[field.key] || 'Not provided'}</p>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="record-detail-section">
              <label className="record-field">
                <span>Prescription</span>
                {editingRecord ? (
                  <textarea
                    value={editedRecord.prescription}
                    onChange={(event) => (
                      setEditedRecord((prev) => ({
                        ...prev,
                        prescription: event.target.value
                      }))
                    )}
                  />
                ) : (
                  <p>{selectedRecord.prescription || 'Not provided'}</p>
                )}
              </label>
            </div>

            <div className="modal-actions">
              {editingRecord ? (
                <>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setEditingRecord(false);
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
                  <button className="primary-button" type="button" onClick={handleUpdateMedicalRecord}>
                    Save changes
                  </button>
                </>
              ) : (
                <>
                  <button className="secondary-button" type="button" onClick={() => setSelectedRecord(null)}>
                    Close
                  </button>
                  <button className="primary-button" type="button" onClick={() => setEditingRecord(true)}>
                    Edit record
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
