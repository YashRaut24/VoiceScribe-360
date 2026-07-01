import React, { useState, useEffect, useRef } from 'react';import { User, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import './SymptomLogging.css';
import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';

const SymptomLogging = () => {
  const [view, setView] = useState('initial'); // 'initial', 'logging', 'summary'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [textInput, setTextInput] = useState(false);
  const [speakInput, setSpeakInput] = useState(false);
  const [symptomText, setSymptomText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [careSessions, setCareSessions] = useState(['Care Session 001']);
  const [fetchedSymptoms, setFetchedSymptoms] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micError, setMicError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const { user } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const symptoms = await api.getSymptoms();
        setFetchedSymptoms(symptoms);
      } catch (error) {
        console.error('Error fetching symptoms:', error);
      }
    };
    fetchSymptoms();
  }, []);

  const handleTypeClick = () => {
    setTextInput(!textInput);
  };

  useEffect(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
        setSpeechSupported(false);
    }
  }, []);

  const handleSpeakClick = async () => {
      if (isRecording) {
          if (recognitionRef.current) {
              recognitionRef.current.stop();
              recognitionRef.current = null;
          }

          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
          }

          setIsRecording(false);
          setSpeakInput(false);

          const finalText = transcriptRef.current.trim();
          if (finalText) {
              try {
                  await api.createSymptom(finalText);
                  const symptoms = await api.getSymptoms();
                  setFetchedSymptoms(symptoms);
                  setView('logging');
              } catch (error) {
                  console.error('Error submitting spoken symptom:', error);
              }
          }

          setLiveTranscript('');
          transcriptRef.current = '';
          return;
      }

      setMicError('');
      setLiveTranscript('');
      transcriptRef.current = '';
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
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          setSpeakInput(true);

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
                  setLiveTranscript(finalTranscript + interimTranscript);
              };

              recognition.onerror = (event) => {
                  console.error('Speech recognition error:', event.error);
              };

              recognition.start();
          }
      } catch (error) {
          console.error('Microphone error:', error);
          setMicError('Microphone access denied. Please allow microphone permissions.');
          setIsRecording(false);
          setSpeakInput(false);
      }
  };

