import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Auth.css';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { processAuth, forgotPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const validateForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (!isLogin && !confirmPassword) {
      setError('Please confirm your password');
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;
    
    try {
      const result = await processAuth(email, password, isLogin);
      if (result.success) {
        setSuccess(isLogin ? 'Login successful!' : 'Registration successful!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError(result.message || (isLogin ? 'Login failed' : 'Registration failed'));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!resetEmail) {
      setError('Please enter your email');
      return;
    }
    
    try {
      const result = await forgotPassword(resetEmail);
      if (result.success) {
        setSuccess('Password reset email sent. Please check your inbox.');
        setTimeout(() => {
          setShowForgotPassword(false);
        }, 2000);
      } else {
        setError(result.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send reset email');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{showForgotPassword ? 'Reset Password' : (isLogin ? 'Login' : 'Register')}</h2>
        </div>
        
        <div className="auth-body">
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {success && <div className="alert alert-success" role="alert">{success}</div>}
          
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label htmlFor="resetEmail">Email</label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="form-control"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-success btn-block">
                  Send Reset Link
                </button>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError('');
                    setSuccess('');
                  }}
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-control"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-control"
                  placeholder={isLogin ? "Enter your password" : "Choose a password (min. 6 characters)"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>
              
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="form-control"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                </div>
              )}
              
              <div className="form-actions">
                <button type="submit" className="btn btn-success btn-block">
                  {isLogin ? 'Login' : 'Register'}
                </button>
              </div>
              
              <div className="auth-options">
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={switchMode}
                >
                  {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
                </button>
                
                {isLogin && (
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError('');
                      setSuccess('');
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth; 