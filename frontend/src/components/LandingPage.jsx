import React, { useState } from 'react';
import { Menu, X, Mic, FileText, Activity, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-content">
            <div className="navbar-logo">
              <Mic />
              <span>VoiceScribe</span>
            </div>
            
            <div className="navbar-menu">
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#benefits">Benefits</a>
              <a href="/login">Login</a>
              <a href="/signup" className="navbar-cta">Get Started</a>
            </div>

            <button className="navbar-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#benefits">Benefits</a>
            <a href="/login">Login</a>
            <a href="/signup" className="navbar-cta">Get Started</a>
          </div>
        )}
      </nav>

      <section className="hero-section">
        <div className="hero-container">
          <h1 className="hero-title">
            Medical Documentation,<br />
            <span>Simplified with AI</span>
          </h1>
          <p className="hero-description">
            Capture medical conversations, generate clinical records instantly, and unlock early health intelligence—all while keeping doctors focused on patients.
          </p>
          <div className="hero-buttons">
            <a href="/signup" className="btn-primary">
              Start Free Trial
              <ArrowRight style={{ marginLeft: '0.5rem' }} />
            </a>
            <a href="#how-it-works" className="btn-secondary">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Three Stages, One Solution</h2>
            <p className="section-subtitle">Complete healthcare documentation workflow</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FileText />
              </div>
              <h3 className="feature-title">Before Visit</h3>
              <h4 className="feature-subtitle">SymptomTimeline</h4>
              <p className="feature-description">
                Patients log symptoms casually via voice or text. Build accurate timelines with no memory gaps.
              </p>
              <ul className="feature-list">
                <li>
                  <CheckCircle />
                  <span>Track symptom progression</span>
                </li>
                <li>
                  <CheckCircle />
                  <span>Automated timeline generation</span>
                </li>
                <li>
                  <CheckCircle />
                  <span>Clear patient history</span>
                </li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Mic />
              </div>
              <h3 className="feature-title">During Visit</h3>
              <h4 className="feature-subtitle">VoiceScribe AI</h4>
              <p className="feature-description">
                Record natural conversations. Generate SOAP notes, prescriptions, and instructions in seconds.
              </p>
              <ul className="feature-list">
                <li>
                  <CheckCircle />
                  <span>5 min → 30 sec documentation</span>
                </li>
                <li>
                  <CheckCircle />
                  <span>Automatic SOAP notes</span>
                </li>
                <li>
                  <CheckCircle />
                  <span>More doctor-patient focus</span>
                </li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Activity />
              </div>
              <h3 className="feature-title">After Visit</h3>
              <h4 className="feature-subtitle">Health Intelligence</h4>
              <p className="feature-description">
                Transform data into insights. Detect patterns, predict trends, enable early intervention.
              </p>
              <ul className="feature-list">
                <li>
                  <CheckCircle />
                  <span>Pattern detection</span>
                </li>
                <li>
                  <CheckCircle />
                  <span>Early warning signals</span>
                </li>
                <li>
                  <CheckCircle />
                  <span>Anonymized insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Simple, natural, effective</p>
          </div>

          <div>
            <div className="workflow-step">
              <div className="workflow-content">
                <div className="step-number">1</div>
                <h3 className="workflow-title">Start Consultation</h3>
                <p className="workflow-description">
                  Doctor opens the app and clicks "Start Consultation". VoiceScribe listens silently in the background while you focus on your patient.
                </p>
              </div>
              <div className="workflow-image">
                <Mic />
              </div>
            </div>

            <div className="workflow-step">
              <div className="workflow-content">
                <div className="step-number">2</div>
                <h3 className="workflow-title">Natural Conversation</h3>
                <p className="workflow-description">
                  Speak naturally with your patient. Ask questions, discuss symptoms, explain treatment. VoiceScribe understands medical context automatically.
                </p>
              </div>
              <div className="workflow-image">
                <FileText />
              </div>
            </div>

            <div className="workflow-step">
              <div className="workflow-content">
                <div className="step-number">3</div>
                <h3 className="workflow-title">Instant Documentation</h3>
                <p className="workflow-description">
                  Click "Stop" and within seconds receive complete SOAP notes, structured prescriptions, patient instructions, and follow-up plans. Review, edit, approve.
                </p>
              </div>
              <div className="workflow-image">
                <Activity />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="benefits-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Why VoiceScribe?</h2>
            <p className="section-subtitle">Built for modern healthcare</p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <Shield />
              </div>
              <h3 className="benefit-title">Privacy First</h3>
              <p className="benefit-description">
                Anonymized data, doctor approval required, HIPAA-compliant architecture
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <CheckCircle />
              </div>
              <h3 className="benefit-title">No Behavior Change</h3>
              <p className="benefit-description">
                Works with natural conversation. No templates, no forced workflows
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <Activity />
              </div>
              <h3 className="benefit-title">Real Intelligence</h3>
              <p className="benefit-description">
                Detects patterns before labs can, enables preventive action
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <Mic />
              </div>
              <h3 className="benefit-title">Doctor Focused</h3>
              <p className="benefit-description">
                Reduces burnout, increases patient interaction, better care quality
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">
            Ready to Transform Your Practice?
          </h2>
          <p className="cta-description">
            Join doctors who've reduced documentation time by 90% while improving patient care.
          </p>
          <a href="/signup" className="btn-primary">
            Get Started Free
            <ArrowRight style={{ marginLeft: '0.5rem' }} />
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <Mic />
                <span>VoiceScribe</span>
              </div>
              <p className="footer-description">
                AI-powered medical documentation and health intelligence.
              </p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#">Pricing</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Privacy</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 VoiceScribe. Built for GDG AI Hackathon 2.0.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;