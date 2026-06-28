import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, FileText, Stethoscope, Activity, Shield, Lock, Heart, LogOut } from 'lucide-react';
import './PatientDashboard.css';
import { useAuth } from '../contexts/useAuth';
import apiService from '../services/api';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [metrics, setMetrics] = useState({
        symptomCount: 0,
        totalAppointments: 0,
        upcomingAppointments: 0
    });

    useEffect(() => {
        const loadMetrics = async () => {
            try {
                const [symptoms, appointments] = await Promise.all([
                    apiService.getSymptoms(),
                    apiService.getAppointments()
                ]);

                const now = new Date();
                const upcoming = appointments.filter(a =>
                    new Date(a.date) > now && a.status === 'scheduled'
                ).length;

                setMetrics({
                    symptomCount: symptoms.length,
                    totalAppointments: appointments.length,
                    upcomingAppointments: upcoming
                });
            } catch (error) {
                console.error('Failed to load metrics:', error);
            }
        };

        loadMetrics();
    }, []);

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
          <h1 className="welcome-title">
              {user?.firstName ? `Hello, ${user.firstName}!` : 'Feeling unusual lately?'}
          </h1>
          <p className="welcome-subtitle">
            Don't let symptoms fade before your doctor's visit. Capture your health journey naturally.
          </p>
          <button className="btn-start-logging" onClick={handleStartLogging}>
            Start Logging Symptoms
            <ArrowRight />
          </button>
        </section>

        <section style={{ padding: '1rem 0 2rem 0' }}>
          <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
          }}>
              <div style={{ backgroundColor: 'white', padding: '1.25rem',
                  borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ backgroundColor: '#dbeafe', padding: '0.75rem',
                      borderRadius: '0.5rem' }}>
                      <FileText size={20} style={{ color: '#3b82f6' }} />
                  </div>
                  <div>
                      <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>
                          {metrics.symptomCount}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                          Symptom Logs
                      </p>
                  </div>
              </div>

              <div style={{ backgroundColor: 'white', padding: '1.25rem',
                  borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ backgroundColor: '#d1fae5', padding: '0.75rem',
                      borderRadius: '0.5rem' }}>
                      <Stethoscope size={20} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                      <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>
                          {metrics.totalAppointments}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                          Total Appointments
                      </p>
                  </div>
              </div>

              <div style={{ backgroundColor: 'white', padding: '1.25rem',
                  borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ backgroundColor: '#fef3c7', padding: '0.75rem',
                      borderRadius: '0.5rem' }}>
                      <Activity size={20} style={{ color: '#f59e0b' }} />
                  </div>
                  <div>
                      <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>
                          {metrics.upcomingAppointments}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                          Upcoming Appointments
                      </p>
                  </div>
              </div>
          </div>
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
