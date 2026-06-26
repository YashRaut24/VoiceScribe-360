import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import apiService from '../services/api';

const PatientTimeline = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [timelineItems, setTimelineItems] = useState([]);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [shareSuccess, setShareSuccess] = useState(false);

    useEffect(() => {
        loadTimeline();
    }, []);

    const loadTimeline = async () => {
        setLoading(true);
        try {
            const [symptoms, appointments, records] = await Promise.all([
                apiService.getSymptoms(),
                apiService.getAppointments(),
                apiService.getMedicalRecords()
            ]);

            const symptomItems = symptoms.map(s => ({
                id: s._id,
                type: 'symptom',
                date: new Date(s.createdAt),
                title: 'Symptom Log',
                description: s.symptomsText,
                structured: s.structuredData,
                deletable: true
            }));

            const appointmentItems = appointments.map(a => ({
                id: a._id,
                type: 'appointment',
                date: new Date(a.date),
                title: `Appointment with Dr. ${a.doctorId?.firstName} ${a.doctorId?.lastName}`,
                description: a.notes || 'No notes',
                status: a.status,
                duration: a.duration,
                deletable: false
            }));

            const recordItems = records.map(r => ({
                id: r._id,
                type: 'record',
                date: new Date(r.createdAt),
                title: r.diagnosis || 'General Consultation',
                description: r.soapNotes?.subjective || 'No details available',
                doctor: `Dr. ${r.doctorId?.firstName} ${r.doctorId?.lastName}`,
                deletable: false
            }));

            const merged = [...symptomItems, ...appointmentItems, ...recordItems]
                .sort((a, b) => b.date - a.date);

            setTimelineItems(merged);
        } catch (err) {
            setError('Failed to load timeline. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await apiService.deleteSymptom(id);
            setDeleteConfirm(null);
            loadTimeline();
        } catch (err) {
            setError('Failed to delete entry.');
        }
    };

    const handleShare = () => {
        const summary = timelineItems.map(item => {
            const dateStr = item.date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            return `[${dateStr}] ${item.title}: ${item.description}`;
        }).join('\n');

        const fullText = `Health Timeline for ${user?.firstName} ${user?.lastName}\n${'='.repeat(40)}\n${summary}`;

        navigator.clipboard.writeText(fullText).then(() => {
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 3000);
        });
    };

    const getTypeColor = (type) => {
        if (type === 'symptom') return { bg: '#dbeafe', border: '#3b82f6', dot: '#3b82f6' };
        if (type === 'appointment') return { bg: '#d1fae5', border: '#10b981', dot: '#10b981' };
        return { bg: '#fef3c7', border: '#f59e0b', dot: '#f59e0b' };
    };

    const getTypeLabel = (type) => {
        if (type === 'symptom') return 'Symptom Log';
        if (type === 'appointment') return 'Appointment';
        return 'Medical Record';
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading your timeline...</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/patient-dashboard')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '1rem' }}>
                            ← Back
                        </button>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>My Health Timeline</h1>
                    </div>
                    <button onClick={handleShare}
                        style={{ padding: '0.5rem 1rem', backgroundColor: shareSuccess ? '#10b981' : '#3b82f6',
                            color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                        {shareSuccess ? '✓ Copied!' : 'Share Timeline'}
                    </button>
                </div>
            </nav>

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                {error && (
                    <div style={{ backgroundColor: '#fee', border: '1px solid #fcc', padding: '1rem',
                        borderRadius: '0.5rem', marginBottom: '1rem', color: '#c00' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    {[
                        { type: 'symptom', label: 'Symptom Logs' },
                        { type: 'appointment', label: 'Appointments' },
                        { type: 'record', label: 'Medical Records' }
                    ].map(({ type, label }) => {
                        const colors = getTypeColor(type);
                        const count = timelineItems.filter(i => i.type === type).length;
                        return (
                            <div key={type} style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
                                padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500' }}>
                                {count} {label}
                            </div>
                        );
                    })}
                </div>

                {timelineItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                        <p style={{ fontSize: '1.25rem' }}>No health events recorded yet.</p>
                        <button onClick={() => navigate('/patient/log-symptoms')}
                            style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6',
                                color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                            Log Your First Symptom
                        </button>
                    </div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '20px', top: 0, bottom: 0,
                            width: '2px', backgroundColor: '#e2e8f0' }} />

                        {timelineItems.map((item, index) => {
                            const colors = getTypeColor(item.type);
                            return (
                                <div key={item.id} style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', position: 'relative' }}>
                                    <div style={{ width: '42px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                        <div style={{ width: '14px', height: '14px', borderRadius: '50%',
                                            backgroundColor: colors.dot, border: '3px solid white',
                                            boxShadow: `0 0 0 2px ${colors.dot}`, marginTop: '1.25rem', flexShrink: 0 }} />
                                    </div>

                                    <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '0.5rem',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.25rem',
                                        border: `1px solid ${colors.border}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                            <div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: colors.dot,
                                                    textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {getTypeLabel(item.type)}
                                                </span>
                                                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: '600' }}>
                                                    {item.title}
                                                </h3>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                    {formatDate(item.date)}
                                                </span>
                                                {item.deletable && (
                                                    <button onClick={() => setDeleteConfirm(item.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer',
                                                            color: '#ef4444', fontSize: '1rem', padding: '0 0.25rem' }}>
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <p style={{ margin: 0, color: '#475569', fontSize: '0.875rem', lineHeight: '1.5' }}>
                                            {item.description}
                                        </p>

                                        {item.type === 'appointment' && (
                                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem',
                                                    borderRadius: '9999px', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                                                    {item.duration} min
                                                </span>
                                                <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem',
                                                    borderRadius: '9999px',
                                                    backgroundColor: item.status === 'scheduled' ? '#dbeafe' : item.status === 'completed' ? '#d1fae5' : '#fee2e2',
                                                    color: item.status === 'scheduled' ? '#1e40af' : item.status === 'completed' ? '#065f46' : '#991b1b' }}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        )}

                                        {item.type === 'record' && item.doctor && (
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                                                {item.doctor}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {deleteConfirm && (
                <div onClick={() => setDeleteConfirm(null)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={e => e.stopPropagation()}
                        style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '2rem',
                            maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>Delete this symptom log?</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setDeleteConfirm(null)}
                                style={{ padding: '0.5rem 1.5rem', border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem', cursor: 'pointer', backgroundColor: 'white' }}>
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)}
                                style={{ padding: '0.5rem 1.5rem', backgroundColor: '#ef4444',
                                    color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientTimeline;