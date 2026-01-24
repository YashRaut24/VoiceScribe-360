import React, { useState } from 'react';
import { User, ArrowLeft } from 'lucide-react';
import './SymptomLogging.css';

const SymptomLogging = () => {
  const [view, setView] = useState('initial'); // 'initial', 'logging', 'summary'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [inputMode, setInputMode] = useState(null); // 'type' or 'speak'
  const [symptomText, setSymptomText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loggedSymptoms, setLoggedSymptoms] = useState([]);
  const [careSessions, setCareSessions] = useState(['Care Session 001']);

  const handleTypeClick = () => {
    setInputMode('type');
  };

  const handleSpeakClick = () => {
    setInputMode('speak');
    setIsRecording(!isRecording);
    // Simulate voice recording
    if (!isRecording) {
      setTimeout(() => {
        const newSymptom = {
          id: Date.now(),
          code: 'Mild code',
          timestamp: new Date().toLocaleString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          hasAudio: true,
          hasText: false
        };
        setLoggedSymptoms([...loggedSymptoms, newSymptom]);
        setView('logging');
        setIsRecording(false);
      }, 2000);
    }
  };

  const handleSubmitText = () => {
    if (symptomText.trim()) {
      const newSymptom = {
        id: Date.now(),
        code: symptomText.substring(0, 20),
        timestamp: new Date().toLocaleString('en-GB', {
          weekday: 'long',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        hasAudio: false,
        hasText: true
      };
      setLoggedSymptoms([...loggedSymptoms, newSymptom]);
      setSymptomText('');
      setView('logging');
      setInputMode(null);
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

  const handleBack = () => {
    if (view === 'summary') {
      setView('initial');
      setLoggedSymptoms([]);
      setInputMode(null);
    } else {
      window.history.back();
    }
  };

  return (
    <div className="symptom-logging-new">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="profile-section">
            <div className="profile-circle">
              <User size={40} />
            </div>
            <p className="profile-name">Name</p>
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
                    <span className="session-count"> {String(loggedSymptoms.length).padStart(3, '0')}</span>
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

      {/* Main Content */}
      <main className="main-content">
        {view !== 'summary' && (
          <>
            <div className="input-controls">
              <button 
                className={`control-btn ${inputMode === 'type' ? 'active' : ''}`}
                onClick={handleTypeClick}
              >
                Type
              </button>
              <span className="or-text">OR</span>
              <button 
                className={`control-btn ${inputMode === 'speak' || isRecording ? 'active' : ''}`}
                onClick={handleSpeakClick}
              >
                {isRecording ? 'Recording...' : 'Speak'}
              </button>
            </div>

            <p className="instruction-text">About your symptoms</p>

            {inputMode === 'type' && view === 'initial' && (
              <div className="text-input-area">
                <textarea
                  className="symptom-textarea"
                  placeholder="Describe your symptoms..."
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  rows={8}
                />
                <button className="submit-btn" onClick={handleSubmitText}>
                  Submit
                </button>
              </div>
            )}
          </>
        )}

        {view === 'logging' && (
          <>
            <div className="symptoms-log">
              {loggedSymptoms.map((symptom) => (
                <div key={symptom.id} className="symptom-card">
                  <div className="symptom-avatar-circle">
                    <User size={24} />
                  </div>
                  <div className="symptom-info">
                    <span className="symptom-code">{symptom.code}</span>
                    <div className="symptom-icons">
                      {symptom.hasText && <span className="icon-indicator">📝</span>}
                      {symptom.hasAudio && <span className="icon-indicator">🎤</span>}
                    </div>
                  </div>
                  <span className="symptom-timestamp">{symptom.timestamp}</span>
                </div>
              ))}
            </div>

            <div className="action-buttons">
              <button className="action-btn">Generate timeline</button>
              <button className="action-btn">Ask Clinsight AI</button>
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
              <p>Your symptom logging session has been completed. {loggedSymptoms.length} symptoms were recorded.</p>
            </div>

            <div className="summary-actions">
              <button className="summary-btn">Timeline</button>
              <button className="summary-btn">Share 📤</button>
            </div>

            <div className="nearby-doctors">
              <h3>Nearby Doctors</h3>
              <button className="select-doctor-btn">Select Doctor</button>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
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
    </div>
  );
};

export default SymptomLogging;