const handleSubmitText = async () => {
    if (!symptomText.trim()) return;

    if (symptomText.trim().length < 10) {
      setSubmitError('Please describe your symptoms in at least 10 characters');
      return;
    }

    setSubmitError('');

    try {
        await api.createSymptom(symptomText);
        setSymptomText('');
        setView('logging');
        const symptoms = await api.getSymptoms();
        setFetchedSymptoms(symptoms);
    } catch (error) {
        const message = error.errors && error.errors.length > 0
            ? error.errors.join(', ')
            : error.message;
        setSubmitError(message);
    }
};

  const handleStopSession = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmStop = (confirmed) => {
    setShowConfirmModal(false);
    if (confirmed) {
      setView('summary');
    }
  };

  const handleShare = () => {
      const summary = fetchedSymptoms.map(s => {
          const dateStr = new Date(s.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric'
          });
          return `[${dateStr}] ${s.symptomsText}`;
      }).join('\n');
      const fullText = `Symptom Log for ${user?.firstName} ${user?.lastName}\n${'='.repeat(40)}\n${summary}`;
      navigator.clipboard.writeText(fullText).then(() => {
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
      });
  };

  const handleAnalyzeSymptoms = async () => {
      try {
          setAnalysisLoading(true);
          setAnalysisError('');

          const symptoms = fetchedSymptoms.map(symptom => symptom.symptomsText);

          const response = await api.analyzeSymptoms(symptoms);

          setAnalysis(response.analysis);
          setShowAnalysisModal(true);
      } catch (error) {
          setAnalysisError(error.message || 'Failed to analyze symptoms');
          setShowAnalysisModal(true);
      } finally {
          setAnalysisLoading(false);
      }
  };

  const handleBack = () => {
      if (view === 'summary') {
        setView('initial');
      } else {
        window.history.back();
      }
  };
  return (
    <div className="symptom-logging-new">
      
      <aside className="sidebar">
        <div className="sidebar-content">
        <div className="profile-section">
            <div className="profile-circle">
                <User size={40} />
            </div>
            <p className="profile-name">{user?.firstName} {user?.lastName}</p>
        </div>

          <div className="care-sessions-section">
            <h3 className="care-sessions-title">Care Sessions</h3>
            <div className="care-sessions-list">
              {careSessions.map((session, index) => (
                <div 
                  key={index} 
                  className={`care-session-item ${index === careSessions.length - 1 ? 'active' : ''}`}
                >
                  {session}
                  {index === careSessions.length - 1 && view === 'logging' && (
                    <span className="session-count"> {String(fetchedSymptoms.length).padStart(3, '0')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={18} />
          Back
        </button>
      </aside>

      
      <main className="main-content">
        {view !== 'summary' && (
          <>
<div className="input-controls">
    <button
        className={`control-btn ${textInput ? 'active' : ''}`}
        onClick={handleTypeClick}
    >
        Type
    </button>
    <span className="or-text">OR</span>
    <button
        className={`control-btn ${speakInput || isRecording ? 'active' : ''}`}
        onClick={handleSpeakClick}
    >
        {isRecording ? 'Recording...' : 'Speak'}
    </button>
</div>

{micError && (
    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
        {micError}
    </p>
)}

{isRecording && (
    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0fdf4',
        border: '1px solid #86efac', borderRadius: '0.5rem' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
            🎤 Recording... speak your symptoms. Click "Recording..." to stop.
        </p>
        <p style={{ margin: 0, color: '#374151', fontSize: '0.9rem', minHeight: '40px' }}>
            {liveTranscript || 'Listening...'}
        </p>
    </div>
)}

{!speechSupported && (
    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem',
        backgroundColor: '#fef3c7', border: '1px solid #f59e0b',
        borderRadius: '0.375rem', fontSize: '0.8rem', color: '#92400e' }}>
        Live transcription not supported in this browser. Use Chrome or Edge.
    </div>
)}

            <p className="instruction-text">About your symptoms</p>
            {textInput && (
              <div className="text-input-area">
                <textarea
                  className="symptom-textarea"
                  placeholder="Describe your symptoms..."
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  rows={8}
                />
                {submitError && (
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    {submitError}
                  </p>
                )}
                <button className="submit-btn" onClick={handleSubmitText}>
                  Submit
                </button>
              </div>
            )}
            {fetchedSymptoms.length > 0 && (
              <div className="fetched-symptoms-log">
                {fetchedSymptoms.map((symptom) => (
                  <div key={symptom._id} className="symptom-card">
                    <div className="symptom-avatar-circle">
                      <User size={24} />
                    </div>
                    <div className="symptom-info">
                      <span className="symptom-code">{symptom.symptomsText}</span>
                      {symptom.structuredData && (
                        <div className="structured-data">
                          {symptom.structuredData.symptoms && symptom.structuredData.symptoms.length > 0 && (
                            <div className="data-item">
                              <strong>Symptoms:</strong> {symptom.structuredData.symptoms.join(', ')}
                            </div>
                          )}
                          {symptom.structuredData.duration && (
                            <div className="data-item">
                              <strong>Duration:</strong> {symptom.structuredData.duration}
                            </div>
                          )}
                          {symptom.structuredData.severity && (
                            <div className="data-item">
                              <strong>Severity:</strong> {symptom.structuredData.severity}
                            </div>
                          )}
                          {symptom.structuredData.frequency && (
                            <div className="data-item">
                              <strong>Frequency:</strong> {symptom.structuredData.frequency}
                            </div>
                          )}
                          {symptom.structuredData.progression && (
                            <div className="data-item">
                              <strong>Progression:</strong> {symptom.structuredData.progression}
                            </div>
                          )}
                          {symptom.structuredData.notes && (
                            <div className="data-item">
                              <strong>Notes:</strong> {symptom.structuredData.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="symptom-timestamp">{new Date(symptom.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            
          </>
        )}

        {fetchedSymptoms.length > 0 && view !== 'summary' && (
          <>

            <div className="action-buttons">
              <button className="action-btn" onClick={() => navigate('/patient/timeline')}>
                  Generate timeline
              </button>
              <button className="action-btn" onClick={handleAnalyzeSymptoms}>
                  Ask Clinsight AI
              </button>
              <button className="action-btn" onClick={handleStopSession}>
                Stop session
              </button>
            </div>
          </>
        )}

        {view === 'summary' && (
          <div className="summary-view">
            <h2 className="summary-title">Stopped Successfully</h2>
            <p className="summary-subtitle">Here is overall summary</p>
            
            <div className="summary-card">
              <h3>Summary</h3>
              <p>Your symptom logging session has been completed. {fetchedSymptoms.length} symptoms were recorded.</p>
            </div>

            <div className="summary-actions">
              <button className="summary-btn" onClick={() => navigate('/patient/timeline')}>
                  Timeline
              </button>
              <button className="summary-btn" onClick={handleShare}>
                  {shareSuccess ? '✓ Copied!' : 'Share 📤'}
              </button>
            </div>

            <div className="nearby-doctors">
              <h3>Nearby Doctors</h3>
              <button className="select-doctor-btn" onClick={() => navigate('/patient/book-appointment')}>
                  Select Doctor
              </button>
            </div>
          </div>
        )}
      </main>

      
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Are you sure?</h3>
            <div className="modal-buttons">
              <button 
                className="modal-btn no-btn"
                onClick={() => handleConfirmStop(false)}
              >
                No
              </button>
              <button 
                className="modal-btn yes-btn"
                onClick={() => handleConfirmStop(true)}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnalysisModal && (
        <div className="analysis-modal-overlay">
          <div className="analysis-modal">
            <div className="analysis-modal-header">
              <h2>🧠 Clinsight AI Analysis</h2>

              <button
                className="analysis-close-btn"
                onClick={() => setShowAnalysisModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="analysis-modal-body">
              {analysisLoading ? (
                <p>Analyzing your symptoms...</p>
              ) : analysisError ? (
                <p className="analysis-error">{analysisError}</p>
              ) : (
                <p className="analysis-text">{analysis}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomLogging;
