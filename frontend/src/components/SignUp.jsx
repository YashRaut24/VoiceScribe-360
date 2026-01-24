import React, { useState } from 'react';
import { Mic, Mail, Lock, User, Stethoscope, Building2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import './SignUp.css';

const SignUp = () => {
  const [userType, setUserType] = useState('doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPatient, setIsPatient] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    hospitalName: '',
    specialization: '',
    phoneNumber: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

const handleSubmit = async () => {
  setError('');

  if (!formData.fullName || !formData.email || !formData.password) {
    setError('Please fill all required fields');
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  if (userType === 'doctor') {
    if (!formData.licenseNumber || !formData.specialization) {
      setError('Doctor details are required');
      return;
    }
  }

  setLoading(true);

  try {
    const nameParts = formData.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'NA';

    const payload = {
      email: formData.email,
      password: formData.password,
      userType,
      firstName,
      lastName,
      phone: formData.phoneNumber
    };

    if (userType === 'doctor') {
      payload.specialization = formData.specialization;
      payload.licenseNumber = formData.licenseNumber;
    }
    if(userType === 'patient'){
      const res = await fetch('http://localhost:3000/api/auth/registerPatient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    }else{
        const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
        });
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    console.log('Signup success:', data);

    window.location.href = '/dashboard';

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="signup-page">
      {/* Left Side - Branding */}
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

      {/* Right Side - Signup Form */}
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

          {/* User Type Selection */}
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
            {/* Full Name */}
            <div className="signup-form-group">
              <label className="signup-label">Full Name</label>
              <div className="signup-input-wrapper">
                <User className="signup-input-icon" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="signup-input with-icon"
                  placeholder="Dr. John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div className="signup-form-group">
              <label className="signup-label">Email Address</label>
              <div className="signup-input-wrapper">
                <Mail className="signup-input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="signup-input with-icon"
                  placeholder="doctor@hospital.com"
                />
              </div>
            </div>

            {/* Doctor-specific fields */}
            {userType === 'doctor' && (
              <>
                <div className="signup-form-group">
                  <label className="signup-label">Medical License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="signup-input"
                    placeholder="MED123456"
                  />
                </div>

                <div className="signup-form-group">
                  <label className="signup-label">Hospital/Clinic Name</label>
                  <div className="signup-input-wrapper">
                    <Building2 className="signup-input-icon" />
                    <input
                      type="text"
                      name="hospitalName"
                      value={formData.hospitalName}
                      onChange={handleChange}
                      className="signup-input with-icon"
                      placeholder="City General Hospital"
                    />
                  </div>
                </div>

                <div className="signup-form-group">
                  <label className="signup-label">Specialization</label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="signup-select"
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

            {/* Phone Number */}
            <div className="signup-form-group">
              <label className="signup-label">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="signup-input"
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Password */}
            <div className="signup-form-group">
              <label className="signup-label">Password</label>
              <div className="signup-input-wrapper">
                <Lock className="signup-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="signup-input with-icon with-toggle"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="signup-password-toggle"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="signup-form-group">
              <label className="signup-label">Confirm Password</label>
              <div className="signup-input-wrapper">
                <Lock className="signup-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="signup-input with-icon"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="signup-terms">
              <input type="checkbox" id="terms" />
              <label htmlFor="terms">
                I agree to the{' '}
                <a href="#">Terms of Service</a>{' '}
                and{' '}
                <a href="#">Privacy Policy</a>
              </label>
            </div>
            {error && <p className="signup-error">{error}</p>}


            {/* Submit Button */}
           <button
            onClick={handleSubmit}
            className="signup-submit-btn"
            disabled={loading}
            >
            {loading ? 'Creating Account...' : 'Create Account'}
            </button>

          </div>

          {/* Login Link */}
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