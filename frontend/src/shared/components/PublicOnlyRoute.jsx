import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

export default function PublicOnlyRoute({ children }) {
  const { user, isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'Admin' || user?.Role === 'Admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
