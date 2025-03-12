import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const res = await axios.get(`/api/auth/verify-email?token=${token}`);
        setVerificationStatus('success');
        setMessage(res.data.msg || 'Email verified successfully');
      } catch (err) {
        setVerificationStatus('error');
        setMessage(err.response?.data?.msg || 'Error verifying email');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="verify-email-page">
      <div className="verify-email-card">
        <h2>Email Verification</h2>
        
        <div className={`verification-status ${verificationStatus}`}>
          {verificationStatus === 'pending' && <div className="loading-spinner"></div>}
          {verificationStatus === 'success' && <div className="success-icon">✓</div>}
          {verificationStatus === 'error' && <div className="error-icon">✗</div>}
          <p>{message}</p>
        </div>
        
        <div className="verify-email-actions">
          {verificationStatus === 'success' && (
            <Link to="/auth" className="btn btn-primary">
              Proceed to Login
            </Link>
          )}
          
          {verificationStatus === 'error' && (
            <Link to="/" className="btn">
              Return to Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 