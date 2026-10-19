import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, isInitializing, logout } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is Admin
  const isAdmin = user?.role === 'Admin' || user?.Role === 'Admin';

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '480px',
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '1.75rem'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#ffffff' }}>
            Administrator Access Restricted
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            The account <strong>{user?.email}</strong> is registered as <code>{user?.role || 'Customer'}</code> and does not possess administrator credentials to access the RentAssure Command Center.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link
              to="/dashboard"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                background: '#334155',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none'
              }}
            >
              Return to User Dashboard
            </Link>
            <button
              onClick={logout}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                background: '#dc2626',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
