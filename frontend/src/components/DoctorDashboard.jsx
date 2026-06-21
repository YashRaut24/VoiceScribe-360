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

  const loadData = async () => {
    try {
        const [appointmentsData, recordsData, patientsData] = await Promise.all([
            apiService.getAppointments(),
            apiService.getMedicalRecords(),
            apiService.getPatients()
        ]);
        setAppointments(appointmentsData);
        setMedicalRecords(recordsData);
        setPatients(patientsData);
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
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const url = URL.createObjectURL(audioBlob);
              setAudioURL(url);

              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingTime(0);
      } catch (error) {
          console.error('Microphone access error:', error);
          setMicError('Microphone access was denied or is unavailable. Please allow microphone permissions and try again.');
      }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    
    const mockRecord = {
          patientId: selectedPatientId,
          voiceTranscription: transcription + ' [Recording stopped at ' + formatTime(recordingTime) + ']',
          soapNotes: {
              subjective: 'Patient reports persistent headache for 3 days with mild nausea',
              objective: 'Patient appears alert, vital signs stable',
              assessment: 'Tension headache, likely stress-related',
              plan: 'Prescribe mild analgesic, recommend rest and hydration'
          },
          diagnosis: 'Tension Headache (G44.2)',
          prescription: 'Ibuprofen 400mg, take twice daily with food for 3 days'
      };

      try {
          await apiService.createMedicalRecord(mockRecord);
          loadData();
          setCurrentConsultation(null);
          setTranscription('');
          setRecordingTime(0);
          setSelectedPatientId('');
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
            <span>Dr. {user?.firstName} {user?.lastName}</span>
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
                    <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{appointments.length}</h3>
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
                    <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{medicalRecords.length}</h3>
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
                    <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>24</h3>
                    <p style={{ margin: 0, color: '#64748b' }}>Patients This Month</p>
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
              {medicalRecords.slice(0, 5).map((record, index) => (
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
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Medical Records</h2>
            
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {medicalRecords.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <FileText size={48} style={{ margin: '0 auto 1rem' }} />
                  <p>No medical records found</p>
                </div>
              ) : (
                medicalRecords.map((record, index) => (
                  <div key={index} style={{
                    padding: '1.5rem',
                    borderBottom: index < medicalRecords.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                          {record.diagnosis || 'General Consultation'}
                        </h4>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                          {formatDate(record.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedRecord(record)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                      }}>
                        View Details
                      </button>
                    </div>
                    
                    {record.soapNotes && (
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        <p><strong>Assessment:</strong> {record.soapNotes.assessment}</p>
                        <p><strong>Plan:</strong> {record.soapNotes.plan}</p>
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
