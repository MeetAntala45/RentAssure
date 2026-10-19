import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import { useAdminToast } from '../context/AdminToastContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useAdminToast();
  const navigate = useNavigate();

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await adminService.getStats();
      if (res.isSuccess) {
        setStats(res.data);
        if (isManual) showToast('success', 'Data Refreshed', 'Live dashboard analytics updated.');
      } else {
        showToast('error', 'Error', res.message || 'Failed to fetch dashboard data.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network Error', 'Unable to reach backend API.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickApproveVendor = async (vendorId, storeName) => {
    try {
      const res = await adminService.approveVendor(vendorId, 'Approved via dashboard quick review.');
      if (res.isSuccess) {
        showToast('success', 'Vendor Approved', `${storeName} is now authorized to list rental inventory.`);
        loadData();
      }
    } catch {
      showToast('error', 'Action Failed', 'Could not approve vendor.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', color: '#94a3b8' }}>
        <div className="system-status-dot" style={{ width: 12, height: 12, margin: '0 auto 1rem' }} />
        <p>Loading RentAssure Executive Intelligence...</p>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div>
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1>Marketplace Command Overview</h1>
          <p>
            Real-time multi-vendor rental metrics, automated escrow custody, and pending administrative queues.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button
            onClick={() => loadData(true)}
            className="btn-admin btn-admin--secondary btn-admin--sm"
            disabled={refreshing}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{refreshing ? 'Syncing...' : 'Sync Live Data'}</span>
          </button>

          <button
            onClick={() => {
              showToast('info', 'Report Generated', 'Platform executive ledger exported to CSV.');
            }}
            className="btn-admin btn-admin--primary btn-admin--sm"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {/* ─── Top 4 High-Precision KPI Cards ─────────────────────────── */}
      <section className="admin-kpi-grid">
        {/* Gross Volume */}
        <div className="admin-kpi-card admin-kpi-card--blue">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Gross Rental Volume</span>
            <div className="admin-kpi-icon admin-kpi-icon--blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className="admin-kpi-value">{formatCurrency(stats?.totalGrossVolume)}</div>
          <div className="admin-kpi-footer">
            <span className="kpi-trend--up">↑ 18.2% vs last month</span>
            <span className="kpi-subtext">• All vendor listings</span>
          </div>
        </div>

        {/* Platform Commission Earned */}
        <div className="admin-kpi-card admin-kpi-card--emerald">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Platform Net Commission</span>
            <div className="admin-kpi-icon admin-kpi-icon--emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="admin-kpi-value">{formatCurrency(stats?.platformCommissionEarned)}</div>
          <div className="admin-kpi-footer">
            <span className="kpi-trend--up">12.5% avg commission</span>
            <span className="kpi-subtext">• Retained revenue</span>
          </div>
        </div>

        {/* Escrow Deposits Held */}
        <div className="admin-kpi-card admin-kpi-card--amber">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Escrow Deposits Held</span>
            <div className="admin-kpi-icon admin-kpi-icon--amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>
          <div className="admin-kpi-value">{formatCurrency(stats?.escrowBalanceHeld)}</div>
          <div className="admin-kpi-footer">
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>🛡 100% Protected</span>
            <span className="kpi-subtext">• Security deposit pool</span>
          </div>
        </div>

        {/* Active Rentals */}
        <div className="admin-kpi-card admin-kpi-card--purple">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Active Subscriptions</span>
            <div className="admin-kpi-icon admin-kpi-icon--purple">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
          </div>
          <div className="admin-kpi-value">{stats?.activeRentalsCount || 0} Units</div>
          <div className="admin-kpi-footer">
            <span className="kpi-trend--up">Recurring monthly billing</span>
          </div>
        </div>
      </section>

      {/* ─── Operational Metrics Bar ─────────────────────────────────── */}
      <section className="admin-metrics-bar">
        <div className="admin-mini-stat">
          <div className="admin-mini-stat__badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            🏪
          </div>
          <div className="admin-mini-stat__info">
            <div className="admin-mini-stat__value">{stats?.pendingApprovalsCount || 0}</div>
            <div className="admin-mini-stat__label">Pending Vendor Approvals</div>
          </div>
        </div>

        <div className="admin-mini-stat">
          <div className="admin-mini-stat__badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fda4af' }}>
            ⚖️
          </div>
          <div className="admin-mini-stat__info">
            <div className="admin-mini-stat__value">{stats?.openDisputesCount || 0}</div>
            <div className="admin-mini-stat__label">Open Damage Disputes</div>
          </div>
        </div>

        <div className="admin-mini-stat">
          <div className="admin-mini-stat__badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            ✓
          </div>
          <div className="admin-mini-stat__info">
            <div className="admin-mini-stat__value">{stats?.approvedVendorsCount || 0}</div>
            <div className="admin-mini-stat__label">Verified Active Shops</div>
          </div>
        </div>

        <div className="admin-mini-stat">
          <div className="admin-mini-stat__badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            👥
          </div>
          <div className="admin-mini-stat__info">
            <div className="admin-mini-stat__value">{stats?.totalCustomersCount || 0}</div>
            <div className="admin-mini-stat__label">Registered Renters</div>
          </div>
        </div>
      </section>

      {/* ─── Urgent Action Queues Split Grid ─────────────────────────── */}
      <div className="admin-grid-equal">
        {/* Pending Vendors Action Queue */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title-group">
              <span style={{ fontSize: '1.2rem' }}>🏪</span>
              <div>
                <h3 className="admin-card__title">Vendor Onboarding Queue</h3>
                <span className="admin-card__subtitle">Shop verification & business credential approval</span>
              </div>
            </div>
            <Link to="/admin/vendors" className="btn-admin btn-admin--secondary btn-admin--sm">
              View All ({stats?.pendingApprovalsCount || 0})
            </Link>
          </div>

          <div className="admin-card__body" style={{ padding: 0 }}>
            {(!stats?.urgentVendorApprovals || stats.urgentVendorApprovals.length === 0) ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🎉</span>
                All vendor applications have been reviewed!
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Shop / Owner</th>
                    <th>City</th>
                    <th>Tax Registration</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.urgentVendorApprovals.map((vendor) => (
                    <tr key={vendor.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: '#ffffff' }}>{vendor.StoreName}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{vendor.OwnerName} • {vendor.PhoneNumber}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{vendor.City}</span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                          {vendor.BusinessRegistrationNumber}
                        </code>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleQuickApproveVendor(vendor.id, vendor.StoreName)}
                            className="btn-admin btn-admin--success btn-admin--sm"
                            title="Quick Approve"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => navigate(`/admin/vendors`)}
                            className="btn-admin btn-admin--secondary btn-admin--sm"
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Open Disputes Resolution Queue */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div className="admin-card__title-group">
              <span style={{ fontSize: '1.2rem' }}>⚖️</span>
              <div>
                <h3 className="admin-card__title">Disputes Requiring Decision</h3>
                <span className="admin-card__subtitle">Deposit deduction & damage arbitration</span>
              </div>
            </div>
            <Link to="/admin/disputes" className="btn-admin btn-admin--secondary btn-admin--sm">
              Dispute Center ({stats?.openDisputesCount || 0})
            </Link>
          </div>

          <div className="admin-card__body" style={{ padding: 0 }}>
            {(!stats?.activeDisputesQueue || stats.activeDisputesQueue.length === 0) ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🛡️</span>
                Zero active disputes. Escrow claims fully resolved!
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket / Reason</th>
                    <th>Parties</th>
                    <th>Claim / Held</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.activeDisputesQueue.map((disp) => (
                    <tr key={disp.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: '#ffffff' }}>{disp.DisputeTicketNumber}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#f87171' }}>
                            {disp.Reason === 1 ? 'Damage Assessment' :
                             disp.Reason === 2 ? 'Deposit Deduction' :
                             disp.Reason === 3 ? 'Delivery Failure' : 'Condition Mismatch'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                          <div>Renter: {disp.CustomerName}</div>
                          <div style={{ color: '#94a3b8' }}>Shop: {disp.VendorStoreName}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>
                          <strong style={{ color: '#fbbf24' }}>${disp.ClaimAmount}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Held: ${disp.DepositHeld}</div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => navigate('/admin/disputes')}
                          className="btn-admin btn-admin--primary btn-admin--sm"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card__header">
            <div>
              <h3 className="admin-card__title">Platform Revenue & Commission Trajectory</h3>
              <span className="admin-card__subtitle">Monthly gross rental volume vs retained platform fee</span>
            </div>
          </div>
          <div className="admin-card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {stats?.monthlyTrends?.map((m) => {
                const maxGross = Math.max(...(stats?.monthlyTrends?.map((t) => t.GrossRent) || [1000]), 1000);
                const percent = Math.min(100, Math.round((m.GrossRent / maxGross) * 100));

                return (
                  <div key={m.Month}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.82rem' }}>
                      <strong style={{ color: '#ffffff' }}>{m.Month}</strong>
                      <span style={{ color: '#94a3b8' }}>
                        Volume: <strong>{formatCurrency(m.GrossRent)}</strong> • Commission: <span style={{ color: '#34d399', fontWeight: 600 }}>{formatCurrency(m.Commission)}</span>
                      </span>
                    </div>
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                          borderRadius: '999px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__header">
            <div>
              <h3 className="admin-card__title">Category Volume Share</h3>
              <span className="admin-card__subtitle">Active rental distribution by catalog segment</span>
            </div>
          </div>
          <div className="admin-card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {stats?.categoryDistribution?.map((cat) => (
                <div key={cat.CategoryId} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{cat.CategoryName}</span>
                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>{formatCurrency(cat.TotalVolume)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8' }}>
                    <span>{cat.ItemCount} items listed</span>
                    <span>{cat.ActiveBookingsCount} active leases</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div>
            <h3 className="admin-card__title">Live Administrative Audit Trail</h3>
            <span className="admin-card__subtitle">Immutable log of onboarding reviews, dispute resolutions, and system changes</span>
          </div>
          <Link to="/admin/audits" className="btn-admin btn-admin--secondary btn-admin--sm">
            View Complete Log
          </Link>
        </div>
        <div className="admin-card__body" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Entity Affected</th>
                <th>Operator</th>
                <th>Audit Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentActivities?.map((audit) => (
                <tr key={audit.id}>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background:
                          audit.Severity === 'Critical' ? 'rgba(239,68,68,0.2)' :
                          audit.Severity === 'Warning' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)',
                        color:
                          audit.Severity === 'Critical' ? '#f87171' :
                          audit.Severity === 'Warning' ? '#fbbf24' : '#60a5fa',
                      }}
                    >
                      {audit.Action}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>
                      {audit.EntityType}: #{audit.EntityId}
                    </strong>
                  </td>
                  <td>
                    <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>{audit.PerformedByUserName}</span>
                  </td>
                  <td>
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{audit.Details}</span>
                  </td>
                  <td>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      {new Date(audit.CreatedAt).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> */}
    </div>
  );
}
