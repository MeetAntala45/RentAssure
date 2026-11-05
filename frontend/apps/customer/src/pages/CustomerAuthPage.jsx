import React, { useState } from 'react';
import { useAuth } from '../../../../src/shared/AuthContext';
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
        try {
          await customerLogin(email, password);
          onSuccess();
          return;
        } catch {
          setSuccessMsg('Account registered successfully! You can now log in.');
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        await customerLogin(email, password);
        onSuccess();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Authentication failed. Please verify your email and password.'
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

  const fillDemoCustomer = () => {
    setEmail('meetantala2005@gmail.com');
    setPassword('Admin@123');
    setIsSignUp(false);
    setError('');
  };

  return (
    <div style={{ padding: '36px 32px', background: '#ffffff', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #033047 0%, #304C62 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            marginBottom: '12px',
            boxShadow: '0 8px 16px rgba(3, 48, 71, 0.15)',
          }}
        >
          🛡️
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
          {isSignUp ? 'Create Customer Account' : 'Welcome to RentAssure'}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          {isSignUp
            ? 'Rent premium home furniture, appliances, and gear with 100% held deposit protection'
            : 'Sign in to reserve rental subscriptions and track held security deposits'}
        </p>
      </div>

      {/* Tabs */}
      <div className="ra-auth-tab-bar">
        <button
          type="button"
          className={`ra-auth-tab-btn ${!isSignUp ? 'active' : ''}`}
          onClick={() => { setIsSignUp(false); setError(''); }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`ra-auth-tab-btn ${isSignUp ? 'active' : ''}`}
          onClick={() => { setIsSignUp(true); setError(''); }}
        >
          Create Account
        </button>
      </div>

      {/* Quick Demo Credentials Autofill Banner */}
      {!isSignUp && (
        <div
          style={{
            background: 'var(--primary-subtle)',
            border: '1px solid var(--color-light-blue-border)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-body)' }}>
            <strong>Demo Account:</strong> <span style={{ color: 'var(--primary)' }}>meetantala2005@gmail.com</span>
          </div>
          <button
            type="button"
            onClick={fillDemoCustomer}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--primary)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ⚡ Auto-fill
          </button>
        </div>
      )}

      {/* Google Login */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google Sign In was not successful.')}
          theme="outline"
          size="large"
          text={isSignUp ? 'signup_with' : 'signin_with'}
          shape="pill"
          width="100%"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
          Or continue with email
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
      </div>

      {error && (
        <div
          style={{
            background: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            border: '1px solid var(--danger-border)',
            borderRadius: '10px',
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
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '18px',
          }}
        >
          {successMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isSignUp && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Meet Antala"
              required
              className="ra-input"
              style={{ width: '100%' }}
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="ra-input"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="ra-input"
            style={{ width: '100%' }}
          />
        </div>

        {isSignUp && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="ra-input"
              style={{ width: '100%' }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="ra-btn ra-btn-primary"
          style={{
            marginTop: '8px',
            padding: '13px',
            fontSize: '14px',
            fontWeight: 800,
            borderRadius: '12px',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(3, 48, 71, 0.22)',
          }}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create Free Account' : 'Sign In to Marketplace'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        🛡️ Protected by RentAssure Escrow Protocol • Port 5173
      </div>
    </div>
  );
};

export default CustomerAuthPage;
