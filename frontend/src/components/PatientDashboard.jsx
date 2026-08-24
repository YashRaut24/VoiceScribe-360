import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Calendar,
  ClipboardList,
  FileText,
  HeartPulse,
  Lock,
  LogOut,
  Shield,
  Stethoscope,
  User,
  Video
} from 'lucide-react';
import './PatientDashboard.css';
import { useAuth } from '../contexts/useAuth';
import apiService from '../services/api';

const getConsultationStatus = (status) => {
  const labels = {
    scheduled: 'Pending review',
    accepted: 'Accepted',
    rejected: 'Rejected',
    completed: 'Completed'
  };

  return labels[status] || status || 'Unknown';
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [metrics, setMetrics] = useState({
    symptomCount: 0,
    totalAppointments: 0,
    upcomingAppointments: 0
  });
  const [onlineConsultations, setOnlineConsultations] = useState([]);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [symptoms, appointments, consultations] = await Promise.all([
          apiService.getSymptoms(),
          apiService.getAppointments(),
          apiService.getMyOnlineConsultations()
        ]);

        const now = new Date();
        const upcoming = appointments.filter((appointment) => (
          new Date(appointment.date) > now && appointment.status === 'scheduled'
        )).length;

        setOnlineConsultations(consultations);
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

  const acceptedConsultations = onlineConsultations.filter((consultation) => consultation.status === 'accepted');
  const patientName = user?.firstName ? user.firstName : 'there';

  const journeyStats = [
    {
      label: 'Symptom history',
      value: metrics.symptomCount,
      detail: 'logged health updates',
      icon: HeartPulse
    },
    {
      label: 'Care visits',
      value: metrics.totalAppointments,
      detail: 'appointments created',
      icon: Stethoscope
    },
    {
      label: 'Upcoming care',
      value: metrics.upcomingAppointments,
      detail: 'scheduled next steps',
      icon: Calendar
    }
  ];

  return (
    <div className="patient-dashboard">
      <nav className="patient-topbar">
        <div className="patient-brand">
          <div className="patient-brand-mark">
            <HeartPulse size={22} />
          </div>
          <div>
            <strong>MedScribe 360</strong>
            <span>Patient care portal</span>
          </div>
        </div>

        <div className="patient-profile">
          <span>{user?.firstName} {user?.lastName}</span>
          <button className="patient-logout" type="button" onClick={handleLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      <main className="patient-container">
        <section className="patient-hero">
          <div>
            <span className="patient-eyebrow">Your Health Journey</span>
            <h1>Hello, {patientName}</h1>
            <p>Track symptoms, prepare for consultations, and keep your care history organized in one calm workspace.</p>
            <div className="patient-hero-actions">
              <button className="patient-primary-btn" type="button" onClick={handleStartLogging}>
                <HeartPulse size={18} />
                Log symptoms
              </button>
              <button className="patient-secondary-btn" type="button" onClick={handleBookAppointment}>
                <Calendar size={18} />
                Book appointment
              </button>
            </div>
          </div>

          <aside className="next-care-panel">
            <span>Next step</span>
            <strong>{acceptedConsultations.length > 0 ? 'Join waiting room' : 'Prepare care notes'}</strong>
            <p>
              {acceptedConsultations.length > 0
                ? 'Your doctor has accepted an online consultation.'
                : `${metrics.upcomingAppointments} upcoming appointments need your latest symptom context.`}
            </p>
          </aside>
        </section>

        <section className="patient-stat-strip" aria-label="Health journey summary">
          {journeyStats.map(({ label, value, detail, icon: Icon }) => (
            <article className="patient-stat" key={label}>
              <Icon size={20} />
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="patient-grid">
          <div className="patient-panel journey-panel">
            <div className="patient-panel-header">
              <div>
                <span className="patient-eyebrow">Care timeline</span>
                <h2>Your complete care journey</h2>
              </div>
              <button className="patient-link-btn" type="button" onClick={() => navigate('/patient/timeline')}>
                View timeline
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="journey-steps">
              <article className="journey-step active">
                <div className="journey-marker">
                  <FileText size={18} />
                </div>
                <div>
                  <span>Pre-consultation</span>
                  <h3>Capture symptoms</h3>
                  <p>Describe what you are experiencing through text or voice before details fade.</p>
                  <button type="button" onClick={handleStartLogging}>Begin symptom logging</button>
                </div>
              </article>

              <article className="journey-step">
                <div className="journey-marker">
                  <Video size={18} />
                </div>
                <div>
                  <span>Consultation</span>
                  <h3>Meet your doctor</h3>
                  <p>Join accepted online consultations and keep the conversation focused on care.</p>
                  <button type="button" onClick={handleBookAppointment}>Schedule care</button>
                </div>
              </article>

              <article className="journey-step">
                <div className="journey-marker">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <span>Post-consultation</span>
                  <h3>Review records</h3>
                  <p>See symptoms, appointments, and clinical notes in chronological context.</p>
                  <button type="button" onClick={() => navigate('/patient/timeline')}>Open health timeline</button>
                </div>
              </article>
            </div>
          </div>

          <aside className="patient-panel consultations-panel">
            <div className="patient-panel-header">
              <div>
                <span className="patient-eyebrow">Online care</span>
                <h2>Consultations</h2>
              </div>
            </div>

            {onlineConsultations.length === 0 ? (
              <div className="patient-empty">
                <Video size={26} />
                <p>No online consultations yet.</p>
              </div>
            ) : (
              <div className="consultation-feed">
                {onlineConsultations.map((consultation) => (
                  <article className="consultation-feed-item" key={consultation._id}>
                    <div>
                      <span className={`patient-status status-${consultation.status}`}>
                        {getConsultationStatus(consultation.status)}
                      </span>
                      <h3>Dr. {consultation.doctorId.firstName} {consultation.doctorId.lastName}</h3>
                      <p>{consultation.doctorId.specialization}</p>
                    </div>

                    {consultation.status === 'accepted' && (
                      <button
                        className="patient-primary-btn small"
                        type="button"
                        onClick={() => navigate(`/patient/waiting-room/${consultation._id}`)}
                      >
                        Join waiting room
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </aside>
        </section>

        <section className="patient-trust-band">
          <article>
            <Shield size={20} />
            <div>
              <h3>Privacy first</h3>
              <p>Health information stays protected and access-controlled.</p>
            </div>
          </article>
          <article>
            <Lock size={20} />
            <div>
              <h3>Your control</h3>
              <p>You choose when to capture, review, and share details.</p>
            </div>
          </article>
          <article>
            <User size={20} />
            <div>
              <h3>Human-centered</h3>
              <p>Designed to support patients before and after visits.</p>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default PatientDashboard;
