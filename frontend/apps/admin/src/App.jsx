import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../../../src/shared/AuthContext';
import PortalShell from '../../../src/shared/PortalShell';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminVendorsPage from './pages/AdminVendorsPage';
import AdminVendorDetailPage from './pages/AdminVendorDetailPage';
import AdminMasterDataPage from './pages/AdminMasterDataPage';
import AdminSupportPage from './pages/AdminSupportPage';
import {
  IconDashboard,
  IconServices,
  IconUsers,
  IconCalendar,
  IconPayments,
  IconMasterData,
  IconSupport,
} from '../../../src/shared/Icons';

const AdminPortalContent = () => {
  const { user, loading } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading admin console...</p>
      </div>
    );
  }

  // Guard: Must be authenticated and role must be Admin
  if (!user || user.role !== 'Admin') {
    return <AdminLoginPage />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    { id: 'services', label: 'Service Management', icon: <IconServices />, disabled: true },
    { id: 'vendors', label: 'User Management', icon: <IconUsers /> },
    { id: 'bookings', label: 'Booking Management', icon: <IconCalendar />, disabled: true },
    { id: 'payments', label: 'Payments & Transactions', icon: <IconPayments />, disabled: true },
    { id: 'master-data', label: 'Master Data', icon: <IconMasterData /> },
    { id: 'support', label: 'Support', icon: <IconSupport /> },
  ];

  const handleNavClick = (navId) => {
    setActiveNav(navId);
    if (navId === 'vendors') {
      setSelectedVendorId(null);
    }
  };

  const getPageTitle = () => {
    if (activeNav === 'dashboard') return 'Dashboard';
    if (activeNav === 'vendors') return selectedVendorId ? 'Service Partner Profile' : 'User Management';
    if (activeNav === 'master-data') return 'Master Data';
    if (activeNav === 'support') return 'Support Inquiries';
    return 'Dashboard';
  };

  return (
    <PortalShell
      portalTitle="RentAssure"
      portalSubtitle="Super Admin"
      navItems={navItems}
      activeNavId={activeNav}
      onNavClick={handleNavClick}
      pageTitle={getPageTitle()}
    >
      {activeNav === 'dashboard' && (
        <AdminDashboardPage
          onNavigateToVendors={() => {
            setActiveNav('vendors');
            setSelectedVendorId(null);
          }}
        />
      )}

      {activeNav === 'vendors' && !selectedVendorId && (
        <AdminVendorsPage
          onSelectVendor={(id) => setSelectedVendorId(id)}
        />
      )}

      {activeNav === 'vendors' && selectedVendorId && (
        <AdminVendorDetailPage
          vendorId={selectedVendorId}
          onBack={() => setSelectedVendorId(null)}
        />
      )}

      {activeNav === 'master-data' && <AdminMasterDataPage />}

      {activeNav === 'support' && <AdminSupportPage />}
    </PortalShell>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AdminPortalContent />
    </AuthProvider>
  );
}
