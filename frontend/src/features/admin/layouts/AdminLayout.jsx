import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { AdminToastProvider } from '../context/AdminToastContext';
import adminService from '../services/adminService';
import '../styles/Admin.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [badgeStats, setBadgeStats] = useState({ pendingVendors: 0, openDisputes: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBadgeData = async () => {
      try {
        const res = await adminService.getStats();
        if (res.isSuccess && res.data) {
          setBadgeStats({
            pendingVendors: res.data.pendingApprovalsCount || 0,
            openDisputes: res.data.openDisputesCount || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch badge counts:', err);
      }
    };

    fetchBadgeData();
    const interval = setInterval(fetchBadgeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/admin/vendors?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <AdminToastProvider>
      <div className="admin-shell">
        {/* ─── Left Sidebar Navigation ───────────────────────────────── */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar__header">
            <div className="admin-brand">
              <div className="admin-brand__logo">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="admin-brand__text">
                <div className="admin-brand__title">
                  RentAssure <span className="admin-brand__badge">Admin</span>
                </div>
                <span className="admin-brand__subtitle">Platform Command</span>
              </div>
            </div>
          </div>

          <nav className="admin-sidebar__nav">
            <span className="admin-sidebar__section-title">Core Operations</span>

            <NavLink
              to="/admin/dashboard"
              end
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item__left">
                <span className="admin-nav-item__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </span>
                <span>Dashboard Overview</span>
              </div>
            </NavLink>

            <NavLink
              to="/admin/vendors"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item__left">
                <span className="admin-nav-item__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </span>
                <span>Vendor Approvals</span>
              </div>
              {badgeStats.pendingVendors > 0 && (
                <span className="admin-nav-pill admin-nav-pill--amber">
                  {badgeStats.pendingVendors} pending
                </span>
              )}
            </NavLink>

            <NavLink
              to="/admin/disputes"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item__left">
                <span className="admin-nav-item__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <span>Dispute Resolution</span>
              </div>
              {badgeStats.openDisputes > 0 && (
                <span className="admin-nav-pill admin-nav-pill--rose">
                  {badgeStats.openDisputes} open
                </span>
              )}
            </NavLink>

            <NavLink
              to="/admin/bookings"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item__left">
                <span className="admin-nav-item__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </span>
                <span>Bookings & Escrow</span>
              </div>
            </NavLink>

            <span className="admin-sidebar__section-title" style={{ marginTop: '0.75rem' }}>
              Marketplace Control
            </span>

            <NavLink
              to="/admin/categories"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item__left">
                <span className="admin-nav-item__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                </span>
                <span>Categories & Fees</span>
              </div>
            </NavLink>

            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item__left">
                <span className="admin-nav-item__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                <span>Platform Settings</span>
              </div>
            </NavLink>

            <NavLink
              to="/admin/audits"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item__left">
                <span className="admin-nav-item__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
                <span>Audit Trail</span>
              </div>
            </NavLink>
          </nav>

          {/* Sidebar Admin User Info */}
          <div className="admin-sidebar__footer">
            <div className="admin-user-card">
              <div className="admin-user-card__left">
                <div className="admin-user-avatar">
                  {getUserInitials(user?.fullName)}
                </div>
                <div className="admin-user-meta">
                  <span className="admin-user-name">{user?.fullName || 'Super Administrator'}</span>
                  <span className="admin-user-role">Platform Operator</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="admin-logout-trigger"
                title="Sign Out of Admin Console"
                aria-label="Sign Out"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* ─── Main Content Canvas ───────────────────────────────────── */}
        <main className="admin-main">
          {/* Top Header */}
          <header className="admin-topbar">
            <div className="admin-topbar__search">
              <svg className="admin-topbar__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="admin-topbar__search-input"
                placeholder="Global search vendors, leases, disputes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleGlobalSearch}
              />
            </div>

            <div className="admin-topbar__right">
              <div className="system-status-pill">
                <span className="system-status-dot" />
                <span>Live Escrow Active</span>
              </div>

              <div className="system-status-pill" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                <span>Stripe Express Split</span>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="admin-quick-btn"
                title="Switch to User Dashboard view"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span>User Portal</span>
              </button>
            </div>
          </header>

          {/* Child Page Rendering */}
          <div className="admin-content">
            <Outlet />
          </div>
        </main>
      </div>
    </AdminToastProvider>
  );
}
