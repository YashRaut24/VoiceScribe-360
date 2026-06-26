import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

const ProtectedRoute = ({ children, userType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',    
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userType && user.userType !== userType) {
    return <Navigate to={user.userType === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
