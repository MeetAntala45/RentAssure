import React, { useState } from 'react';
import { useAuth } from '../../../../src/shared/AuthContext';
import AuthLayout from '../../../../src/shared/AuthLayout';

const AdminLoginPage = () => {
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(email, password);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Access denied. Please check your admin credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to continue"
      subtitle="Administrative Management & Approvals Console"
      portalName="Super Admin Portal (Port 5175)"
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

      <form onSubmit={handleSubmit}>
        <div className="ra-form-group">
          <label className="ra-label">Email Address*</label>
          <input
            type="email"
            required
            className="ra-input"
            placeholder="admin@rentassure.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="ra-form-group">
          <label className="ra-label">Security Password*</label>
          <input
            type="password"
            required
            className="ra-input"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="ra-btn ra-btn-primary ra-btn-block ra-btn-lg"
          style={{ marginTop: '12px', marginBottom: '16px' }}
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>

        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          By clicking on Sign In, I accept the{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms & Condition</span> &{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</span>
        </p>

        <div
          style={{
            marginTop: '32px',
            padding: '14px',
            background: 'var(--primary-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e0e7ff',
            fontSize: '12px',
            color: '#3730a3',
            textAlign: 'center',
          }}
        >
          <strong>Security Notice:</strong> Public signup and social login are strictly disabled on the administrative management portal.
        </div>
      </form>
    </AuthLayout>
  );
};

export default AdminLoginPage;
