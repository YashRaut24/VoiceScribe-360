import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
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
      const [appointmentsData, recordsData] = await Promise.all([
        apiService.getAppointments(),
        apiService.getMedicalRecords()
      ]);
      setAppointments(appointmentsData);
      setMedicalRecords(recordsData);
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

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setTranscription('');
    // Simulate transcription
    setTimeout(() => {
      setTranscription('Patient reports headache for the past 3 days, accompanied by mild nausea...');
    }, 3000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    
    // Simulate AI processing
    const mockRecord = {
      patientId: '507f1f77bcf86cd799439011',
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
    } catch (error) {
      console.error('Error saving record:', error);
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
      {/* Header */}
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
        {/* Navigation Tabs */}
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

        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Dashboard Overview</h2>
            
            {/* Stats Cards */}
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

            {/* Recent Activity */}
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

        {/* Voice Consultation */}
        {activeTab === 'consultation' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Voice Consultation</h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem'
            }}>
              {/* Recording Controls */}
              <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Voice Recording</h3>
                
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: isRecording ? '#ef4444' : '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <Square size={40} color="white" /> : <Mic size={40} color="white" />}
                </div>
                
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  {formatTime(recordingTime)}
                </div>
                
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                  {isRecording ? 'Recording in progress...' : 'Click to start consultation recording'}
                </p>
                
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: isRecording ? '#ef4444' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
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
              
              {/* Live Transcription */}
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

        {/* Medical Records */}
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
                      <button style={{
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
    </div>
  );
};

export default DoctorDashboard;