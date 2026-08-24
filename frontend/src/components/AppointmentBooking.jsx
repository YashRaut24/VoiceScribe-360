import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, Clock, FileText, Loader2, Stethoscope, Video } from 'lucide-react';
import apiService from '../services/api';
import './AppointmentBooking.css';

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
    type: 'clinic',
    duration: 30,
    notes: ''
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await apiService.getDoctors();
        setDoctors(data);
      } catch (error) {
        console.error('Doctor fetch failed', error);
        alert(error.message);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      const dateTime = new Date(`${form.date}T${form.time}`).toISOString();

      await apiService.createAppointment({
        doctorId: form.doctorId,
        date: dateTime,
        type: form.type,
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
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="appointment-booking booking-success">
        <section className="booking-success-panel">
          <CheckCircle2 size={38} />
          <h1>Appointment booked</h1>
          <p>Redirecting you back to your health journey.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="appointment-booking">
      <section className="booking-shell">
        <button className="booking-back" type="button" onClick={() => navigate('/patient-dashboard')}>
          <ArrowLeft size={18} />
          Back to dashboard
        </button>

        <header className="booking-header">
          <span>Clinical schedule</span>
          <h1>Book an appointment</h1>
          <p>Choose the doctor, visit type, and timing that best matches your care needs.</p>
        </header>

        {errors.length > 0 && (
          <div className="booking-errors" role="alert">
            {errors.map((err) => <p key={err}>{err}</p>)}
          </div>
        )}

        {loadingDoctors ? (
          <div className="booking-loading">
            <Loader2 className="spin" size={26} />
            <p>Loading care providers...</p>
          </div>
        ) : (
          <form className="booking-form" onSubmit={handleSubmit}>
            <label className="booking-field">
              <span>Select doctor</span>
              <div className="field-control with-icon">
                <Stethoscope size={18} />
                <select name="doctorId" value={form.doctorId} onChange={handleChange} required>
                  <option value="">Choose a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div className="booking-type-group" role="radiogroup" aria-label="Consultation type">
              <label className={`booking-type ${form.type === 'clinic' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="type"
                  value="clinic"
                  checked={form.type === 'clinic'}
                  onChange={handleChange}
                />
                <Stethoscope size={20} />
                <span>Clinic visit</span>
              </label>

              <label className={`booking-type ${form.type === 'online' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="type"
                  value="online"
                  checked={form.type === 'online'}
                  onChange={handleChange}
                />
                <Video size={20} />
                <span>Online consultation</span>
              </label>
            </div>

            <div className="booking-grid">
              <label className="booking-field">
                <span>Date</span>
                <div className="field-control with-icon">
                  <Calendar size={18} />
                  <input type="date" name="date" value={form.date} onChange={handleChange} required />
                </div>
              </label>

              <label className="booking-field">
                <span>Time</span>
                <div className="field-control with-icon">
                  <Clock size={18} />
                  <input type="time" name="time" value={form.time} onChange={handleChange} required />
                </div>
              </label>
            </div>

            <label className="booking-field">
              <span>Duration</span>
              <select name="duration" value={form.duration} onChange={handleChange}>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>

            <label className="booking-field">
              <span>Visit notes</span>
              <div className="field-control textarea-control">
                <FileText size={18} />
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Describe your reason for visit"
                />
              </div>
            </label>

            <button className="booking-submit" type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="spin" size={18} /> : <Calendar size={18} />}
              {submitting ? 'Booking...' : 'Book appointment'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default AppointmentBooking;
