import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, FileText, Stethoscope, Activity, Shield, Lock, Heart, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartLogging = () => {
    navigate('/patient/log-symptoms');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="patient-dashboard">
      {/* Top Navigation Bar */}
      <nav className="dashboard-navbar">
        <div className="dashboard-navbar-content">
          <div className="dashboard-logo">
            <span>VoiceScribe-360</span>
          </div>
          <div className="dashboard-profile" style={{ position: 'relative' }} ref={profileMenuRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <User />
              <span>{user?.firstName} {user?.lastName}</span>
              <ChevronDown size={16} />
            </button>
            
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                minWidth: '150px',
                zIndex: 1000,
                marginTop: '0.5rem'
              }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#ef4444',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-container">
        {/* Welcome Section */}
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

        {/* Care Journey Section */}
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
              <button className="journey-action disabled">
                View Care Summary
              </button>
            </div>
          </div>
        </section>

        {/* How VoiceScribe Works */}
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

        {/* Privacy & Trust Section */}
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

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>&copy; 2026 VoiceScribe-360. Built for GDG AI Hackathon 2.0.</p>
      </footer>
    </div>
  );
};

export default PatientDashboard;