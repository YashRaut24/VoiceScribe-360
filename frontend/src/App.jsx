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

function App() {
  return (
    <AuthProvider>
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
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
