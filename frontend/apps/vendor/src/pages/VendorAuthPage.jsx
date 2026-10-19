import React, { useState } from 'react';
import { useAuth } from '../../../../src/shared/AuthContext';
import AuthLayout from '../../../../src/shared/AuthLayout';
import { GoogleLogin } from '@react-oauth/google';

const VendorAuthPage = () => {
  const { vendorLogin, register, googleLogin } = useAuth();
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

        await register(fullName, email, password, confirmPassword, 'Vendor');
        setSuccessMsg('Account created successfully! Please sign in to verify your store.');
        setIsSignUp(false);
      } else {
        await vendorLogin(email, password);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Authentication failed. Please check your credentials.'
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
        await googleLogin(credentialResponse.credential, 'Vendor');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isSignUp ? 'Create Vendor Account' : 'Sign in to continue'}
      subtitle={
        isSignUp
          ? 'Join the local merchant rental marketplace'
          : 'Access your store dashboard & listings'
      }
      portalName="Merchant Portal (Port 5174)"
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
            <label className="ra-label">Full Name / Store Owner*</label>
            <input
              type="text"
              required
              className="ra-input"
              placeholder="e.g. Priya Patel"
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
            placeholder="vendor@store.com"
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
            ? 'Processing...'
            : isSignUp
            ? 'Sign Up & Continue'
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
          By clicking on {isSignUp ? 'Sign Up' : 'Sign In'}, I accept the{' '}
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
            {isSignUp ? 'Already have an account? ' : 'Are You a Store Partner? '}
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
            {isSignUp ? 'Sign In' : 'Join Now'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default VendorAuthPage;
