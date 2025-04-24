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
    if (!isLogin && password.length < 3) {
      setError('Password must be at least 3 characters long');
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
        // Handle specific error cases
        const errorMessage = result.message?.toLowerCase() || '';
        
        if (isLogin) {
          // Login specific errors
          if (errorMessage.includes('password') || errorMessage.includes('credentials')) {
            setError('Incorrect password. Please try again or use "Forgot Password" if you need to reset it.');
          } else if (errorMessage.includes('not found') || errorMessage.includes('no user')) {
            setError('Email not found. Please check your email or register for a new account.');
          } else if (errorMessage.includes('verify')) {
            setError('Please verify your email address. Check your inbox for the verification link.');
          } else {
            setError('Login failed. Please check your credentials and try again.');
          }
        } else {
          // Registration specific errors
          if (errorMessage.includes('exists') || errorMessage.includes('already registered') || errorMessage.includes('duplicate')) {
            setError(
              <div>
                This email is already registered. 
                <button 
                  className="btn btn-link p-0 m-0 d-inline"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError('');
                  }}
                  style={{ textDecoration: 'underline', marginLeft: '5px' }}
                >
                  Click here to reset your password
                </button>
              </div>
            );
          } else if (errorMessage.includes('password')) {
            setError('Password is not strong enough. Please use at least 3 characters with a mix of letters and numbers.');
          } else if (errorMessage.includes('email')) {
            setError('Please enter a valid email address.');
          } else {
            setError('Registration failed. Please try again or contact support if the problem persists.');
          }
        }
      }
    } catch (err) {
      // Handle network or unexpected errors
      if (!navigator.onLine) {
        setError('No internet connection. Please check your network and try again.');
      } else if (err.response?.status === 429) {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later or contact support if the problem persists.');
      } else {
        setError(err.response?.data?.message || err.message || 'Authentication failed. Please try again.');
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!resetEmail) {
      setError('Please enter your email address.');
      return;
    }
    
    try {
      const result = await forgotPassword(resetEmail);
      if (result.success) {
        setSuccess('Password reset email sent! Please check your inbox and spam folder.');
        setTimeout(() => {
          setShowForgotPassword(false);
        }, 3000);
      } else {
        // Handle specific reset password errors
        const errorMessage = result.message?.toLowerCase() || '';
        
        if (errorMessage.includes('not found') || errorMessage.includes('no user')) {
          setError('No account found with this email. Please check the email or register for a new account.');
        } else if (errorMessage.includes('recently')) {
          setError('A reset email was recently sent. Please wait a few minutes before trying again.');
        } else {
          setError('Failed to send reset email. Please try again or contact support.');
        }
      }
    } catch (err) {
      if (!navigator.onLine) {
        setError('No internet connection. Please check your network and try again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to send reset email. Please try again.');
      }
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