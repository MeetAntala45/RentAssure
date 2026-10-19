import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../../../src/shared/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PortalShell from '../../../src/shared/PortalShell';
import { vendorApi } from '../../../src/shared/api';
import VendorAuthPage from './pages/VendorAuthPage';
import VendorOnboardingFormPage from './pages/VendorOnboardingFormPage';
import VendorDashboardPage from './pages/VendorDashboardPage';
import VendorInventoryPage from './pages/VendorInventoryPage';
import VendorBookingsPage from './pages/VendorBookingsPage';
import VendorEarningsPage from './pages/VendorEarningsPage';
import SupportForm from '../../../src/shared/SupportForm';
import {
  IconDashboard,
  IconServices,
  IconCalendar,
  IconPayments,
  IconUsers,
  IconSupport,
} from '../../../src/shared/Icons';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '506539799908-8asi0s04856u5bv25fjdtebq5r2npt9l.apps.googleusercontent.com';

const VendorPortalContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [vendorStatus, setVendorStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const checkVendorStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await vendorApi.getStatus();
      if (res.data) {
        setVendorStatus(res.data);
      }
    } catch {
      setVendorStatus({ hasProfile: false, status: 'None' });
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Vendor') {
      checkVendorStatus();
    }
  }, [user]);

  if (authLoading || (user && user.role === 'Vendor' && statusLoading)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading merchant portal...</p>
      </div>
    );
  }

  // Guard: Must be authenticated as a Vendor
  if (!user || user.role !== 'Vendor') {
    return <VendorAuthPage />;
  }

  // CRITICAL FLOW REQUIREMENT:
  // If vendor is NOT verified by admin (has no profile or status != 'Approved'),
  // show the onboarding form to fill INSTEAD of the dashboard!
  const isApproved = vendorStatus?.status === 'Approved';

  const navItems = isApproved
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
        { id: 'inventory', label: 'Rental Inventory', icon: <IconServices /> },
        { id: 'bookings', label: 'Booking Management', icon: <IconCalendar /> },
        { id: 'earnings', label: 'Payouts & Earnings', icon: <IconPayments /> },
        { id: 'profile', label: 'Store Profile', icon: <IconUsers /> },
        { id: 'support', label: 'Support', icon: <IconSupport /> },
      ]
    : [
        { id: 'onboarding', label: 'Store Verification', icon: <IconServices /> },
        { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard />, disabled: true },
        { id: 'inventory', label: 'Rental Inventory', icon: <IconServices />, disabled: true },
        { id: 'bookings', label: 'Booking Management', icon: <IconCalendar />, disabled: true },
        { id: 'support', label: 'Support', icon: <IconSupport /> },
      ];

  const handleNavClick = (navId) => {
    if (navId === 'bookings') {
      setSelectedBookingId(null);
    }
    setActiveNav(navId);
  };

  const getPageTitle = () => {
    if (activeNav === 'support') return 'Help & Support';
    if (!isApproved) return 'Merchant Onboarding & Verification';
    if (activeNav === 'dashboard') return 'Dashboard';
    if (activeNav === 'inventory') return 'Rental Inventory';
    if (activeNav === 'bookings') return 'Booking Management';
    if (activeNav === 'earnings') return 'Payouts & Earnings';
    if (activeNav === 'profile') return 'Store Information';
    return 'Dashboard';
  };

  const currentNavId = activeNav === 'support' ? 'support' : isApproved ? activeNav : 'onboarding';

  return (
    <PortalShell
      portalTitle="RentAssure"
      portalSubtitle="Merchant"
      navItems={navItems}
      activeNavId={currentNavId}
      onNavClick={handleNavClick}
      pageTitle={getPageTitle()}
    >
      {activeNav === 'support' ? (
        <SupportForm />
      ) : !isApproved ? (
        // SHOW FORM INSTEAD OF DASHBOARD
        <VendorOnboardingFormPage
          vendorStatus={vendorStatus}
          onStatusChange={(updated) => setVendorStatus(updated)}
        />
      ) : (
        // DASHBOARD & INVENTORY UNLOCKED AFTER ADMIN APPROVAL
        <>
          {activeNav === 'dashboard' && (
            <VendorDashboardPage
              onNavigateToInventory={() => setActiveNav('inventory')}
              onNavigateToBookings={() => {
                setSelectedBookingId(null);
                setActiveNav('bookings');
              }}
              onNavigateToEarnings={() => setActiveNav('earnings')}
            />
          )}

          {activeNav === 'inventory' && <VendorInventoryPage />}

          {activeNav === 'bookings' && (
            <VendorBookingsPage
              initialBookingId={selectedBookingId}
              onNavigateToEarnings={() => setActiveNav('earnings')}
            />
          )}

          {activeNav === 'earnings' && (
            <VendorEarningsPage
              onNavigateToBookings={(bId) => {
                setSelectedBookingId(bId);
                setActiveNav('bookings');
              }}
            />
          )}

          {activeNav === 'profile' && (
            <VendorOnboardingFormPage
              vendorStatus={vendorStatus}
              onStatusChange={(updated) => setVendorStatus(updated)}
            />
          )}
        </>
      )}
    </PortalShell>
  );
};

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <VendorPortalContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
