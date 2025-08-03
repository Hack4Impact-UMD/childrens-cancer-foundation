import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../../index';
import { resendEmailVerification, getUrlParam } from '../../utils/emailActionUtils';
import logo from '../../assets/ccf-logo.png';
import './EmailActionHandler.css';

function EmailActionHandler() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    if (!verificationAttempted) {
      handleEmailVerification();
      setVerificationAttempted(true);
    }
  }, [verificationAttempted]);

  const handleEmailVerification = async () => {
    try {
      const mode = getUrlParam('mode');
      const actionCode = getUrlParam('oobCode');

      if (!actionCode) {
        setError('Invalid verification link');
        setLoading(false);
        return;
      }

      if (mode === 'verifyEmail') {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.emailVerified) {
          setSuccess(true);
          setLoading(false);
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        await applyActionCode(auth, actionCode);
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError('Invalid action type');
        setLoading(false);
      }
    } catch (error: any) {
      setLoading(false);
      setShowResendButton(true);
      
      if (error.code === 'auth/invalid-action-code' || error.code === 'auth/expired-action-code') {
        setError('This verification link is invalid or has expired.');
      } else {
        setError('Failed to verify your email. Please try again.');
      }
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    
    try {
      const result = await resendEmailVerification();
      if (result.success) {
        setError('A new verification email has been sent to your inbox.');
        setShowResendButton(false);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to send verification email.');
    }
    
    setResendLoading(false);
  };

  const goToLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="email-handler">
        <div className="handler-box">
          <img src={logo} alt="CCF Logo" className="logo" />
          <h1>Children's Cancer Foundation</h1>
          <div className="loading">
            <div className="spinner"></div>
            <h2>Verifying your email...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="email-handler">
        <div className="handler-box">
          <img src={logo} alt="CCF Logo" className="logo" />
          <h1>Children's Cancer Foundation</h1>
          <div className="success-message">
            <h2>Email Verified!</h2>
            <p>Your email has been successfully verified.</p>
            <button className="login-btn" onClick={goToLogin}>
              Continue to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="email-handler">
      <div className="handler-box">
        <img src={logo} alt="CCF Logo" className="logo" />
        <h1>Children's Cancer Foundation</h1>
        <div className="error-message">
          <h2>Email Verification</h2>
          <p>{error}</p>
          
          <div className="buttons">
            {showResendButton && (
              <button 
                className="resend-btn" 
                onClick={handleResendEmail}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Request New Link'}
              </button>
            )}
            <button className="login-btn" onClick={goToLogin}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailActionHandler; 