import { useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle,
  ClipboardList,
  FileText,
  Menu,
  Mic,
  Shield,
  Stethoscope,
  X
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-content">
            <div className="navbar-logo">
              <Stethoscope />
              <span>MedScribe 360</span>
            </div>

            <div className="navbar-menu">
              <a href="#features">Features</a>
              <a href="#how-it-works">Workflow</a>
              <a href="#benefits">Trust</a>
              <a href="/login">Login</a>
              <a href="/signup" className="navbar-cta">Get Started</a>
            </div>

            <button
              className="navbar-toggle"
              type="button"
              aria-label="Toggle menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu">
            <a href="#features">Features</a>
            <a href="#how-it-works">Workflow</a>
            <a href="#benefits">Trust</a>
            <a href="/login">Login</a>
            <a href="/signup" className="navbar-cta">Get Started</a>
          </div>
        )}
      </nav>

      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-copy">
            <span className="landing-eyebrow">Clinical Intelligence Platform</span>
            <h1 className="hero-title">
              MedScribe 360
            </h1>
            <p className="hero-description">
              Manage consultations, transcription, SOAP documentation, appointments, and patient health timelines in one calm clinical workspace.
            </p>
            <div className="hero-buttons">
              <a href="/signup" className="btn-primary">
                Start clinical workspace
                <ArrowRight size={18} />
              </a>
              <a href="#how-it-works" className="btn-secondary">
                See workflow
              </a>
            </div>
          </div>

          <div className="hero-clinical-visual" aria-hidden="true">
            <div className="visual-header">
              <span>Today&apos;s Care</span>
              <strong>5 consultations</strong>
            </div>
            <div className="visual-row active">
              <span>09:30</span>
              <div>
                <strong>Current consultation</strong>
                <p>Transcript active - SOAP draft pending</p>
              </div>
            </div>
            <div className="visual-row">
              <span>10:15</span>
              <div>
                <strong>Follow-up visit</strong>
                <p>Patient symptoms updated</p>
              </div>
            </div>
            <div className="visual-soap">
              <span>AI-assisted draft</span>
              <div />
              <div />
              <div />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="landing-eyebrow">Care lifecycle</span>
            <h2 className="section-title">Three stages, one clinical system</h2>
            <p className="section-subtitle">Patient preparation, live consultation, and post-visit documentation stay connected.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FileText />
              </div>
              <h3 className="feature-title">Before visit</h3>
              <h4 className="feature-subtitle">Symptom timeline</h4>
              <p className="feature-description">
                Patients log symptoms by voice or text and create a clear chronology before the appointment.
              </p>
              <ul className="feature-list">
                <li><CheckCircle /><span>Track symptom progression</span></li>
                <li><CheckCircle /><span>Prepare visit context</span></li>
                <li><CheckCircle /><span>Reduce memory gaps</span></li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Mic />
              </div>
              <h3 className="feature-title">During visit</h3>
              <h4 className="feature-subtitle">AI-assisted documentation</h4>
              <p className="feature-description">
                Record natural conversations, review transcripts, and generate doctor-approved SOAP drafts.
              </p>
              <ul className="feature-list">
                <li><CheckCircle /><span>Audio recording</span></li>
                <li><CheckCircle /><span>Live transcript workflow</span></li>
                <li><CheckCircle /><span>Reviewable SOAP notes</span></li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Activity />
              </div>
              <h3 className="feature-title">After visit</h3>
              <h4 className="feature-subtitle">Patient care record</h4>
              <p className="feature-description">
                Keep consultations, appointments, symptoms, and clinical notes organized chronologically.
              </p>
              <ul className="feature-list">
                <li><CheckCircle /><span>Medical history timeline</span></li>
                <li><CheckCircle /><span>Clinical activity feed</span></li>
                <li><CheckCircle /><span>Documentation persistence</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <span className="landing-eyebrow">Workflow</span>
            <h2 className="section-title">Built around the consultation</h2>
            <p className="section-subtitle">The interface mirrors clinical work instead of generic admin tasks.</p>
          </div>

          <div className="workflow-list">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <div className="workflow-content">
                <h3 className="workflow-title">Start consultation</h3>
                <p className="workflow-description">
                  Doctor joins the consultation room, confirms patient identity, and starts recording when ready.
                </p>
              </div>
              <div className="workflow-image">
                <Mic />
              </div>
            </div>

            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="workflow-content">
                <h3 className="workflow-title">Capture conversation</h3>
                <p className="workflow-description">
                  The transcript becomes structured clinical context while the patient and doctor continue naturally.
                </p>
              </div>
              <div className="workflow-image">
                <ClipboardList />
              </div>
            </div>

            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="workflow-content">
                <h3 className="workflow-title">Approve documentation</h3>
                <p className="workflow-description">
                  SOAP notes are generated as a draft, reviewed by the doctor, then saved to the patient record.
                </p>
              </div>
              <div className="workflow-image">
                <FileText />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="benefits-section">
        <div className="section-container">
          <div className="section-header">
            <span className="landing-eyebrow">Trust</span>
            <h2 className="section-title">Why MedScribe 360?</h2>
            <p className="section-subtitle">Designed for calm, auditable healthcare work.</p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <Shield />
              </div>
              <h3 className="benefit-title">Privacy first</h3>
              <p className="benefit-description">Clinical records stay access-controlled and reviewable.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <CheckCircle />
              </div>
              <h3 className="benefit-title">Doctor approval</h3>
              <p className="benefit-description">AI output is positioned as documentation assistance, not autonomous diagnosis.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <Activity />
              </div>
              <h3 className="benefit-title">Care continuity</h3>
              <p className="benefit-description">Symptoms, appointments, and records stay connected across the care journey.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <Mic />
              </div>
              <h3 className="benefit-title">Less paperwork</h3>
              <p className="benefit-description">Doctors can focus more attention on the patient conversation.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to enter the clinical workspace?</h2>
          <p className="cta-description">
            Start with the doctor or patient dashboard and follow the care lifecycle end to end.
          </p>
          <a href="/signup" className="btn-primary">
            Get started
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <Stethoscope />
                <span>MedScribe 360</span>
              </div>
              <p className="footer-description">
                Clinical documentation and patient care workflow software.
              </p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">Workflow</a></li>
                <li><a href="#benefits">Trust</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Care</h4>
              <ul>
                <li><a href="/login">Doctor login</a></li>
                <li><a href="/login">Patient login</a></li>
                <li><a href="/signup">Create account</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Platform</h4>
              <ul>
                <li><a href="#features">Transcription</a></li>
                <li><a href="#features">SOAP notes</a></li>
                <li><a href="#features">Health timeline</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 MedScribe 360.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
