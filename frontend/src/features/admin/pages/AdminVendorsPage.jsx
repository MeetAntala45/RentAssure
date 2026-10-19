import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { useAdminToast } from '../context/AdminToastContext';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form inputs inside modal
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [customCommission, setCustomCommission] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [showSuspendBox, setShowSuspendBox] = useState(false);

  const { showToast } = useAdminToast();

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getVendors({
        status: statusFilter ? Number(statusFilter) : undefined,
        search: searchTerm,
        page: 1,
        pageSize: 50,
      });

      if (res.isSuccess && res.data) {
        setVendors(res.data.items || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Fetch Error', 'Failed to retrieve vendor registry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVendors();
  };

  const handleOpenDossier = async (vendorId) => {
    setIsActionLoading(true);
    try {
      const res = await adminService.getVendorById(vendorId);
      if (res.isSuccess) {
        setSelectedVendor(res.data);
        setAdminNotes(res.data.AdminNotes || '');
        setCustomCommission(res.data.CommissionRateOverride?.toString() || '');
        setShowRejectBox(false);
        setShowSuspendBox(false);
        setRejectionReason('');
        setIsDossierOpen(true);
      } else {
        showToast('error', 'Error', res.message || 'Could not load vendor dossier.');
      }
    } catch {
      showToast('error', 'Error', 'Failed to fetch vendor dossier.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedVendor) return;
    setIsActionLoading(true);
    try {
      const res = await adminService.approveVendor(selectedVendor.id, adminNotes);
      if (res.isSuccess) {
        showToast('success', 'Vendor Approved', `${selectedVendor.StoreName} has been approved for marketplace listings.`);
        setIsDossierOpen(false);
        fetchVendors();
      } else {
        showToast('error', 'Failed', res.message);
      }
    } catch {
      showToast('error', 'Error', 'Failed to approve vendor.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVendor || !rejectionReason.trim()) {
      showToast('error', 'Missing Reason', 'Please provide a clear rejection explanation for the applicant.');
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await adminService.rejectVendor(selectedVendor.id, rejectionReason.trim());
      if (res.isSuccess) {
        showToast('info', 'Vendor Rejected', `${selectedVendor.StoreName} onboarding application was rejected.`);
        setIsDossierOpen(false);
        fetchVendors();
      } else {
        showToast('error', 'Failed', res.message);
      }
    } catch {
      showToast('error', 'Error', 'Failed to reject vendor.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedVendor || !rejectionReason.trim()) {
      showToast('error', 'Missing Reason', 'Please provide a justification for suspending this vendor store.');
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await adminService.suspendVendor(selectedVendor.id, rejectionReason.trim());
      if (res.isSuccess) {
        showToast('warning', 'Vendor Suspended', `${selectedVendor.StoreName} listings have been suspended.`);
        setIsDossierOpen(false);
        fetchVendors();
      } else {
        showToast('error', 'Failed', res.message);
      }
    } catch {
      showToast('error', 'Error', 'Failed to suspend vendor.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateCommission = async () => {
    if (!selectedVendor) return;
    setIsActionLoading(true);
    try {
      const res = await adminService.updateVendorCommission(selectedVendor.id, customCommission);
      if (res.isSuccess) {
        showToast('success', 'Commission Updated', `Commission rate override saved for ${selectedVendor.StoreName}.`);
        handleOpenDossier(selectedVendor.id);
        fetchVendors();
      } else {
        showToast('error', 'Failed', res.message);
      }
    } catch {
      showToast('error', 'Error', 'Failed to update commission rate.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    // 1: PendingApproval, 2: Approved, 3: Rejected, 4: Suspended
    switch (status) {
      case 1:
        return (
          <span className="badge-status badge-status--pending">
            <span className="badge-status__dot" />
            Pending Verification
          </span>
        );
      case 2:
        return (
          <span className="badge-status badge-status--approved">
            <span className="badge-status__dot" />
            Active & Approved
          </span>
        );
      case 3:
        return (
          <span className="badge-status badge-status--rejected">
            <span className="badge-status__dot" />
            Rejected
          </span>
        );
      case 4:
        return (
          <span className="badge-status badge-status--suspended">
            <span className="badge-status__dot" />
            Suspended
          </span>
        );
      default:
        return <span>N/A</span>;
    }
  };

  return (
    <div>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1>Vendor Operations & Onboarding Queue</h1>
          <p>
            Verify business credentials, inspect catalog quality, manage commission overrides, and adjudicate vendor eligibility.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button
            onClick={fetchVendors}
            className="btn-admin btn-admin--secondary btn-admin--sm"
          >
            Refresh Registry
          </button>
        </div>
      </div>

      {/* ─── Filter & Search Bar ─────────────────────────────────────── */}
      <div className="admin-filter-bar">
        <div className="admin-tabs">
          <button
            onClick={() => setStatusFilter('')}
            className={`admin-tab ${statusFilter === '' ? 'active' : ''}`}
          >
            <span>All Stores</span>
            <span className="admin-tab-count">{totalCount}</span>
          </button>
          <button
            onClick={() => setStatusFilter('1')}
            className={`admin-tab ${statusFilter === '1' ? 'active' : ''}`}
          >
            <span>Pending Review</span>
            <span className="admin-tab-count" style={{ background: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24' }}>
              Action Req
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('2')}
            className={`admin-tab ${statusFilter === '2' ? 'active' : ''}`}
          >
            <span>Approved</span>
          </button>
          <button
            onClick={() => setStatusFilter('4')}
            className={`admin-tab ${statusFilter === '4' ? 'active' : ''}`}
          >
            <span>Suspended</span>
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="admin-input-group">
          <div className="admin-search-box">
            <svg className="admin-search-box__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="admin-search-box__input"
              placeholder="Search store, owner, city, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-admin btn-admin--secondary btn-admin--sm">
            Filter
          </button>
        </form>
      </div>

      {/* ─── Vendors Table ───────────────────────────────────────────── */}
      <div className="admin-card">
        <div className="admin-card__body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
              Loading vendor registry...
            </div>
          ) : vendors.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
              No vendors matching current filter criteria.
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Shop / Business Name</th>
                    <th>Owner & Contact</th>
                    <th>City / Location</th>
                    <th>Registration ID</th>
                    <th>Commission Rate</th>
                    <th>Listings & Earnings</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Dossier & Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                              border: '1px solid var(--admin-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: '#60a5fa',
                              fontSize: '0.85rem',
                              flexShrink: 0,
                            }}
                          >
                            {v.StoreName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: '#ffffff', fontSize: '0.9rem', display: 'block' }}>
                              {v.StoreName}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Joined {new Date(v.CreatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#f8fafc', fontWeight: 500 }}>{v.OwnerName}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{v.SupportEmail}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{v.PhoneNumber}</span>
                        </div>
                      </td>

                      <td>
                        <span style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                          {v.City}, {v.State}
                        </span>
                      </td>

                      <td>
                        <code style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '3px 6px', borderRadius: 4, color: '#38bdf8' }}>
                          {v.BusinessRegistrationNumber}
                        </code>
                      </td>

                      <td>
                        {v.CommissionRateOverride ? (
                          <span style={{ color: '#34d399', fontWeight: 600 }}>
                            {v.CommissionRateOverride}% <small style={{ color: '#94a3b8' }}>(custom)</small>
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>12.5% (Default)</span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '0.82rem' }}>
                          <span style={{ color: 'var(--admin-text-primary)', fontWeight: 600 }}>₹{v.TotalEarnings.toLocaleString('en-IN')}</span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)' }}>
                            {v.TotalItemsCount} listed • {v.ActiveBookingsCount} active
                          </div>
                        </div>
                      </td>

                      <td>{getStatusBadge(v.Status)}</td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenDossier(v.id)}
                          className="btn-admin btn-admin--primary btn-admin--sm"
                        >
                          Review Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── Vendor Dossier & Decision Modal ─────────────────────────── */}
      {isDossierOpen && selectedVendor && (
        <div className="admin-modal-backdrop" onClick={() => setIsDossierOpen(false)}>
          <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <h3>Vendor Verification Dossier: {selectedVendor.StoreName}</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Business ID: {selectedVendor.BusinessRegistrationNumber} • Registered: {new Date(selectedVendor.CreatedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => setIsDossierOpen(false)}
                className="admin-modal__close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="admin-modal__body">
              {/* Top Banner Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '10px',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Account Current Status</span>
                  <div style={{ marginTop: '0.2rem' }}>{getStatusBadge(selectedVendor.Status)}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Stripe Payout Capability</span>
                  <span style={{ fontSize: '0.85rem', color: selectedVendor.IsStripePayoutEnabled ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                    {selectedVendor.IsStripePayoutEnabled ? '✓ Express Connected' : '⏳ Pending Onboarding'}
                  </span>
                </div>
              </div>

              {/* Two Column Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 8, border: '1px solid var(--admin-border)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#38bdf8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Shop & Physical Verification
                  </h4>
                  <ul style={{ listStyle: 'none', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#cbd5e1' }}>
                    <li><strong>Store Name:</strong> {selectedVendor.StoreName}</li>
                    <li><strong>Owner Full Name:</strong> {selectedVendor.OwnerName}</li>
                    <li><strong>Physical Address:</strong> {selectedVendor.Address}</li>
                    <li><strong>City / Region:</strong> {selectedVendor.City}, {selectedVendor.State} {selectedVendor.PostalCode}</li>
                    <li><strong>Support Email:</strong> {selectedVendor.SupportEmail}</li>
                    <li><strong>Direct Telephone:</strong> {selectedVendor.PhoneNumber}</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 8, border: '1px solid var(--admin-border)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#38bdf8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Financial & Commission Rules
                  </h4>
                  <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                    <label>Commission Rate Override (%)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="50"
                        className="admin-form-input"
                        placeholder="Leave blank for platform default (12.5%)"
                        value={customCommission}
                        onChange={(e) => setCustomCommission(e.target.value)}
                      />
                      <button
                        onClick={handleUpdateCommission}
                        className="btn-admin btn-admin--secondary btn-admin--sm"
                        disabled={isActionLoading}
                      >
                        Save
                      </button>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Custom negotiated flat rate override for this merchant.
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-primary)' }}>
                    <div>Total Gross Volume: <strong>₹{selectedVendor.TotalEarnings.toLocaleString('en-IN')}</strong></div>
                    <div>Platform Commission Paid: <strong>₹{selectedVendor.TotalCommissionPaid.toLocaleString('en-IN')}</strong></div>
                  </div>
                </div>
              </div>

              {/* Catalog Sample Review */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.88rem', color: 'var(--admin-text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Inventory Catalog Samples ({selectedVendor.Items?.length || 0} items)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>Pre-inspected photos & plans</span>
                </h4>

                {(!selectedVendor.Items || selectedVendor.Items.length === 0) ? (
                  <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: 8, textAlign: 'center', color: 'var(--admin-text-secondary)', fontSize: '0.82rem' }}>
                    Vendor has not yet populated draft rental items.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {selectedVendor.Items.map((item) => (
                      <div
                        key={item.Id}
                        style={{
                          background: 'var(--primary-subtle, #f0f5f9)',
                          border: '1px solid var(--admin-border)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                        }}
                      >
                        <strong style={{ fontSize: '0.82rem', color: 'var(--admin-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.Title}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
                          Category: {item.CategoryName} • Condition: {item.Condition}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                          <span style={{ color: 'var(--admin-accent-blue)', fontWeight: 600 }}>₹{item.MonthlyRent}/mo</span>
                          <span style={{ color: 'var(--admin-text-secondary)' }}>Dep: ₹{item.SecurityDeposit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Internal Notes */}
              <div className="admin-form-group">
                <label>Admin Verification & Compliance Notes</label>
                <textarea
                  rows="3"
                  className="admin-form-textarea"
                  placeholder="Record ID verification checks, insurance certificates, or inspection notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              {/* Rejection / Suspension Box if toggled */}
              {showRejectBox && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1rem', borderRadius: 8, marginTop: '1rem' }}>
                  <label style={{ color: '#f87171', fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem' }}>
                    Specify Rejection Reason (communicated to vendor):
                  </label>
                  <textarea
                    rows="2"
                    className="admin-form-textarea"
                    placeholder="e.g. Unverified tax document, ineligible category, low quality imagery..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      onClick={() => setShowRejectBox(false)}
                      className="btn-admin btn-admin--secondary btn-admin--sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      className="btn-admin btn-admin--danger btn-admin--sm"
                      disabled={isActionLoading}
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}

              {showSuspendBox && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '1rem', borderRadius: 8, marginTop: '1rem' }}>
                  <label style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem' }}>
                    Specify Suspension Cause:
                  </label>
                  <textarea
                    rows="2"
                    className="admin-form-textarea"
                    placeholder="e.g. Repeated late pickups, uninspected inventory, policy violation..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      onClick={() => setShowSuspendBox(false)}
                      className="btn-admin btn-admin--secondary btn-admin--sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSuspend}
                      className="btn-admin btn-admin--danger btn-admin--sm"
                      disabled={isActionLoading}
                    >
                      Confirm Suspension
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="admin-modal__footer">
              <button
                onClick={() => setIsDossierOpen(false)}
                className="btn-admin btn-admin--secondary"
              >
                Close
              </button>

              {selectedVendor.Status === 1 && !showRejectBox && (
                <>
                  <button
                    onClick={() => { setShowRejectBox(true); setShowSuspendBox(false); }}
                    className="btn-admin btn-admin--danger"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={handleApprove}
                    className="btn-admin btn-admin--success"
                    disabled={isActionLoading}
                  >
                    Approve Store for Live Listings
                  </button>
                </>
              )}

              {selectedVendor.Status === 2 && !showSuspendBox && (
                <button
                  onClick={() => { setShowSuspendBox(true); setShowRejectBox(false); }}
                  className="btn-admin btn-admin--danger"
                >
                  Suspend Store
                </button>
              )}

              {selectedVendor.Status === 4 && (
                <button
                  onClick={handleApprove}
                  className="btn-admin btn-admin--success"
                  disabled={isActionLoading}
                >
                  Re-activate Store
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
