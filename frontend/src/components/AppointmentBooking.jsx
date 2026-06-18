import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const AppointmentBooking = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        doctorId: '',
        date: '',
        time: '',
        duration: 30,
        notes: ''
    });

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const data = await apiService.getDoctors();
                setDoctors(data);
            } catch (error) {
                console.error('Failed to fetch doctors:', error);
            } finally {
                setLoadingDoctors(false);
            }
        };
        fetchDoctors();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        setSubmitting(true);

        try {
            const dateTime = new Date(`${form.date}T${form.time}`).toISOString();

            await apiService.createAppointment({
                doctorId: form.doctorId,
                date: dateTime,
                duration: Number(form.duration),
                notes: form.notes
            });

            setSuccess(true);
            setTimeout(() => navigate('/patient-dashboard'), 2000);
        } catch (error) {
                if (error.errors && error.errors.length > 0) {
                    setErrors(error.errors);
                } else {
                    setErrors([error.message]);
                }
            }finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Appointment Booked Successfully</h2>
                <p>Redirecting you back to dashboard...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
            <button onClick={() => navigate('/patient-dashboard')} style={{ marginBottom: '20px', cursor: 'pointer' }}>
                ← Back to Dashboard
            </button>

            <h1>Book an Appointment</h1>

            {errors.length > 0 && (
                <div style={{ background: '#fee', border: '1px solid #fcc', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
                    {errors.map((err, i) => <p key={i} style={{ margin: '4px 0', color: '#c00' }}>{err}</p>)}
                </div>
            )}

            {loadingDoctors ? <p>Loading doctors...</p> : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label>Select Doctor</label>
                        <select name="doctorId" value={form.doctorId} onChange={handleChange} required
                            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}>
                            <option value="">-- Choose a doctor --</option>
                            {doctors.map(doc => (
                                <option key={doc._id} value={doc._id}>
                                    Dr. {doc.firstName} {doc.lastName} — {doc.specialization}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Date</label>
                        <input type="date" name="date" value={form.date} onChange={handleChange} required
                            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }} />
                    </div>

                    <div>
                        <label>Time</label>
                        <input type="time" name="time" value={form.time} onChange={handleChange} required
                            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }} />
                    </div>

                    <div>
                        <label>Duration (minutes)</label>
                        <select name="duration" value={form.duration} onChange={handleChange}
                            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}>
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>60 minutes</option>
                        </select>
                    </div>

                    <div>
                        <label>Notes (optional)</label>
                        <textarea name="notes" value={form.notes} onChange={handleChange}
                            placeholder="Describe your reason for visit..."
                            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', minHeight: '80px' }} />
                    </div>

                    <button type="submit" disabled={submitting}
                        style={{ padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}>
                        {submitting ? 'Booking...' : 'Book Appointment'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default AppointmentBooking;