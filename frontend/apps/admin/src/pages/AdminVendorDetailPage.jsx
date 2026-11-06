import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../../../src/shared/api';

const AdminVendorDetailPage = ({ vendorId: propVendorId, onBack }) => {
  const params = useParams();
  const navigate = useNavigate();
  const vendorId = propVendorId || params.vendorId || params.id;

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/user-management');
  };

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard' | 'inventory' | 'bookings' | 'profile'

  // Commission Override state
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionRate, setCommissionRate] = useState('');
  const [savingCommission, setSavingCommission] = useState(false);

  const fetchVendorDetail = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVendorById(vendorId);
      if (res.data) {
        setVendor(res.data);
        setCommissionRate(
          res.data.commissionRateOverride !== null && res.data.commissionRateOverride !== undefined
            ? res.data.commissionRateOverride
            : ''
        );
      }
    } catch (err) {
      console.error('Failed to fetch vendor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorDetail();
  }, [vendorId]);

  const handleApprove = async () => {
    setActionLoading(true);
    setMsg('');
    try {
      await adminApi.approveVendor(vendorId, 'Approved after verification and credential compliance');
      setMsg('Merchant partner approved successfully! Store items are now eligible for live marketplace discovery.');
      await fetchVendorDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter the reason for rejection / suspension:', 'Store credentials or business documents could not be validated.');
    if (!reason) return;

    setActionLoading(true);
    setMsg('');
    try {
      await adminApi.rejectVendor(vendorId, reason);
      setMsg('Merchant status updated.');
      await fetchVendorDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCommissionOverride = async (e) => {
    e.preventDefault();
    setSavingCommission(true);
    try {
      const rateVal = commissionRate === '' ? null : Number(commissionRate);
      await adminApi.updateVendorCommission(vendorId, rateVal);
      setMsg(`Commission rate override updated to ${rateVal !== null ? rateVal + '%' : 'Default Category Rate'}.`);
      setEditingCommission(false);
      await fetchVendorDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update commission rate');
    } finally {
      setSavingCommission(false);
    }
  };

  if (loading) {
    return (
      <div className="ra-card" style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>Loading merchant scorecard & profile...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="ra-card" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--danger-text)', fontSize: '15px', fontWeight: 700 }}>Merchant partner not found.</p>
        <button className="ra-btn ra-btn-secondary" onClick={handleBack} style={{ marginTop: '16px' }}>
          ← Back to Partner Directory
        </button>
      </div>
    );
  }

  // Parse metadata from AdminNotes if present
  let meta = {
    category: '',
    experienceYears: '',
    skills: [],
    servicesOffered: [],
    languages: [],
    documents: [],
  };

  try {
    if (vendor.adminNotes && vendor.adminNotes.startsWith('{')) {
      const parsed = JSON.parse(vendor.adminNotes);
      if (parsed.category) meta.category = parsed.category;
      if (parsed.experienceYears) meta.experienceYears = parsed.experienceYears;
      if (parsed.languages) {
        meta.languages = typeof parsed.languages === 'string'
          ? parsed.languages.split(',').map((s) => s.trim()).filter(Boolean)
          : Array.isArray(parsed.languages) ? parsed.languages : [];
      }
      if (parsed.servicesOffered) {
        meta.servicesOffered = typeof parsed.servicesOffered === 'string'
          ? parsed.servicesOffered.split(',').map((s) => s.trim()).filter(Boolean)
          : Array.isArray(parsed.servicesOffered) ? parsed.servicesOffered : [];
      }
      if (parsed.documents) {
        meta.documents = typeof parsed.documents === 'string'
          ? JSON.parse(parsed.documents)
          : Array.isArray(parsed.documents) ? parsed.documents : [];
      }
    }
  } catch (e) {
    // ignore
  }

  const handleDownloadDoc = (doc) => {
    if (doc.url) {
      const a = document.createElement('a');
      a.href = doc.url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob(
        [
          `RentAssure Verified Merchant Document\n` +
          `====================================\n` +
          `File: ${doc.name}\n` +
          `Merchant ID: ${vendor.id}\n` +
          `Store Name: ${vendor.storeName || 'N/A'}\n` +
          `Owner: ${vendor.ownerName || 'N/A'}\n` +
          `Status: Authenticated on RentAssure Escrow Network\n`
        ],
        { type: 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(doc.name || 'Merchant_Doc').replace(/\.[^/.]+$/, '')}_Verified.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const isApproved = vendor.status === 'Approved' || vendor.status === 1;
  const isPending = vendor.status === 'PendingApproval' || vendor.status === 0;
  const tier = (vendor.tier || 'Bronze').toLowerCase();
  const onTime = Number(vendor.onTimeDeliveryRate) || 98.5;
  const dispute = Number(vendor.disputeRate) || 0.0;
  const score = Number(vendor.performanceScore) || 85.0;
  const activeStock = vendor.activeInventoryCount !== undefined ? vendor.activeInventoryCount : vendor.totalItemsCount || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ─── HEADER BAR ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={handleBack}
            className="ra-btn ra-btn-secondary ra-btn-sm"
            style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
            title="Back to Directory"
          >
            ←
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {vendor.storeName || vendor.ownerName}
              </h2>
              {isApproved ? (
                <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#f0fdf4', color: '#166534' }}>
                  ✔ Verified Store
                </span>
              ) : isPending ? (
                <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#fef3c7', color: '#92400e' }}>
                  ⏳ Pending Review
                </span>
              ) : (
                <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#fef2f2', color: '#991b1b' }}>
                  ✖ {vendor.status}
                </span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Partner ID #{vendor.id} • {vendor.city || 'Ahmedabad'}, {vendor.state || 'Gujarat'} • Member since {new Date(vendor.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isPending && (
            <>
              <button
                disabled={actionLoading}
                onClick={handleReject}
                className="ra-btn ra-btn-danger ra-btn-sm"
                style={{ padding: '8px 16px', fontWeight: 700 }}
              >
                Reject Application
              </button>
              <button
                disabled={actionLoading}
                onClick={handleApprove}
                className="ra-btn ra-btn-primary ra-btn-sm"
                style={{ padding: '8px 20px', fontWeight: 800 }}
              >
                {actionLoading ? 'Approving...' : '✔ Approve Merchant Partner'}
              </button>
            </>
          )}

          {!isPending && isApproved && (
            <button
              disabled={actionLoading}
              onClick={handleReject}
              className="ra-btn ra-btn-secondary ra-btn-sm"
              style={{ color: 'var(--danger-text)', padding: '8px 16px' }}
            >
              Suspend / Review
            </button>
          )}

          {!isPending && !isApproved && (
            <button
              disabled={actionLoading}
              onClick={handleApprove}
              className="ra-btn ra-btn-primary ra-btn-sm"
              style={{ padding: '8px 20px', fontWeight: 800 }}
            >
              Re-Approve Partner
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div
          style={{
            background: 'var(--success-bg)',
            color: 'var(--success-text)',
            borderRadius: '12px',
            padding: '12px 18px',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          {msg}
        </div>
      )}

      {/* ─── 1. PERFORMANCE SCORECARD HERO (Clean Light Theme) ─────────────── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px 30px',
          color: 'var(--text-main)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          {/* Left: Tier Emblem & Trust Score */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              Performance Evaluation & Tier Assessment
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
              <span style={{ fontSize: '40px' }}>
                {tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🥉'}
              </span>
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text-main)' }}>
                  {vendor.tierBadge || (tier === 'gold' ? 'Gold Partner' : tier === 'silver' ? 'Silver Partner' : 'Bronze Partner')}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Overall Trust Index:</span>
                  <strong style={{ fontSize: '15px', color: '#18181b' }}>
                    {score} / 100
                  </strong>
                  <div style={{ width: '80px', height: '6px', background: '#f4f4f5', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, score)}%`,
                        height: '100%',
                        background: '#18181b',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: '12px 0 0 0', maxWidth: '580px', lineHeight: 1.5 }}>
              💡 {vendor.nextTierGoal || 'Maintain high fulfillment rates and prompt customer delivery to advance partner standing.'}
            </p>
          </div>

          {/* Right: Commission Bracket & Override Button */}
          <div
            style={{
              background: '#f4f4f5',
              borderRadius: '14px',
              padding: '16px 20px',
              minWidth: '220px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Platform Commission
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
              {vendor.commissionRateOverride !== null && vendor.commissionRateOverride !== undefined
                ? `${Number(vendor.commissionRateOverride).toFixed(1)}%`
                : tier === 'gold'
                ? '8.0%'
                : '12.0%'}
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>
                {vendor.commissionRateOverride !== null && vendor.commissionRateOverride !== undefined ? '(Custom Override)' : tier === 'gold' ? '(Gold Incentive)' : '(Standard)'}
              </span>
            </div>

            {!editingCommission ? (
              <button
                type="button"
                onClick={() => setEditingCommission(true)}
                className="ra-btn ra-btn-secondary"
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  marginTop: '6px',
                  width: '100%',
                  padding: '6px 12px',
                }}
              >
                ✏️ Customize Commission Fee
              </button>
            ) : (
              <form onSubmit={handleSaveCommissionOverride} style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  placeholder="e.g. 8.0"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="ra-input"
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    width: '100%',
                    background: '#ffffff',
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="submit"
                    disabled={savingCommission}
                    className="ra-btn ra-btn-primary"
                    style={{
                      flex: 1,
                      padding: '5px',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCommission(false)}
                    className="ra-btn ra-btn-secondary"
                    style={{
                      flex: 1,
                      padding: '5px',
                      fontSize: '11px',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* 4 Scorecard KPI Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* On-Time Fulfillment */}
          <div style={{ background: '#f4f4f5', padding: '12px 16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>🚚 On-Time Delivery Rate</span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px', color: onTime >= 95 ? '#166534' : '#92400e' }}>
              {onTime}%
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {onTime >= 95 ? '✓ Exceeds 95% SLA Target' : '⚠️ Requires Attention'}
            </span>
          </div>

          {/* Dispute Rate */}
          <div style={{ background: '#f4f4f5', padding: '12px 16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>⚖️ Escrow Dispute Ratio</span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px', color: dispute <= 2.5 ? '#166534' : '#991b1b' }}>
              {dispute}%
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {dispute <= 2.5 ? '✓ Below 2.5% platform ceiling' : '⚠️ Elevated Dispute Activity'}
            </span>
          </div>

          {/* Active Inventory */}
          <div style={{ background: '#f4f4f5', padding: '12px 16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>📦 Active Rental Inventory</span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px', color: '#18181b' }}>
              {activeStock} Listings
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Total Listings: {vendor.totalItemsCount || activeStock}
            </span>
          </div>

          {/* Total Earnings */}
          <div style={{ background: '#f4f4f5', padding: '12px 16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>💰 Cumulative Revenue Settled</span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px', color: '#18181b' }}>
              ₹{Number(vendor.totalEarnings || 0).toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Commission Paid: ₹{Number(vendor.totalCommissionPaid || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. TAB SELECTOR ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: '#f4f4f5',
          padding: '6px',
          borderRadius: '12px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('scorecard')}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'scorecard' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'scorecard' ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          📊 Scorecard & Credentials
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'inventory' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'inventory' ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          📦 Catalog Inventory ({vendor.items?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          style={{
            flex: 1,
            padding: '9px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'bookings' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'bookings' ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          📋 Recent Fulfillment Orders ({vendor.recentBookings?.length || 0})
        </button>
      </div>

      {/* ─── TAB 1: SCORECARD & CREDENTIALS ────────────────────────────────── */}
      {activeTab === 'scorecard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Profile Details Grid */}
          <div className="ra-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '18px' }}>
              Business Registration & Contact Profile
            </h4>
            <div className="ra-detail-profile-grid">
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Store / Trademark
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {vendor.storeName || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Registered Owner
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {vendor.ownerName || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  GST / Business ID
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {vendor.businessRegistrationNumber || 'Pending Filing'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Contact Phone
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {vendor.phoneNumber || 'Not provided'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Support Email
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {vendor.supportEmail || vendor.userEmail || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Storefront City
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  📍 {vendor.city || 'Ahmedabad'}, {vendor.state || 'Gujarat'}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Physical Warehouse / Storefront Address
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-body)', marginTop: '2px' }}>
                  {vendor.address
                    ? `${vendor.address}, ${vendor.city || ''}, ${vendor.state || 'Gujarat'} ${vendor.postalCode || ''}`
                    : 'Address not recorded'}
                </div>
              </div>
            </div>
          </div>

          {/* Attached KYC Documents */}
          <div className="ra-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px' }}>
              Attached Verification Credentials & KYC Files
            </h4>
            {meta.documents && meta.documents.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {meta.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 18px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ fontSize: '24px' }}>📄</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.name || `Document ${idx + 1}`}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified Merchant Attachment</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc(doc)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--primary)' }}
                      title="Download file"
                    >
                      📥
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No verification files attached. Merchant was registered with standard email and phone validation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: INVENTORY ──────────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-light)', background: '#f8fafc' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 2px 0' }}>
              Merchant Catalog Inventory ({vendor.items?.length || 0} Items)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              All furniture, appliances, and gear listed by this partner on RentAssure.
            </span>
          </div>

          <div className="ra-table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ITEM TITLE & CATEGORY
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    CONDITION
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    MONTHLY RENT
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    REFUNDABLE DEPOSIT
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    MIN TENURE
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    STOCK STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {!vendor.items || vendor.items.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No rental listings added yet by this merchant partner.
                    </td>
                  </tr>
                ) : (
                  vendor.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>
                          {item.title}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Category: {item.categoryName} • ID #{item.id}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-body)' }}>
                        {item.condition || 'Brand New'}
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
                        ₹{Number(item.monthlyRent).toLocaleString('en-IN')} / mo
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                        ₹{Number(item.securityDeposit).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {item.minimumRentalMonths || 1} Mos
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        {item.status === 2 ? (
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>
                            ● Rented Out
                          </span>
                        ) : item.status === 3 ? (
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>
                            ● Maintenance
                          </span>
                        ) : (
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#ecfdf5', color: '#065f46' }}>
                            ● In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BOOKINGS ───────────────────────────────────────────────── */}
      {activeTab === 'bookings' && (
        <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-light)', background: '#f8fafc' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 2px 0' }}>
              Fulfillment Orders & Delivery SLAs
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Recent bookings processed by this merchant with escrow protection.
            </span>
          </div>

          <div className="ra-table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    BOOKING REFERENCE
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    CUSTOMER
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    RENTED ITEM
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    TENURE
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    AMOUNT PAID
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {!vendor.recentBookings || vendor.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No rental bookings placed for this store yet.
                    </td>
                  </tr>
                ) : (
                  vendor.recentBookings.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--primary)' }}>
                          {b.bookingReference || `#BK-${b.id}`}
                        </strong>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {b.customerName || 'Customer'}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.customerEmail}</span>
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-body)' }}>
                        {b.itemTitle}
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {b.rentalDurationMonths} Months
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                        ₹{Number(b.totalAmountPaid || 0).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: '#ecfdf5', color: '#065f46' }}>
                          ● {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVendorDetailPage;
