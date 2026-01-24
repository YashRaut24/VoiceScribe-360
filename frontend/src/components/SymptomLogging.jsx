import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic } from 'lucide-react';
import './SymptomLogging.css';

const SymptomLogging = () => {
  const navigate = useNavigate();
  const [symptomText, setSymptomText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleBack = () => {
    navigate('/patient-dashboard');
  };

  const handleSpeakClick = () => {
    setIsListening(!isListening);
    // Voice recording logic will be added later
    console.log('Speak button clicked');
  };

  const handleTextChange = (e) => {
    setSymptomText(e.target.value);
  };

  return (
    <div className="symptom-logging">
      {/* Top Bar with Back Button */}
      <div className="logging-header">
        <button className="back-button" onClick={handleBack}>
          <ArrowLeft />
          <span>Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="logging-container">
        <div className="logging-content">
          <h1 className="logging-title">Begin Symptom Logging</h1>
          <p className="logging-subtitle">
            Describe what you're experiencing. Be as detailed or casual as you'd like.
          </p>

          {/* Text Input Area */}
          <div className="input-section">
            <textarea
              className="symptom-textarea"
              placeholder="Type about your symptoms...

Example: 'Had a headache since yesterday morning, feeling tired, slight fever in the evening...'"
              value={symptomText}
              onChange={handleTextChange}
            />
          </div>

          {/* OR Divider */}
          <div className="divider-section">
            <div className="divider-line"></div>
            <span className="divider-text">OR</span>
            <div className="divider-line"></div>
          </div>

          {/* Speak Button */}
          <div className="speak-section">
            <button 
              className={`speak-button ${isListening ? 'listening' : ''}`}
              onClick={handleSpeakClick}
            >
              <div className="speak-icon">
                <Mic />
              </div>
              <span className="speak-label">
                {isListening ? 'Listening...' : 'Speak'}
              </span>
            </button>
            <p className="speak-hint">
              Click to start voice recording
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomLogging;