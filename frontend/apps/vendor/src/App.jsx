import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

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

  const isApproved = vendorStatus?.status === 'Approved';

  const navItems = isApproved
    ? [
        { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
        { id: 'inventory', path: '/rental-inventory', label: 'Rental Inventory', icon: <IconServices /> },
        { id: 'bookings', path: '/booking-management', label: 'Booking Management', icon: <IconCalendar /> },
        { id: 'earnings', path: '/payouts-earnings', label: 'Payouts & Earnings', icon: <IconPayments /> },
        { id: 'profile', path: '/store-profile', label: 'Store Profile', icon: <IconUsers /> },
        { id: 'support', path: '/support', label: 'Support', icon: <IconSupport /> },
      ]
    : [
        { id: 'onboarding', path: '/onboarding', label: 'Store Verification', icon: <IconServices /> },
        { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: <IconDashboard />, disabled: true },
        { id: 'inventory', path: '/rental-inventory', label: 'Rental Inventory', icon: <IconServices />, disabled: true },
        { id: 'bookings', path: '/booking-management', label: 'Booking Management', icon: <IconCalendar />, disabled: true },
        { id: 'support', path: '/support', label: 'Support', icon: <IconSupport /> },
      ];

  // Map current path to activeNavId
  const getActiveNavId = () => {
    const p = location.pathname.toLowerCase();
    if (p.includes('/rental-inventory') || p.includes('/inventory')) return 'inventory';
    if (p.includes('/booking-management') || p.includes('/bookings')) return 'bookings';
    if (p.includes('/payouts-earnings') || p.includes('/earnings')) return 'earnings';
    if (p.includes('/store-profile') || p.includes('/profile')) return 'profile';
    if (p.includes('/support')) return 'support';
    if (p.includes('/onboarding')) return 'onboarding';
    return isApproved ? 'dashboard' : 'onboarding';
  };

  const activeNavId = getActiveNavId();

  const handleNavClick = (navId, navPath) => {
    if (navId === 'bookings') {
      setSelectedBookingId(null);
    }
    if (navPath) {
      navigate(navPath);
    } else {
      const match = navItems.find((n) => n.id === navId);
      if (match?.path) navigate(match.path);
    }
  };

  const getPageTitle = () => {
    if (activeNavId === 'support') return 'Help & Support';
    if (!isApproved) return 'Merchant Onboarding & Verification';
    if (activeNavId === 'dashboard') return 'Dashboard';
    if (activeNavId === 'inventory') return 'Rental Inventory';
    if (activeNavId === 'bookings') return 'Booking Management';
    if (activeNavId === 'earnings') return 'Payouts & Earnings';
    if (activeNavId === 'profile') return 'Store Information';
    return 'Dashboard';
  };

  return (
    <PortalShell
      portalTitle="RentAssure"
      portalSubtitle="Merchant"
      navItems={navItems}
      activeNavId={activeNavId}
      onNavClick={handleNavClick}
      pageTitle={getPageTitle()}
    >
      <Routes>
        {/* Support Route */}
        <Route path="/support" element={<SupportForm />} />

        {/* Onboarding Route */}
        <Route
          path="/onboarding"
          element={
            <VendorOnboardingFormPage
              vendorStatus={vendorStatus}
              onStatusChange={(updated) => setVendorStatus(updated)}
            />
          }
        />

        {/* Unapproved merchant redirect */}
        {!isApproved ? (
          <Route
            path="*"
            element={
              <VendorOnboardingFormPage
                vendorStatus={vendorStatus}
                onStatusChange={(updated) => setVendorStatus(updated)}
              />
            }
          />
        ) : (
          <>
            {/* Real Paths for Approved Merchants */}
            <Route
              path="/"
              element={
                <VendorDashboardPage
                  onNavigateToInventory={() => navigate('/rental-inventory')}
                  onNavigateToBookings={() => {
                    setSelectedBookingId(null);
                    navigate('/booking-management');
                  }}
                  onNavigateToEarnings={() => navigate('/payouts-earnings')}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <VendorDashboardPage
                  onNavigateToInventory={() => navigate('/rental-inventory')}
                  onNavigateToBookings={() => {
                    setSelectedBookingId(null);
                    navigate('/booking-management');
                  }}
                  onNavigateToEarnings={() => navigate('/payouts-earnings')}
                />
              }
            />
            <Route path="/rental-inventory" element={<VendorInventoryPage />} />
            <Route path="/inventory" element={<Navigate to="/rental-inventory" replace />} />

            <Route
              path="/booking-management"
              element={
                <VendorBookingsPage
                  initialBookingId={selectedBookingId}
                  onNavigateToEarnings={() => navigate('/payouts-earnings')}
                />
              }
            />
            <Route path="/bookings" element={<Navigate to="/booking-management" replace />} />

            <Route
              path="/payouts-earnings"
              element={
                <VendorEarningsPage
                  onNavigateToBookings={(bId) => {
                    setSelectedBookingId(bId);
                    navigate('/booking-management');
                  }}
                />
              }
            />
            <Route path="/earnings" element={<Navigate to="/payouts-earnings" replace />} />

            <Route
              path="/store-profile"
              element={
                <VendorOnboardingFormPage
                  vendorStatus={vendorStatus}
                  onStatusChange={(updated) => setVendorStatus(updated)}
                />
              }
            />
            <Route path="/profile" element={<Navigate to="/store-profile" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </PortalShell>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <VendorPortalContent />
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}
