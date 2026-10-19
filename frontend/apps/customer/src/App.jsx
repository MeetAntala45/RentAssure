import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../../../src/shared/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import CustomerNavbar from './components/CustomerNavbar';
import CustomerCatalogPage from './pages/CustomerCatalogPage';
import CustomerAuthPage from './pages/CustomerAuthPage';
import SupportForm from '../../../src/shared/SupportForm';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '506539799908-8asi0s04856u5bv25fjdtebq5r2npt9l.apps.googleusercontent.com';

const CustomerAppContent = () => {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All');

  // Enforce customer role on Customer portal
  useEffect(() => {
    if (user && user.role !== 'Customer') {
      logout();
    }
  }, [user]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerNavbar
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenSupport={() => setShowSupportModal(true)}
        selectedCity={selectedCity}
        onCityChange={(c) => setSelectedCity(c)}
      />

      <main style={{ flex: 1 }}>
        <CustomerCatalogPage
          selectedCity={selectedCity}
          onRequireAuth={() => setShowAuthModal(true)}
        />
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          background: '#ffffff',
          padding: '28px 24px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>RentAssure</strong> — Peer-to-Merchant Rental Marketplace © 2026. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={() => setShowSupportModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#18181b',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
                padding: 0,
              }}
            >
              Support & Help
            </button>
            <span style={{ color: '#d4d4d8' }}>|</span>
            <a href="http://localhost:5174" target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
              Merchant Portal (Port 5174)
            </a>
            <a href="http://localhost:5175" target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
              Admin Console (Port 5175)
            </a>
          </div>
        </div>
      </footer>

      {showSupportModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowSupportModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '560px' }}>
            <SupportForm isModal={true} onClose={() => setShowSupportModal(false)} />
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="ra-modal-backdrop">
          <div className="ra-modal-dialog" style={{ maxWidth: '960px', height: '85vh', maxHeight: '720px' }}>
            <div style={{ position: 'relative', height: '100%' }}>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  zIndex: 200,
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
              <CustomerAuthPage onSuccess={() => setShowAuthModal(false)} />
            </div>
          </div>
        </div>
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
