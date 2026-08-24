import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  HeartPulse,
  Loader2,
  Share2,
  Trash2,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import apiService from '../services/api';
import './PatientTimeline.css';

const typeConfig = {
  symptom: {
    label: 'Symptom log',
    icon: HeartPulse
  },
  appointment: {
    label: 'Appointment',
    icon: Calendar
  },
  record: {
    label: 'Medical record',
    icon: ClipboardList
  }
};

const PatientTimeline = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timelineItems, setTimelineItems] = useState([]);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  const loadTimeline = async () => {
    setLoading(true);

    try {
      const [symptoms, appointments, records] = await Promise.all([
        apiService.getSymptoms(),
        apiService.getAppointments(),
        apiService.getMedicalRecords()
      ]);

      const symptomItems = symptoms.map((symptom) => ({
        id: symptom._id,
        type: 'symptom',
        date: new Date(symptom.createdAt),
        title: 'Symptom Log',
        description: symptom.symptomsText,
        structured: symptom.structuredData,
        deletable: true
      }));

      const appointmentItems = appointments.map((appointment) => ({
        id: appointment._id,
        type: 'appointment',
        date: new Date(appointment.date),
        title: `Appointment with Dr. ${appointment.doctorId?.firstName || ''} ${appointment.doctorId?.lastName || ''}`.trim(),
        description: appointment.notes || 'No visit notes added',
        status: appointment.status,
        duration: appointment.duration,
        deletable: false
      }));

      const recordItems = records.map((record) => ({
        id: record._id,
        type: 'record',
        date: new Date(record.createdAt),
        title: record.diagnosis || 'General Consultation',
        description: record.soapNotes?.subjective || 'No details available',
        doctor: `Dr. ${record.doctorId?.firstName || ''} ${record.doctorId?.lastName || ''}`.trim(),
        deletable: false
      }));

      setTimelineItems(
        [...symptomItems, ...appointmentItems, ...recordItems].sort((a, b) => b.date - a.date)
      );
    } catch (loadError) {
      console.error(loadError);
      setError('Failed to load timeline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  const handleDelete = async (id) => {
    try {
      await apiService.deleteSymptom(id);
      setDeleteConfirm(null);
      loadTimeline();
    } catch (deleteError) {
      console.error(deleteError);
      setError('Failed to delete entry.');
    }
  };

  const handleShare = () => {
    const summary = timelineItems.map((item) => {
      const dateStr = item.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      return `[${dateStr}] ${item.title}: ${item.description}`;
    }).join('\n');

    const fullText = `Health Timeline for ${user?.firstName} ${user?.lastName}\n${'='.repeat(40)}\n${summary}`;

    navigator.clipboard.writeText(fullText).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    });
  };

  const formatDate = (date) => date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const counters = [
    { type: 'symptom', label: 'Symptom logs' },
    { type: 'appointment', label: 'Appointments' },
    { type: 'record', label: 'Medical records' }
  ];

  if (loading) {
    return (
      <main className="timeline-page timeline-loading">
        <Loader2 className="spin" size={32} />
        <p>Loading your health timeline...</p>
      </main>
    );
  }

  return (
    <main className="timeline-page">
      <section className="timeline-shell">
        <nav className="timeline-topbar">
          <button className="timeline-back" type="button" onClick={() => navigate('/patient-dashboard')}>
            <ArrowLeft size={18} />
            Back
          </button>

          <button className="timeline-share" type="button" onClick={handleShare}>
            {shareSuccess ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
            {shareSuccess ? 'Copied' : 'Share timeline'}
          </button>
        </nav>

        <header className="timeline-header">
          <span>Patient care record</span>
          <h1>My health timeline</h1>
          <p>Symptoms, appointments, and medical records arranged chronologically for easier review.</p>
        </header>

        {error && <div className="timeline-error" role="alert">{error}</div>}

        <section className="timeline-counters" aria-label="Timeline summary">
          {counters.map(({ type, label }) => {
            const Icon = typeConfig[type].icon;
            const count = timelineItems.filter((item) => item.type === type).length;

            return (
              <article className={`timeline-counter type-${type}`} key={type}>
                <Icon size={18} />
                <div>
                  <strong>{count}</strong>
                  <span>{label}</span>
                </div>
              </article>
            );
          })}
        </section>

        {timelineItems.length === 0 ? (
          <section className="timeline-empty">
            <FileText size={34} />
            <h2>No health events recorded yet</h2>
            <p>Start by logging a symptom or booking your first appointment.</p>
            <button type="button" onClick={() => navigate('/patient/log-symptoms')}>
              Log your first symptom
            </button>
          </section>
        ) : (
          <section className="timeline-list" aria-label="Health events">
            {timelineItems.map((item) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;

              return (
                <article className={`timeline-item type-${item.type}`} key={item.id}>
                  <div className="timeline-item-marker">
                    <Icon size={18} />
                  </div>

                  <div className="timeline-item-card">
                    <div className="timeline-item-header">
                      <div>
                        <span>{config.label}</span>
                        <h2>{item.title}</h2>
                      </div>

                      <div className="timeline-item-meta">
                        <time>{formatDate(item.date)}</time>
                        {item.deletable && (
                          <button
                            type="button"
                            aria-label="Delete symptom log"
                            onClick={() => setDeleteConfirm(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p>{item.description}</p>

                    {item.structured && (
                      <div className="timeline-structured">
                        {item.structured.symptoms?.length > 0 && <span>Symptoms: {item.structured.symptoms.join(', ')}</span>}
                        {item.structured.duration && <span>Duration: {item.structured.duration}</span>}
                        {item.structured.severity && <span>Severity: {item.structured.severity}</span>}
                        {item.structured.frequency && <span>Frequency: {item.structured.frequency}</span>}
                        {item.structured.progression && <span>Progression: {item.structured.progression}</span>}
                      </div>
                    )}

                    {item.type === 'appointment' && (
                      <div className="timeline-tags">
                        <span>{item.duration} min</span>
                        <span className={`status-${item.status}`}>{item.status}</span>
                      </div>
                    )}

                    {item.type === 'record' && item.doctor && (
                      <small>{item.doctor}</small>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>

      {deleteConfirm && (
        <div className="timeline-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <section className="timeline-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="timeline-modal-close" type="button" aria-label="Close" onClick={() => setDeleteConfirm(null)}>
              <X size={18} />
            </button>
            <h2>Delete this symptom log?</h2>
            <p>This removes the entry from your health timeline.</p>
            <div className="timeline-modal-actions">
              <button type="button" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button type="button" className="danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default PatientTimeline;
