import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../../src/shared/AuthContext';
import PortalShell from '../../../src/shared/PortalShell';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminVendorsPage from './pages/AdminVendorsPage';
import AdminVendorDetailPage from './pages/AdminVendorDetailPage';
import AdminMasterDataPage from './pages/AdminMasterDataPage';
import AdminSupportPage from './pages/AdminSupportPage';
import AdminBookingsPage from './pages/AdminBookingsPage';
import AdminDisputesPage from './pages/AdminDisputesPage';
import {
  IconDashboard,
  IconServices,
  IconUsers,
  IconCalendar,
  IconPayments,
  IconMasterData,
  IconSupport,
  IconShield,
} from '../../../src/shared/Icons';

const VendorRedirectWrapper = () => {
  const { vendorId } = useParams();
  return <Navigate to={`/user-management/${vendorId}`} replace />;
};

// ─── Guard: Must be authenticated as an Admin ───
const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Verifying admin session...</p>
      </div>
    );
  }

  if (!user || user.role !== 'Admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// ─── Guard: Public-only (Redirect authenticated admin to dashboard) ───
const AdminPublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</p>
      </div>
    );
  }

  if (user && user.role === 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ─── Authenticated Admin Portal Shell & Feature Routes ───
const AdminPortalShellWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    { id: 'vendors', path: '/user-management', label: 'User Management', icon: <IconUsers /> },
    { id: 'bookings', path: '/bookings', label: 'Booking Management', icon: <IconCalendar /> },
    { id: 'disputes', path: '/disputes', label: 'Disputes & Escrow', icon: <IconShield /> },
    { id: 'master-data', path: '/master-data', label: 'Master Data', icon: <IconMasterData /> },
    { id: 'support', path: '/support', label: 'Support', icon: <IconSupport /> },
  ];

  const getActiveNavId = () => {
    const p = location.pathname.toLowerCase();
    if (p.includes('/user-management') || p.includes('/vendors')) return 'vendors';
    if (p.includes('/bookings')) return 'bookings';
    if (p.includes('/disputes')) return 'disputes';
    if (p.includes('/master-data')) return 'master-data';
    if (p.includes('/support')) return 'support';
    return 'dashboard';
  };

  const activeNavId = getActiveNavId();

  const handleNavClick = (navId, navPath) => {
    if (navPath) {
      navigate(navPath);
    } else {
      const match = navItems.find((n) => n.id === navId);
      if (match?.path) navigate(match.path);
    }
  };

  const getPageTitle = () => {
    if (activeNavId === 'dashboard') return 'Dashboard';
    if (activeNavId === 'vendors') {
      const parts = location.pathname.split('/').filter(Boolean);
      return parts.length > 1 ? 'Service Partner Profile' : 'User Management';
    }
    if (activeNavId === 'bookings') return 'Booking Management';
    if (activeNavId === 'disputes') return 'Disputes & Escrow Arbitration';
    if (activeNavId === 'master-data') return 'Master Data';
    if (activeNavId === 'support') return 'Support Inquiries';
    return 'Dashboard';
  };

  return (
    <PortalShell
      portalTitle="RentAssure"
      portalSubtitle="Admin"
      navItems={navItems}
      activeNavId={activeNavId}
      onNavClick={handleNavClick}
      pageTitle={getPageTitle()}
    >
      <Routes>
        <Route
          path="/"
          element={
            <AdminDashboardPage
              onNavigateToVendors={() => navigate('/user-management')}
              onNavigateToBookings={() => navigate('/bookings')}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <AdminDashboardPage
              onNavigateToVendors={() => navigate('/user-management')}
              onNavigateToBookings={() => navigate('/bookings')}
            />
          }
        />

        {/* User / Merchant Management */}
        <Route
          path="/user-management"
          element={<AdminVendorsPage onSelectVendor={(id) => navigate(`/user-management/${id}`)} />}
        />
        <Route
          path="/user-management/:vendorId"
          element={<AdminVendorDetailPage onBack={() => navigate('/user-management')} />}
        />

        {/* Path aliases */}
        <Route path="/vendors" element={<Navigate to="/user-management" replace />} />
        <Route path="/vendors/:vendorId" element={<VendorRedirectWrapper />} />

        {/* Booking Management */}
        <Route path="/bookings" element={<AdminBookingsPage />} />

        {/* Dispute & Escrow Arbitration */}
        <Route path="/disputes" element={<AdminDisputesPage />} />

        {/* Master Data */}
        <Route path="/master-data" element={<AdminMasterDataPage />} />

        {/* Support */}
        <Route path="/support" element={<AdminSupportPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </PortalShell>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Dedicated Login Route with Public-Only Guard */}
          <Route
            path="/login"
            element={
              <AdminPublicOnlyRoute>
                <AdminLoginPage />
              </AdminPublicOnlyRoute>
            }
          />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/signup" element={<Navigate to="/login" replace />} />

          {/* Protected Routes for Admin Console */}
          <Route
            path="/*"
            element={
              <AdminProtectedRoute>
                <AdminPortalShellWrapper />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
