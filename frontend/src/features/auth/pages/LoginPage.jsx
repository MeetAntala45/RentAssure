import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import './AuthPages.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';
  const successMessage = location.state?.message || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setIsLoading(true);

    try {
      const result = await login({
        email: data.email,
        password: data.password,
      });

      if (result.isSuccess) {
        if (result.data?.role === 'Admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setServerError(result.message || 'Invalid email or password.');
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Authentication service unreachable. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* ─── Top Brand Header ────────────────────────────────────────── */}
      <div className="auth-header">
        <div className="auth-logo-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h2 className="auth-brand-name">RentAssure</h2>
        <p className="auth-tagline">Property Management & Lease Assurance</p>
      </div>

      {/* ─── Centered Auth Card ──────────────────────────────────────── */}
      <div className="auth-card" id="login-card">
        <h1 className="auth-card__title">Sign in</h1>
        <p className="auth-card__desc">
          Enter your email and password to access your dashboard.
        </p>

        {/* Success Banner */}
        {successMessage && !serverError && (
          <div className="auth-alert auth-alert--success" role="status">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {serverError && (
          <div className="auth-alert auth-alert--error" id="login-error" role="alert">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" id="login-form" noValidate>
          {/* Email */}
          <div className="auth-field">
            <label htmlFor="login-email" className="auth-label">
              Email address
            </label>
            <div className="auth-input-group">
              <input
                id="login-email"
                type="email"
                className={`auth-input ${errors.email ? 'auth-input--error' : ''}`}
                placeholder="name@company.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email address is required.',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address.',
                  },
                })}
              />
            </div>
            {errors.email && (
              <span className="auth-error-msg">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div className="auth-field">
            <div className="auth-field__header">
              <label htmlFor="login-password" className="auth-label">
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Please contact your system administrator or sign in via Google.');
                }}
                className="auth-forgot-link"
              >
                Forgot password?
              </a>
            </div>
            <div className="auth-input-group auth-input-group--has-toggle">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password', {
                  required: 'Password is required.',
                })}
              />
              <button
                type="button"
                className="auth-toggle-visibility"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <span className="auth-error-msg">{errors.password.message}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit-btn"
            id="login-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="auth-btn-spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Admin Demo Credentials Pill */}
        {/* <div style={{ marginTop: '1rem', padding: '0.65rem 0.85rem', background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <div>
            <span style={{ color: '#2563eb', fontWeight: 700 }}>Admin Portal Demo:</span> <span style={{ color: 'var(--text-muted)' }}>admin@rentassure.com</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setValue('email', 'admin@rentassure.com');
              setValue('password', 'Admin@123');
            }}
            style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Auto-fill
          </button>
        </div> */}

        {/* Divider */}
        <div className="auth-separator">
          <span>or continue with</span>
        </div>

        {/* Google OAuth */}
        <div className="google-oauth-box">
          <GoogleLoginButton />
        </div>

        {/* Footer */}
        <p className="auth-card__footer">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-card__footer-link" id="register-link">
            Create account
          </Link>
        </p>
      </div>

      {/* Trust reassurance */}
      <div className="auth-trust-footer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>256-bit SSL encrypted • SOC 2 Type II Certified</span>
      </div>
    </div>
  );
}
