import React, { useState } from 'react';
import { User, ArrowLeft, Mic, Square, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const SymptomLogging = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState(null);
  const [symptomText, setSymptomText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loggedSymptoms, setLoggedSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [recognition, setRecognition] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBack = () => {
    navigate('/patient-dashboard');
  };

  const handleSubmitText = async () => {
    if (symptomText.trim()) {
      setLoading(true);
      try {
        await apiService.createSymptom(symptomText, 'mild');
        const newSymptom = {
          id: Date.now(),
          text: symptomText,
          timestamp: new Date().toLocaleString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          hasText: true
        };
        setLoggedSymptoms([...loggedSymptoms, newSymptom]);
        setSymptomText('');
        setInputMode(null);
      } catch (error) {
        console.error('Error submitting symptoms:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSpeakClick = () => {
    if (!isRecording) {
      setIsRecording(true);
      setVoiceText('');
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setVoiceText(prev => prev + finalTranscript + ' ');
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };
        
        recognitionInstance.onend = () => {
          setIsRecording(false);
        };
        
        recognitionInstance.start();
        setRecognition(recognitionInstance);
      } else {
        setTimeout(() => {
          setVoiceText('Voice recognition not supported. Sample: I have been experiencing headaches for 3 days.');
          setIsRecording(false);
        }, 2000);
      }
    } else {
      setIsRecording(false);
      if (recognition) {
        recognition.stop();
      }
      if (voiceText.trim()) {
        const newSymptom = {
          id: Date.now(),
          text: voiceText.trim(),
          timestamp: new Date().toLocaleString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          hasAudio: true
        };
        setLoggedSymptoms([...loggedSymptoms, newSymptom]);
        apiService.createSymptom(voiceText.trim(), 'mild').catch(console.error);
      }
    }
  };

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
        {/* Back Button */}
        <button
          onClick={handleBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginBottom: '2rem',
            color: '#374151'
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Log Your Symptoms</h2>

        {/* Input Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Text Input */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Type Your Symptoms</h3>
            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder="Describe your symptoms in detail..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                resize: 'vertical',
                marginBottom: '1rem',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={handleSubmitText}
              disabled={!symptomText.trim() || loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: symptomText.trim() && !loading ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                cursor: symptomText.trim() && !loading ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Saving...' : 'Submit Symptoms'}
            </button>
          </div>

          {/* Voice Input */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Voice Recording</h3>
            
            {/* Voice Recognition Display */}
            {voiceText && (
              <div style={{
                minHeight: '100px',
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '1rem',
                lineHeight: '1.5',
                textAlign: 'left'
              }}>
                <strong>Recognized Text:</strong><br/>
                {voiceText}
              </div>
            )}
            
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
            onClick={handleSpeakClick}
            >
              {isRecording ? <Square size={40} color="white" /> : <Mic size={40} color="white" />}
            </div>
            
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
            </p>
            
            <button
              onClick={handleSpeakClick}
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
        </div>

        {/* Logged Symptoms */}
        {loggedSymptoms.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Your Logged Symptoms</h3>
            </div>
            
            {loggedSymptoms.map((symptom) => (
              <div key={symptom.id} style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#374151', fontWeight: '500' }}>
                    {symptom.text}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {symptom.timestamp}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {symptom.hasText && <span>📝</span>}
                      {symptom.hasAudio && <span>🎤</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomLogging;