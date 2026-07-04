import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';
import SymptomLogging from './components/SymptomLogging';
import ProtectedRoute from './components/ProtectedRoute';
import AppointmentBooking from './components/AppointmentBooking';
import PatientTimeline from './components/PatientTimeline';
import PatientWaitingRoom from './components/PatientWaitingRoom';
import SocketProvider from './contexts/SocketProvider';
import ConsultationRoom from './components/ConsultationRoom';

function App() {
  return (
    <AuthProvider>
       <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            <Route path="/doctor-dashboard" element={
              <ProtectedRoute userType="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/patient-dashboard" element={
              <ProtectedRoute userType="patient">
                <PatientDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/patient/log-symptoms" element={
              <ProtectedRoute userType="patient">
                <SymptomLogging />
              </ProtectedRoute>
            } />

            <Route path="/patient/book-appointment" element={
              <ProtectedRoute userType="patient">
                  <AppointmentBooking />
              </ProtectedRoute>
            } />

            <Route path="/patient/timeline" element={
              <ProtectedRoute userType="patient">
                  <PatientTimeline />
              </ProtectedRoute>
          } />

          <Route path="/patient/waiting-room/:appointmentId"element={<PatientWaitingRoom />}/>
            
            <Route
                path="/consultation/:sessionId"
                element={
                    <ProtectedRoute>
                        <ConsultationRoom />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
