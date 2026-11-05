import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../../../src/shared/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import CustomerNavbar from './components/CustomerNavbar';
import CustomerCatalogPage from './pages/CustomerCatalogPage';
import CustomerAuthPage from './pages/CustomerAuthPage';
import CustomerBookingsModal from './components/CustomerBookingsModal';
import SupportForm from '../../../src/shared/SupportForm';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '506539799908-8asi0s04856u5bv25fjdtebq5r2npt9l.apps.googleusercontent.com';

const CustomerAppContent = () => {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showMyBookingsModal, setShowMyBookingsModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All');

  // Enforce customer role on Customer portal
  useEffect(() => {
    if (user && user.role !== 'Customer') {
      logout();
    }
  }, [user]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      {/* Sticky Modern Navbar */}
      <CustomerNavbar
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenSupport={() => setShowSupportModal(true)}
        onOpenMyBookings={() => setShowMyBookingsModal(true)}
        selectedCity={selectedCity}
        onCityChange={(c) => setSelectedCity(c)}
      />

      {/* Main Marketplace Catalog Experience */}
      <main style={{ flex: 1 }}>
        <CustomerCatalogPage
          selectedCity={selectedCity}
          onRequireAuth={() => setShowAuthModal(true)}
          onOpenMyRentals={() => setShowMyBookingsModal(true)}
        />
      </main>

      {/* Modern High-End Marketplace Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          background: '#ffffff',
          padding: '48px 24px 28px 24px',
          color: 'var(--text-body)',
        }}
      >
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
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
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Rent<span style={{ color: '#304C62' }}>Assure</span>
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                Premier peer-to-merchant rental marketplace. Rent furniture, home appliances, and equipment from verified local stores with 100% held-deposit escrow assurance.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid var(--color-light-blue-border)' }}>
                  🔒 Regulated Escrow Protocol
                </span>
              </div>
            </div>

            {/* Popular Cities */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Popular Cities
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCity('Ahmedabad')}>📍 Ahmedabad (SG Highway, Prahlad Nagar, Bopal)</span>
                <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCity('Surat')}>📍 Surat (Vesu, Adajan, Varachha)</span>
                <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCity('Vadodara')}>📍 Vadodara (Alkapuri, Gotri, Sayajigunj)</span>
                <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCity('Rajkot')}>📍 Rajkot (Kalawad Road, Yagnik Road)</span>
                <span style={{ cursor: 'pointer' }} onClick={() => setSelectedCity('Gandhinagar')}>📍 Gandhinagar (Kudasan, Infocity, Sector 21)</span>
              </div>
            </div>

            {/* Popular Rentals */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Popular Categories
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>🛋️ Living Room Sofa Sets & Recliners</span>
                <span>❄️ Double Door Frost-Free Fridges</span>
                <span>🪑 Ergonomic Workstations & Height Desks</span>
                <span>🧺 Fully Automatic Washing Machines</span>
                <span>📺 Smart 4K Displays & Party Sound</span>
              </div>
            </div>

            {/* Trust & Support */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Trust & Support
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
                💬 Open Help Desk Ticket
              </button>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Port Shortcuts */}
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
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: 0,
                }}
              >
                Customer Support
              </button>
              <span style={{ color: 'var(--border-light)' }}>|</span>
              <a
                href="http://localhost:5174"
                target="_blank"
                rel="noreferrer"
                style={{ fontWeight: 700, color: 'var(--primary)' }}
              >
                Merchant Partner Hub (Port 5174) ↗
              </a>
              <span style={{ color: 'var(--border-light)' }}>|</span>
              <a
                href="http://localhost:5175"
                target="_blank"
                rel="noreferrer"
                style={{ fontWeight: 700, color: 'var(--primary)' }}
              >
                Platform Admin Console (Port 5175) ↗
              </a>
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
            backgroundColor: 'rgba(3, 48, 71, 0.45)',
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

      {/* Sleek Customer Auth Modal */}
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

      {/* My Rentals / Subscriptions Dashboard Modal */}
      {showMyBookingsModal && (
        <CustomerBookingsModal
          onClose={() => setShowMyBookingsModal(false)}
          onOpenSupport={() => setShowSupportModal(true)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CustomerAppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
