import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, FileText, Stethoscope, Activity, Shield, Lock, Heart, LogOut } from 'lucide-react';
import './PatientDashboard.css';
import { useAuth } from '../contexts/useAuth';

const PatientDashboard = () => {
  const navigate = useNavigate();
 
  const { logout } = useAuth();

  const handleLogout = () => {
      logout();
      navigate('/');
  };

  const handleStartLogging = () => {
    navigate('/patient/log-symptoms');
  };

  const handleBookAppointment = () => {
      navigate('/patient/book-appointment');
  };

  return (
    <div className="patient-dashboard">
      
     <nav className="dashboard-navbar">
        <div className="dashboard-navbar-content">
            <div className="dashboard-logo">
                <span>MedScribe 360</span>
            </div>
            <div className="dashboard-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <User />
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
      </nav>

      
      <div className="dashboard-container">
        
        <section className="welcome-section">
          <h1 className="welcome-title">Feeling unusual lately?</h1>
          <p className="welcome-subtitle">
            Don't let symptoms fade before your doctor's visit. Capture your health journey naturally.
          </p>
          <button className="btn-start-logging" onClick={handleStartLogging}>
            Start Logging Symptoms
            <ArrowRight />
          </button>
        </section>

        
        <section className="care-journey-section">
          <h2 className="section-heading">Your Complete Care Journey</h2>
          <div className="care-journey-grid">
            <div className="journey-card">
              <div className="journey-icon">
                <FileText />
              </div>
              <h3 className="journey-title">Pre-Consultation</h3>
              <h4 className="journey-subtitle">Capture</h4>
              <p className="journey-description">
                Log symptoms naturally via voice or text as they happen.
              </p>
              <button className="journey-action" onClick={handleStartLogging}>
                Begin Symptom Logging
              </button>
              <button className="journey-action journey-action-secondary" onClick={handleBookAppointment}>
    Book Appointment
</button>
            </div>

            <div className="journey-card">
              <div className="journey-icon">
                <Stethoscope />
              </div>
              <h3 className="journey-title">Consultation</h3>
              <h4 className="journey-subtitle">Documentation</h4>
              <p className="journey-description">
                Let your doctor focus on you while the system structures the conversation.
              </p>
              <button className="journey-action disabled">
                Start Consultation Mode
              </button>
            </div>

            <div className="journey-card">
              <div className="journey-icon">
                <Activity />
              </div>
              <h3 className="journey-title">Post-Consultation</h3>
              <h4 className="journey-subtitle">Intelligence</h4>
              <p className="journey-description">
                Passively analyze anonymized data. Contribute to early health awareness.
              </p>
              <button className="journey-action" onClick={() => navigate('/patient/timeline')}>
                  View My Timeline
              </button>
            </div>
          </div>
        </section>

        
        <section className="info-section">
          <h2 className="section-heading">How VoiceScribe-360 Works</h2>
          <div className="info-content">
            <div className="info-item">
              <h3>Privacy & Trust Security</h3>
              <p>
                Your health data is anonymized and encrypted. We never share identifiable information 
                without your explicit consent.
              </p>
            </div>
            <div className="info-item">
              <h3>Why VoiceScribe-360 Exists</h3>
              <p>
                We believe in empowering patients and doctors. By capturing symptoms naturally and 
                documenting visits seamlessly, we enable better care and early detection.
              </p>
            </div>
          </div>
        </section>

        
        <section className="trust-section">
          <div className="trust-grid">
            <div className="trust-card">
              <Shield />
              <h4>Privacy First</h4>
              <p>End-to-end encryption</p>
            </div>
            <div className="trust-card">
              <Lock />
              <h4>Your Control</h4>
              <p>You decide what to share</p>
            </div>
            <div className="trust-card">
              <Heart />
              <h4>Human-Centered</h4>
              <p>Built for real people</p>
            </div>
          </div>
        </section>
      </div>

      
      <footer className="dashboard-footer">
        <p>&copy; 2026 VoiceScribe-360. Built for GDG AI Hackathon 2.0.</p>
      </footer>
    </div>
  );
};

export default PatientDashboard;
