import React, { useState } from 'react';
import { Mic, Mail, Lock, ArrowLeft, Eye, EyeOff, Stethoscope, User } from 'lucide-react';
import './Login.css';
// import axios from 'axios';

const Login = () => {
  const [userType, setUserType] = useState('doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = () => {
    console.log('Login data:', { ...formData, userType });
    
    // Add your login logic here
  };

  return (
    <div className="login-page">
      {/* Left Side - Branding */}
      <div className="login-branding">
        <div>
          <div className="branding-logo">
            <Mic />
            <span>VoiceScribe</span>
          </div>
          
          <h1 className="branding-title">
            Welcome Back to<br />VoiceScribe
          </h1>
          
          <p className="branding-description">
            Continue transforming healthcare documentation with AI-powered voice technology.
          </p>

          <ul className="branding-features">
            <li>
              <div className="dot"></div>
              <span>5 minutes → 30 seconds documentation time</span>
            </li>
            <li>
              <div className="dot"></div>
              <span>HIPAA compliant & privacy-first</span>
            </li>
            <li>
              <div className="dot"></div>
              <span>Real-time health intelligence</span>
            </li>
            <li>
              <div className="dot"></div>
              <span>Automatic SOAP notes generation</span>
            </li>
          </ul>
        </div>

        <div className="branding-footer">
          <p>© 2026 VoiceScribe. GDG AI Hackathon 2.0</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-container">
        <div className="login-form-wrapper">
          <div className="mobile-logo">
            <Mic />
            <span>VoiceScribe</span>
          </div>

          <a href="/" className="back-link">
            <ArrowLeft />
            Back to Home
          </a>

          <h2 className="form-title">Sign In</h2>
          <p className="form-subtitle">Access your VoiceScribe account</p>

          {/* User Type Selection */}
          <div className="user-type-toggle">
            <button
              type="button"
              onClick={() => setUserType('doctor')}
              className={`user-type-btn ${userType === 'doctor' ? 'active' : 'inactive'}`}
            >
              <Stethoscope />
              Doctor
            </button>
            <button
              type="button"
              onClick={() => setUserType('patient')}
              className={`user-type-btn ${userType === 'patient' ? 'active' : 'inactive'}`}
            >
              <User />
              Patient
            </button>
          </div>

          <div>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="doctor@hospital.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            {/* Submit Button */}
            <button onClick={handleSubmit} className="submit-btn">
              Sign In
            </button>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line"></div>
              <div className="divider-text">
                <span>Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="social-login">
              <button className="social-btn">
                <svg viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </button>
              <button className="social-btn">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="signup-link">
            Don't have an account?{' '}
            <a href="/signup">Sign Up</a>
          </p>

    
        </div>
      </div>
    </div>
  );
};

export default Login;