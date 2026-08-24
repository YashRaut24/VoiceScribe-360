import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Loader2, Stethoscope, Video } from 'lucide-react';
import apiService from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import './PatientWaitingRoom.css';

const PatientWaitingRoom = () => {
  const { appointmentId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorConnected, setDoctorConnected] = useState(false);
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleConnect = () => {
      console.log('Patient connected:', socket.id);
    };

    const handleParticipantUpdate = ({ doctorConnected: isDoctorConnected }) => {
      setDoctorConnected(Boolean(isDoctorConnected));
    };

    socket.on('connect', handleConnect);
    socket.on('participant-update', handleParticipantUpdate);

    const loadSession = async () => {
      try {
        const data = await apiService.getConsultationSessionByAppointment(appointmentId);
        setSession(data);

        const joinRoom = () => {
          socket.emit('join-room', {
            roomId: data.roomId,
            role: 'patient'
          });
        };

        if (socket.connected) {
          joinRoom();
        } else {
          socket.once('connect', joinRoom);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('participant-update', handleParticipantUpdate);
    };
  }, [appointmentId, socket]);

  if (loading) {
    return (
      <main className="waiting-room waiting-centered">
        <Loader2 className="spin" size={32} />
        <p>Loading consultation room...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="waiting-room waiting-centered">
        <Video size={34} />
        <h1>Consultation session not found</h1>
        <button type="button" onClick={() => navigate('/patient-dashboard')}>
          <ArrowLeft size={18} />
          Back to dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="waiting-room">
      <section className="waiting-card">
        <button className="waiting-back" type="button" onClick={() => navigate('/patient-dashboard')}>
          <ArrowLeft size={18} />
          Back
        </button>

        <header className="waiting-header">
          <span>Online consultation</span>
          <h1>Waiting room</h1>
          <p>We will let you know as soon as your doctor joins the consultation room.</p>
        </header>

        <section className="doctor-identity-card">
          <div className="doctor-avatar">
            <Stethoscope size={24} />
          </div>
          <div>
            <h2>Dr. {session.doctorId.firstName} {session.doctorId.lastName}</h2>
            <p>{session.doctorId.specialization}</p>
          </div>
        </section>

        <div className="waiting-metadata">
          <span>Status: {session.status}</span>
          <span>Room: {session.roomId}</span>
        </div>

        {doctorConnected ? (
          <section className="waiting-state ready">
            <CheckCircle2 size={34} />
            <h2>Doctor is ready</h2>
            <p>Your doctor has joined. You can enter the consultation room now.</p>
            <button type="button" onClick={() => navigate(`/consultation/${session._id}`)}>
              <Video size={18} />
              Join consultation
            </button>
          </section>
        ) : (
          <section className="waiting-state pending">
            <Clock size={34} />
            <h2>Waiting for your doctor</h2>
            <p>Stay on this screen. The join button appears when your doctor is ready.</p>
          </section>
        )}
      </section>
    </main>
  );
};

export default PatientWaitingRoom;
