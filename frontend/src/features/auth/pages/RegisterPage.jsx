import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import GoogleLoginButton from '../components/GoogleLoginButton';
import './AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password', '');

  // Calculate password strength score & rules
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  const satisfiedCount = Object.values(checks).filter(Boolean).length;

  let strengthLabel = 'Weak';
  let strengthClass = 'weak';
  if (satisfiedCount >= 5) {
    strengthLabel = 'Strong';
    strengthClass = 'strong';
  } else if (satisfiedCount >= 4) {
    strengthLabel = 'Good';
    strengthClass = 'good';
  } else if (satisfiedCount >= 2) {
    strengthLabel = 'Fair';
    strengthClass = 'fair';
  }

  const onSubmit = async (data) => {
    setServerError('');
    setIsLoading(true);

    try {
      const result = await authService.register({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (result.isSuccess) {
        navigate('/login', {
          state: { message: 'Account created successfully! Please sign in with your credentials.' },
        });
      } else {
        setServerError(result.message || 'Registration failed. Please check your information.');
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors?.length) {
        setServerError(errorData.errors.join(' '));
      } else {
        setServerError(errorData?.message || 'Unable to register at this time. Please try again.');
      }
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
      <div className="auth-card" id="register-card">
        <h1 className="auth-card__title">Create account</h1>
        <p className="auth-card__desc">
          Get started with your verified property assurance account.
        </p>

        {/* Error Banner */}
        {serverError && (
          <div className="auth-alert auth-alert--error" id="register-error" role="alert">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" id="register-form" noValidate>
          {/* Full Name */}
          <div className="auth-field">
            <label htmlFor="register-name" className="auth-label">
              Full name
            </label>
            <div className="auth-input-group">
              <input
                id="register-name"
                type="text"
                className={`auth-input ${errors.fullName ? 'auth-input--error' : ''}`}
                placeholder="Jane Doe"
                autoComplete="name"
                {...register('fullName', {
                  required: 'Full name is required.',
                  maxLength: { value: 100, message: 'Name must not exceed 100 characters.' },
                })}
              />
            </div>
            {errors.fullName && (
              <span className="auth-error-msg">{errors.fullName.message}</span>
            )}
          </div>

          {/* Email */}
          <div className="auth-field">
            <label htmlFor="register-email" className="auth-label">
              Email address
            </label>
            <div className="auth-input-group">
              <input
                id="register-email"
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
            <label htmlFor="register-password" className="auth-label">
              Password
            </label>
            <div className="auth-input-group auth-input-group--has-toggle">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('password', {
                  required: 'Password is required.',
                  minLength: { value: 8, message: 'Must be at least 8 characters.' },
                  validate: {
                    hasUpper: (v) => /[A-Z]/.test(v) || 'Include at least one uppercase letter.',
                    hasLower: (v) => /[a-z]/.test(v) || 'Include at least one lowercase letter.',
                    hasDigit: (v) => /[0-9]/.test(v) || 'Include at least one number.',
                    hasSpecial: (v) => /[^a-zA-Z0-9]/.test(v) || 'Include at least one special character.',
                  },
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

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="auth-strength-container">
                <div className="auth-strength-header">
                  <span className="auth-strength-label">Password strength</span>
                  <span className={`auth-strength-score auth-strength-score--${strengthClass}`}>
                    {strengthLabel}
                  </span>
                </div>
                <div className="auth-strength-bars">
                  <div className={`auth-strength-bar ${satisfiedCount >= 1 ? `auth-strength-bar--${strengthClass}` : ''}`} />
                  <div className={`auth-strength-bar ${satisfiedCount >= 2 ? `auth-strength-bar--${strengthClass}` : ''}`} />
                  <div className={`auth-strength-bar ${satisfiedCount >= 4 ? `auth-strength-bar--${strengthClass}` : ''}`} />
                  <div className={`auth-strength-bar ${satisfiedCount >= 5 ? `auth-strength-bar--${strengthClass}` : ''}`} />
                </div>
                <ul className="auth-criteria-list">
                  <li className={`auth-criteria-item ${checks.length ? 'auth-criteria-item--met' : ''}`}>
                    <span className="auth-criteria-dot" />
                    <span>8+ characters</span>
                  </li>
                  <li className={`auth-criteria-item ${checks.upper ? 'auth-criteria-item--met' : ''}`}>
                    <span className="auth-criteria-dot" />
                    <span>Uppercase</span>
                  </li>
                  <li className={`auth-criteria-item ${checks.lower ? 'auth-criteria-item--met' : ''}`}>
                    <span className="auth-criteria-dot" />
                    <span>Lowercase</span>
                  </li>
                  <li className={`auth-criteria-item ${checks.digit ? 'auth-criteria-item--met' : ''}`}>
                    <span className="auth-criteria-dot" />
                    <span>Number</span>
                  </li>
                  <li className={`auth-criteria-item ${checks.special ? 'auth-criteria-item--met' : ''}`}>
                    <span className="auth-criteria-dot" />
                    <span>Special symbol</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label htmlFor="register-confirm" className="auth-label">
              Confirm password
            </label>
            <div className="auth-input-group auth-input-group--has-toggle">
              <input
                id="register-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`auth-input ${errors.confirmPassword ? 'auth-input--error' : ''}`}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password.',
                  validate: (v) => v === password || 'Passwords do not match.',
                })}
              />
              <button
                type="button"
                className="auth-toggle-visibility"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
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
            {errors.confirmPassword && (
              <span className="auth-error-msg">{errors.confirmPassword.message}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit-btn"
            id="register-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="auth-btn-spinner" />
                <span>Creating account...</span>
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-separator">
          <span>or sign up with</span>
        </div>

        {/* Google OAuth */}
        <div className="google-oauth-box">
          <GoogleLoginButton />
        </div>

        {/* Footer */}
        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__footer-link" id="login-link">
            Sign in
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
