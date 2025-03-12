import React, { useState, useContext } from 'react';
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
  
  const { processAuth, forgotPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const result = await processAuth(email, password, isLogin);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!resetEmail) {
      setError('Please enter your email');
      return;
    }
    
    try {
      const result = await forgotPassword(resetEmail);
      if (result.success) {
        alert('Password reset email sent. Please check your inbox.');
        setShowForgotPassword(false);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{showForgotPassword ? 'Reset Password' : (isLogin ? 'Login' : 'Register')}</h2>
        </div>
        
        <div className="auth-body">
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
                />
              </div>
              
              {error && <div className="alert alert-danger">{error}</div>}
              
              <div className="form-actions">
                <button type="submit" className="btn btn-success btn-block">
                  Send Reset Link
                </button>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => setShowForgotPassword(false)}
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
                  />
                </div>
              )}
              
              {error && <div className="alert alert-danger">{error}</div>}
              
              <div className="form-actions">
                <button type="submit" className="btn btn-success btn-block">
                  {isLogin ? 'Login' : 'Register'}
                </button>
              </div>
              
              <div className="auth-options">
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
                </button>
                
                {isLogin && (
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => setShowForgotPassword(true)}
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