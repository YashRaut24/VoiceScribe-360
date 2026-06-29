import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Mail, Lock, User, Stethoscope, Building2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import './SignUp.css';

const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [userType, setUserType] = useState('doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    licenseNumber: '',
    specialization: '',
    dateOfBirth: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
        setError('Password must be at least 8 characters and include uppercase, lowercase, and a number');
        return;
    }

    if (!formData.phone) {
        setError('Phone number is required');
        return;
    }

    const phoneRegex = /^(\+\d{1,3})?[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
        setError('Phone must be 10 digits, optionally with country code (e.g. +91)');
        return;
    }

    if (userType === 'doctor' && (!formData.licenseNumber || !formData.specialization)) {
      setError('License number and specialization are required for doctors');
      return;
    }

    if (userType === 'patient' && !formData.dateOfBirth) {
      setError('Date of birth is required for patients');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        userType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      };

      if (userType === 'doctor') {
        userData.specialization = formData.specialization;
        userData.licenseNumber = formData.licenseNumber;
      } else {
        userData.dateOfBirth = formData.dateOfBirth;
      }

      await register(userData);
      navigate(userType === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard');
    } catch (error) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {}
      <div className="signup-branding">
        <div>
          <div className="branding-logo">
            <Mic />
            <span>VoiceScribe</span>
          </div>
          
          <h1 className="branding-title">
            Join the Future of<br />Medical Documentation
          </h1>
          
          <p className="branding-description">
            Transform conversations into clinical records instantly. Help doctors focus on patients, not paperwork.
          </p>

          <div className="branding-features">
            <div className="branding-feature">
              <div className="branding-feature-icon">
                <Mic />
              </div>
              <div className="branding-feature-content">
                <h3>Voice-Powered Documentation</h3>
                <p>Speak naturally, get structured notes automatically</p>
              </div>
            </div>

            <div className="branding-feature">
              <div className="branding-feature-icon">
                <Stethoscope />
              </div>
              <div className="branding-feature-content">
                <h3>Built for Healthcare</h3>
                <p>HIPAA compliant, privacy-first design</p>
              </div>
            </div>

            <div className="branding-feature">
              <div className="branding-feature-icon">
                <Building2 />
              </div>
              <div className="branding-feature-content">
                <h3>Health Intelligence</h3>
                <p>Detect patterns, enable early intervention</p>
              </div>
            </div>
          </div>
        </div>

        <div className="branding-footer">
          <p>© 2026 VoiceScribe. GDG AI Hackathon 2.0</p>
        </div>
      </div>

      {}
      <div className="signup-form-container">
        <div className="signup-form-wrapper">
          <div className="signup-mobile-logo">
            <Mic />
            <span>VoiceScribe</span>
          </div>

          <a href="/" className="signup-back-link">
            <ArrowLeft />
            Back to Home
          </a>

          <h2 className="signup-title">Create Account</h2>
          <p className="signup-subtitle">Start your journey with VoiceScribe</p>

          {}
          <div className="signup-user-toggle">
            <button
              type="button"
              onClick={() => setUserType('doctor')}
              className={`signup-user-btn ${userType === 'doctor' ? 'active' : 'inactive'}`}
            >
              <Stethoscope />
              Doctor
            </button>
            <button
              type="button"
              onClick={() => setUserType('patient')}
              className={`signup-user-btn ${userType === 'patient' ? 'active' : 'inactive'}`}
            >
              <User />
              Patient
            </button>
          </div>

          <div className="signup-form">
            {error && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {}
            <div className="signup-form-group">
              <label className="signup-label">First Name *</label>
              <div className="signup-input-wrapper">
                <User className="signup-input-icon" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="signup-input with-icon"
                  placeholder="John"
                  required
                />
              </div>
            </div>

            {}
            <div className="signup-form-group">
              <label className="signup-label">Last Name *</label>
              <div className="signup-input-wrapper">
                <User className="signup-input-icon" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="signup-input with-icon"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {}
            <div className="signup-form-group">
              <label className="signup-label">Email Address *</label>
              <div className="signup-input-wrapper">
                <Mail className="signup-input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="signup-input with-icon"
                  placeholder="doctor@hospital.com"
                  required
                />
              </div>
            </div>

            {}
            {userType === 'doctor' && (
              <>
                <div className="signup-form-group">
                  <label className="signup-label">Medical License Number *</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="signup-input"
                    placeholder="MED123456"
                    required
                  />
                </div>

                <div className="signup-form-group">
                  <label className="signup-label">Specialization *</label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="signup-select"
                    required
                  >
                    <option value="">Select Specialization</option>
                    <option value="general">General Practice</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="neurology">Neurology</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}

            {}
            {userType === 'patient' && (
              <div className="signup-form-group">
                <label className="signup-label">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="signup-input"
                  required
                />
              </div>
            )}

            {}
            <div className="signup-form-group">
              <label className="signup-label">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="signup-input"
                placeholder="9876543210 or +919876543210"
              />
            </div>

            {}
            <div className="signup-form-group">
              <label className="signup-label">Password *</label>
              <div className="signup-input-wrapper">
                <Lock className="signup-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="signup-input with-icon with-toggle"
                  placeholder="••••••••"
                  required
                  minLength="8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="signup-password-toggle"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Min 8 characters with uppercase, lowercase, and a number
              </p>
            </div>

            {}
            <div className="signup-form-group">
              <label className="signup-label">Confirm Password *</label>
              <div className="signup-input-wrapper">
                <Lock className="signup-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="signup-input with-icon"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {}
            <div className="signup-terms">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">
                I agree to the{' '}
                <a href="#">Terms of Service</a>{' '}
                and{' '}
                <a href="#">Privacy Policy</a>
              </label>
            </div>

            {}
            <button 
              onClick={handleSubmit} 
              className="signup-submit-btn"
              disabled={loading}
              style={{
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          {}
          <p className="signup-login-link">
            Already have an account?{' '}
            <a href="/login">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
