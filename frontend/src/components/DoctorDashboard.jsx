import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Square
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import apiService from '../services/api';

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
  const [stats, setStats] = useState({
      totalAppointments: 0,
      totalRecords: 0,
      upcomingAppointments: 0,
      patientsThisMonth: 0,
      recentRecords: []
  });

  useEffect(() => {
    loadData();
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
          const [appointmentsData, recordsData, patientsData, statsData] = await Promise.all([
              apiService.getAppointments(),
              apiService.getMedicalRecords(),
              apiService.getPatients(),
              apiService.getDashboardStats()
          ]);
          setAppointments(appointmentsData);
          setMedicalRecords(recordsData);
          setPatients(patientsData);
          setStats(statsData);
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

      try {
          await apiService.createMedicalRecord(mockRecord);
          loadData();
          setCurrentConsultation(null);
          setTranscription('');
          transcriptRef.current = '';
          setRecordingTime(0);
          setSelectedPatientId('');
          setAudioURL(null);
      } catch (error) {
          console.error('Error saving record:', error);
          alert('Failed to save medical record: ' + error.message);
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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>{user?.firstName} {user?.lastName}</span>
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
                    borderBottom: index < appointments.length - 1 ? '1px solid #e2e8f0' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
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
                            <button onClick={() => setSelectedRecord(record)}
                                style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white',
                                    border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.875rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                {selectedRecord.diagnosis || 'General Consultation'}
              </h2>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Patient: {selectedRecord.patientId?.firstName} {selectedRecord.patientId?.lastName} • {formatDate(selectedRecord.createdAt)}
            </p>

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
                <h4 style={{ marginBottom: '0.5rem' }}>SOAP Notes</h4>
                <p style={{ marginBottom: '0.5rem' }}><strong>Subjective:</strong> {selectedRecord.soapNotes.subjective}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Objective:</strong> {selectedRecord.soapNotes.objective}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Assessment:</strong> {selectedRecord.soapNotes.assessment}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Plan:</strong> {selectedRecord.soapNotes.plan}</p>
              </div>
            )}

            {selectedRecord.prescription && (
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Prescription</h4>
                <p style={{ color: '#475569' }}>{selectedRecord.prescription}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default DoctorDashboard;
