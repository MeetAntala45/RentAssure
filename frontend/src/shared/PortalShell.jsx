import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const PortalShell = ({
  portalTitle = 'RentAssure',
  portalSubtitle = 'Portal',
  navItems = [],
  activeNavId = 'dashboard',
  onNavClick = () => {},
  pageTitle = 'Dashboard',
  headerActions = null,
  showSoonBadges = false,
  children,
}) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key or route changes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavSelect = (itemId, isDisabled) => {
    if (!isDisabled) {
      onNavClick(itemId);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="ra-app-shell">
      {/* ─── MOBILE BACKDROP ──────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="ra-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      {/* ─── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className={`ra-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="ra-sidebar-brand">
          <div className="ra-sidebar-brand-inner">
            <div className="ra-sidebar-logo">
              Rent<span>Assure</span>
            </div>
            <span className="ra-sidebar-badge">
              {portalSubtitle}
            </span>
          </div>

          {/* Close button inside sidebar on mobile */}
          <button
            className="ra-mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="ra-sidebar-nav">
          <div className="ra-nav-section-title">Main Navigation</div>
          {navItems.map((item) => {
            const isActive = activeNavId === item.id;
            const isDisabled = item.disabled;

            return (
              <div
                key={item.id}
                className={`ra-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => handleNavSelect(item.id, isDisabled)}
                title={isDisabled ? `${item.label} (Coming Soon)` : item.label}
              >
                <span className="ra-nav-icon">{item.icon}</span>
                <span className="ra-nav-label">{item.label}</span>
                {showSoonBadges && isDisabled && (
                  <span className="ra-nav-badge ra-nav-badge-soon">Soon</span>
                )}
                {item.badge && !isDisabled && (
                  <span
                    className="ra-nav-badge"
                    style={{
                      background: item.badgeColor || 'var(--primary)',
                      color: '#ffffff',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="ra-sidebar-footer">
          <div
            className="ra-nav-item ra-nav-logout"
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            title="Sign out of your account"
          >
            <span className="ra-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="ra-nav-label">Sign Out</span>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <div className="ra-main-content-wrapper">
        <header className="ra-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburger Button for Mobile Viewports */}
            <button
              className="ra-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              ☰
            </button>
            <div className="ra-topbar-title">{pageTitle}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {headerActions}

            {/* User Profile matching reference screenshot */}
            <div style={{ position: 'relative' }}>
              <div
                className="ra-user-profile"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="ra-avatar" style={{ borderRadius: '50%', overflow: 'hidden', background: '#18181b', color: '#ffffff' }}>
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="ra-user-meta">
                  <div className="ra-user-name" style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                    {user?.fullName || 'Leslie Alexander'}
                  </div>
                  <div className="ra-user-role" style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {user?.role || portalSubtitle || 'Super Admin'}
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '4px' }}>
                  ▼
                </span>
              </div>

              {userMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    background: '#ffffff',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    minWidth: '180px',
                    padding: '8px 0',
                    zIndex: 200,
                  }}
                >
                  <div
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--danger-text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="ra-page-body">{children}</main>
      </div>
    </div>
  );
};

export default PortalShell;
