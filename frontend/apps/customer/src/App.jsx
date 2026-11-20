import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../../src/shared/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import CustomerNavbar from './components/CustomerNavbar';
import CustomerCatalogPage from './pages/CustomerCatalogPage';
import CustomerItemDetailPage from './pages/CustomerItemDetailPage';
import CustomerCheckoutPage from './pages/CustomerCheckoutPage';
import CustomerRentalsPage from './pages/CustomerRentalsPage';
import CustomerAuthPage from './pages/CustomerAuthPage';
import SupportForm from '../../../src/shared/SupportForm';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '506539799908-8asi0s04856u5bv25fjdtebq5r2npt9l.apps.googleusercontent.com';

const ItemRedirectWrapper = () => {
  const { id } = useParams();
  return <Navigate to={`/rental-items/${id}`} replace />;
};

// ─── Guard: Must be authenticated as a Customer ───
const CustomerProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Verifying customer session...</p>
      </div>
    );
  }

  if (!user || user.role !== 'Customer') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// ─── Guard: Public-Only (Redirect authenticated customer away from login) ───
const CustomerPublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading...</p>
      </div>
    );
  }

  if (user && user.role === 'Customer') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const CustomerAppContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All');

  const handleSelectItem = (item) => {
    navigate(`/rental-items/${item.id}`, { state: { item } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToCheckout = (months, quantity = 1, item) => {
    const targetId = item?.id || 'select';
    navigate(`/checkout/${targetId}?months=${months}&quantity=${quantity}`, {
      state: { item, selectedMonths: months, selectedQuantity: quantity },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMyRentals = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/my-rentals' } } });
      return;
    }
    navigate('/my-rentals');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', width: '100%', overflowX: 'hidden' }}>
      {/* Sticky Modern Clean Navbar */}
      <CustomerNavbar
        onOpenAuth={() => navigate('/login')}
        onOpenSupport={() => setShowSupportModal(true)}
        onOpenMyBookings={handleOpenMyRentals}
        onGoHome={handleBackToCatalog}
        selectedCity={selectedCity}
        onCityChange={(c) => setSelectedCity(c)}
      />

      {/* Main Page Routing Container */}
      <main style={{ flex: 1, width: '100%' }}>
        <Routes>
          {/* Marketplace / Catalog */}
          <Route
            path="/"
            element={
              <CustomerCatalogPage
                selectedCity={selectedCity}
                onRequireAuth={() => navigate('/login', { state: { from: location } })}
                onOpenMyRentals={handleOpenMyRentals}
                onSelectItem={handleSelectItem}
              />
            }
          />
          <Route path="/catalog" element={<Navigate to="/" replace />} />

          {/* Dedicated Login & Signup Routes */}
          <Route
            path="/login"
            element={
              <CustomerPublicOnlyRoute>
                <div style={{ maxWidth: '480px', margin: '48px auto 80px auto', padding: '0 20px' }}>
                  <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                    <CustomerAuthPage
                      onSuccess={() => {
                        const fromPath = location.state?.from?.pathname || '/';
                        navigate(fromPath, { replace: true });
                      }}
                    />
                  </div>
                </div>
              </CustomerPublicOnlyRoute>
            }
          />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/signup" element={<Navigate to="/login" replace />} />

          {/* Item Details Page */}
          <Route
            path="/rental-items/:id"
            element={
              <CustomerItemDetailPage
                onBack={handleBackToCatalog}
                onProceedToCheckout={handleProceedToCheckout}
                onRequireAuth={() => navigate('/login', { state: { from: location } })}
                user={user}
              />
            }
          />
          <Route path="/items/:id" element={<ItemRedirectWrapper />} />

          {/* Checkout Page (Protected) */}
          <Route
            path="/checkout/:id"
            element={
              <CustomerProtectedRoute>
                <CustomerCheckoutPage
                  onBack={() => navigate(-1)}
                  onViewRentals={handleOpenMyRentals}
                  user={user}
                />
              </CustomerProtectedRoute>
            }
          />
          <Route path="/checkout" element={<Navigate to="/" replace />} />

          {/* Customer Rentals (Protected) */}
          <Route
            path="/my-rentals"
            element={
              <CustomerProtectedRoute>
                <CustomerRentalsPage
                  onBackToCatalog={handleBackToCatalog}
                  onOpenSupport={() => setShowSupportModal(true)}
                  user={user}
                />
              </CustomerProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Modern High-End Marketplace Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          background: '#ffffff',
          padding: '48px 0 28px 0',
          color: 'var(--text-body)',
          width: '100%',
        }}
      >
        <div className="ra-customer-container">
          {/* Top Multi-Column Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '32px',
              paddingBottom: '36px',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            {/* Brand Col */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#18181b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                  RA
                </div>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                  RentAssure
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                Premier verified peer-to-merchant rental marketplace. Rent home furniture, appliances, and gear from verified local stores with 100% held-deposit escrow assurance.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, background: '#f4f4f5', color: '#18181b', padding: '4px 10px', borderRadius: '9999px', border: '1px solid var(--border-light)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Regulated Escrow Protocol
                </span>
              </div>
            </div>

            {/* Popular Cities */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Popular Locations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCity('Ahmedabad')}>Ahmedabad (SG Highway, Bopal)</span>
                <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCity('Surat')}>Surat (Vesu, Adajan)</span>
                <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCity('Vadodara')}>Vadodara (Alkapuri, Gotri)</span>
                <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCity('Rajkot')}>Rajkot (Kalawad Road)</span>
                <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCity('Gandhinagar')}>Gandhinagar (Kudasan, Infocity)</span>
              </div>
            </div>

            {/* Popular Rentals */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Popular Categories
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>Living Room Sofa Sets & Recliners</span>
                <span>Double Door Frost-Free Fridges</span>
                <span>Ergonomic Workstations & Standing Desks</span>
                <span>Fully Automatic Washing Machines</span>
                <span>Smart 4K Displays & Entertainment</span>
              </div>
            </div>

            {/* Trust & Support */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Customer Care
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                Have questions regarding your held escrow deposit or delivery timing? Our team is active 7 days a week.
              </p>
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="ra-btn ra-btn-secondary ra-btn-sm"
                style={{ borderRadius: '8px', fontWeight: 700 }}
              >
                Open Support Ticket
              </button>
            </div>
          </div>

          {/* Bottom Bar: Clean Copyright & Customer Links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              paddingTop: '24px',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            <div>
              <strong>RentAssure</strong> — Peer-to-Merchant Rental Marketplace © 2026. All rights reserved.
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: 0,
                }}
              >
                Help & Support
              </button>
              <span style={{ color: 'var(--border-light)' }}>|</span>
              <span style={{ color: 'var(--text-muted)' }}>Escrow Protected</span>
              <span style={{ color: 'var(--border-light)' }}>|</span>
              <span style={{ color: 'var(--text-muted)' }}>Verified Local Merchants</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Support Ticket Modal */}
      {showSupportModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(24, 24, 27, 0.45)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '16px',
          }}
          onClick={() => setShowSupportModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '580px' }}>
            <SupportForm isModal={true} onClose={() => setShowSupportModal(false)} />
          </div>
        </div>
      )}

      {/* Customer Auth Modal (Fallback quick login) */}
      {showAuthModal && (
        <div className="ra-modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setShowAuthModal(false)}>
          <div
            className="ra-modal-dialog ra-customer-auth-dialog"
            style={{ maxHeight: '92vh', padding: 0, position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 200,
                background: 'var(--primary-light)',
                border: '1px solid var(--border-light)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontWeight: 800,
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close modal"
            >
              ✕
            </button>
            <CustomerAuthPage onSuccess={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <CustomerAppContent />
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}
