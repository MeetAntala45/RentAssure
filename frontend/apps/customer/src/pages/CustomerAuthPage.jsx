import React, { useState } from 'react';
import { useAuth } from '../../../../src/shared/AuthContext';
import AuthLayout from '../../../../src/shared/AuthLayout';
import { GoogleLogin } from '@react-oauth/google';

const CustomerAuthPage = ({ onSuccess = () => {} }) => {
  const { customerLogin, register, googleLogin } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        await register(fullName, email, password, confirmPassword, 'Customer');
        setSuccessMsg('Account registered! You can now log in.');
        setIsSignUp(false);
      } else {
        await customerLogin(email, password);
        onSuccess();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Authentication failed. Please check your email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      if (credentialResponse.credential) {
        await googleLogin(credentialResponse.credential, 'Customer');
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isSignUp ? 'Create Customer Account' : 'Sign in to continue'}
      subtitle={
        isSignUp
          ? 'Rent furniture, appliances, and gear with zero buying hassle'
          : 'Welcome back to your RentAssure account'
      }
      portalName="Customer Marketplace (Port 5173)"
    >
      {error && (
        <div
          style={{
            background: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '18px',
          }}
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: 'var(--success-bg)',
            color: 'var(--success-text)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '18px',
          }}
        >
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <div className="ra-form-group">
            <label className="ra-label">Full Name*</label>
            <input
              type="text"
              required
              className="ra-input"
              placeholder="e.g. Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        )}

        <div className="ra-form-group">
          <label className="ra-label">Email Address*</label>
          <input
            type="email"
            required
            className="ra-input"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="ra-form-group">
          <label className="ra-label">Password*</label>
          <input
            type="password"
            required
            className="ra-input"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {isSignUp && (
          <div className="ra-form-group">
            <label className="ra-label">Confirm Password*</label>
            <input
              type="password"
              required
              className="ra-input"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="ra-btn ra-btn-primary ra-btn-block ra-btn-lg"
          style={{ marginTop: '12px', marginBottom: '16px' }}
        >
          {loading
            ? 'Authenticating...'
            : isSignUp
            ? 'Create Account'
            : 'Sign In'}
        </button>

        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          By clicking on {isSignUp ? 'Create Account' : 'Sign In'}, I accept the{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms & Condition</span> &{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</span>
        </p>

        {/* Divider */}
        <div className="ra-auth-divider">
          <span>OR</span>
        </div>

        {/* Google OAuth Login */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Sign-In failed.')}
            theme="outline"
            size="large"
            text={isSignUp ? 'signup_with' : 'signin_with'}
            shape="rectangular"
            width="340"
          />
        </div>

        {/* Switch Between Login and Signup */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccessMsg('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up Free'}
          </button>
        </div>

        {/* Link to Merchant Portal */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
            textAlign: 'center',
            fontSize: '13px',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Are You a Store Partner? </span>
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 700, color: 'var(--primary)' }}
          >
            Join as Merchant (Port 5174) →
          </a>
        </div>
      </form>
    </AuthLayout>
  );
};

export default CustomerAuthPage;
