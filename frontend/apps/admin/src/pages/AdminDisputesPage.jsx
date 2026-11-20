import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../src/shared/api';

const DISPUTE_REASONS = {
  1: 'Damage Assessment',
  2: 'Deposit Deduction Claim',
  3: 'Delivery Delay / Failure',
  4: 'Pickup / Return Logistics Delay',
  5: 'Item Condition Mismatch / Defect',
  DamageAssessment: 'Damage Assessment',
  DepositDeduction: 'Deposit Deduction Claim',
  DeliveryFailure: 'Delivery Delay / Failure',
  LateReturn: 'Pickup / Return Logistics Delay',
  ItemConditionMismatch: 'Item Condition Mismatch / Defect',
};

const DECISION_ENUM_MAP = {
  3: 'ResolvedCustomerFavored',
  4: 'ResolvedVendorFavored',
  5: 'SplitResolution',
  6: 'Closed',
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected dispute for Arbitration Modal
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [arbitrationForm, setArbitrationForm] = useState({
    decision: 3, // 3: ResolvedCustomerFavored, 4: ResolvedVendorFavored, 5: SplitResolution, 6: Closed
    refundToCustomerAmount: '',
    payoutToVendorAmount: '',
    adminNotes: '',
    submitting: false,
    error: '',
  });

  const fetchDisputes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getDisputes({ pageSize: 100 });
      if (res.isSuccess) {
        const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setDisputes(items);
      } else {
        setDisputes([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load disputes from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const openArbitrationModal = async (d) => {
    setSelectedDispute(d);
    const totalDeposit = Number(d.depositHeld || d.claimAmount || 0);

    setArbitrationForm({
      decision: 3,
      refundToCustomerAmount: totalDeposit,
      payoutToVendorAmount: 0,
      adminNotes: '',
      submitting: false,
      error: '',
    });

    try {
      const res = await adminApi.getDisputeById(d.id);
      if (res.isSuccess && res.data) {
        setSelectedDispute(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch dispute detail:', err);
    }
  };

  const handleCustomerRefundChange = (val) => {
    const totalDeposit = Number(selectedDispute?.depositHeld || selectedDispute?.claimAmount || 0);
    const num = Math.max(0, Math.min(totalDeposit, Number(val) || 0));
    setArbitrationForm((prev) => ({
      ...prev,
      refundToCustomerAmount: num,
      payoutToVendorAmount: Math.max(0, totalDeposit - num),
      error: '',
    }));
  };

  const handleVendorPayoutChange = (val) => {
    const totalDeposit = Number(selectedDispute?.depositHeld || selectedDispute?.claimAmount || 0);
    const num = Math.max(0, Math.min(totalDeposit, Number(val) || 0));
    setArbitrationForm((prev) => ({
      ...prev,
      payoutToVendorAmount: num,
      refundToCustomerAmount: Math.max(0, totalDeposit - num),
      error: '',
    }));
  };

  const handleDecisionTypeChange = (decisionType) => {
    const dType = Number(decisionType);
    const totalDeposit = Number(selectedDispute?.depositHeld || selectedDispute?.claimAmount || 0);

    let custRefund = 0;
    let vendPayout = 0;

    if (dType === 3) {
      // Full refund to customer
      custRefund = totalDeposit;
      vendPayout = 0;
    } else if (dType === 4) {
      // Award to vendor
      custRefund = 0;
      vendPayout = totalDeposit;
    } else if (dType === 5) {
      // 50-50 split default
      custRefund = Math.round(totalDeposit / 2);
      vendPayout = totalDeposit - custRefund;
    } else if (dType === 6) {
      // Dismiss / close
      custRefund = totalDeposit;
      vendPayout = 0;
    }

    setArbitrationForm((prev) => ({
      ...prev,
      decision: dType,
      refundToCustomerAmount: custRefund,
      payoutToVendorAmount: vendPayout,
      error: '',
    }));
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    const totalDeposit = Number(selectedDispute?.depositHeld || selectedDispute?.claimAmount || 0);
    const custRefund = Number(arbitrationForm.refundToCustomerAmount) || 0;
    const vendPayout = Number(arbitrationForm.payoutToVendorAmount) || 0;

    if (custRefund < 0 || vendPayout < 0) {
      setArbitrationForm((prev) => ({
        ...prev,
        error: 'Disbursement amounts cannot be negative.',
      }));
      return;
    }

    if (Math.round(custRefund + vendPayout) !== Math.round(totalDeposit)) {
      setArbitrationForm((prev) => ({
        ...prev,
        error: `Sum must equal the deposit! Customer refund (₹${custRefund}) + Vendor payout (₹${vendPayout}) = ₹${custRefund + vendPayout}, but total escrow deposit is ₹${totalDeposit}.`,
      }));
      return;
    }

    if (!arbitrationForm.adminNotes.trim()) {
      setArbitrationForm((prev) => ({
        ...prev,
        error: 'Please enter official arbitration findings and administrative notes.',
      }));
      return;
    }

    setArbitrationForm((prev) => ({ ...prev, submitting: true, error: '' }));
    try {
      const res = await adminApi.resolveDispute(selectedDispute.id, {
        decision: DECISION_ENUM_MAP[arbitrationForm.decision] || Number(arbitrationForm.decision),
        refundToCustomerAmount: custRefund,
        payoutToVendorAmount: vendPayout,
        adminNotes: arbitrationForm.adminNotes.trim(),
      });

      if (res.isSuccess) {
        alert(`✓ Dispute ${selectedDispute.disputeTicketNumber} successfully resolved and escrow disbursed.`);
        setSelectedDispute(null);
        await fetchDisputes();
      } else {
        setArbitrationForm((prev) => ({ ...prev, error: res.message || 'Failed to resolve dispute.' }));
      }
    } catch (err) {
      setArbitrationForm((prev) => ({
        ...prev,
        error: err.response?.data?.message || err.message || 'Error executing dispute resolution.',
      }));
    } finally {
      setArbitrationForm((prev) => ({ ...prev, submitting: false }));
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (d.disputeTicketNumber || '').toLowerCase().includes(s) ||
      (d.bookingReference || '').toLowerCase().includes(s) ||
      (d.customerName || '').toLowerCase().includes(s) ||
      (d.vendorStoreName || '').toLowerCase().includes(s) ||
      (d.itemTitle || '').toLowerCase().includes(s);

    const statusVal = String(d.status || '').toLowerCase();
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Open' && (statusVal === 'open' || statusVal === '1')) ||
      (statusFilter === 'UnderReview' && (statusVal === 'underreview' || statusVal === '2')) ||
      (statusFilter === 'Resolved' &&
        (statusVal === 'resolvedcustomerfavored' ||
          statusVal === 'resolvedvendorfavored' ||
          statusVal === 'splitresolution' ||
          statusVal === '3' ||
          statusVal === '4' ||
          statusVal === '5')) ||
      (statusFilter === 'Closed' && (statusVal === 'closed' || statusVal === '6'));

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalCount = disputes.length;
  const openCount = disputes.filter((d) => {
    const s = String(d.status || '').toLowerCase();
    return s === 'open' || s === '1' || s === 'underreview' || s === '2';
  }).length;

  const resolvedCount = disputes.filter((d) => {
    const s = String(d.status || '').toLowerCase();
    return (
      s === 'resolvedcustomerfavored' ||
      s === 'resolvedvendorfavored' ||
      s === 'splitresolution' ||
      s === 'closed' ||
      s === '3' ||
      s === '4' ||
      s === '5' ||
      s === '6'
    );
  }).length;

  const totalInDisputeAmount = disputes
    .filter((d) => {
      const s = String(d.status || '').toLowerCase();
      return s === 'open' || s === '1' || s === 'underreview' || s === '2';
    })
    .reduce((sum, d) => sum + (Number(d.claimAmount || d.depositHeld) || 0), 0);

  const getDisputeStatusBadge = (statusVal) => {
    const s = String(statusVal || '').toLowerCase();

    if (s === 'open' || s === '1') {
      return (
        <span style={{ padding: '4px 10px', borderRadius: '9999px', background: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 700 }}>
          ⚠️ Open Dispute
        </span>
      );
    }
    if (s === 'underreview' || s === '2') {
      return (
        <span style={{ padding: '4px 10px', borderRadius: '9999px', background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: 700 }}>
          ⏳ Under Review
        </span>
      );
    }
    if (s === 'resolvedcustomerfavored' || s === '3') {
      return (
        <span style={{ padding: '4px 10px', borderRadius: '9999px', background: '#f0fdf4', color: '#166534', fontSize: '12px', fontWeight: 700 }}>
          ✓ Customer Favored
        </span>
      );
    }
    if (s === 'resolvedvendorfavored' || s === '4') {
      return (
        <span style={{ padding: '4px 10px', borderRadius: '9999px', background: '#eff6ff', color: '#1e40af', fontSize: '12px', fontWeight: 700 }}>
          ✓ Merchant Favored
        </span>
      );
    }
    if (s === 'splitresolution' || s === '5') {
      return (
        <span style={{ padding: '4px 10px', borderRadius: '9999px', background: '#faf5ff', color: '#6b21a8', fontSize: '12px', fontWeight: 700 }}>
          ⚖️ Split Resolution
        </span>
      );
    }
    return (
      <span style={{ padding: '4px 10px', borderRadius: '9999px', background: '#f4f4f5', color: '#52525b', fontSize: '12px', fontWeight: 700 }}>
        Closed
      </span>
    );
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#18181b', margin: '0 0 6px 0' }}>
            Dispute & Escrow Arbitration Console
          </h1>
          <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>
            Arbitrate customer-merchant disputes, inspect evidence, and decide fair security deposit escrow disbursement.
          </p>
        </div>

        <button
          onClick={fetchDisputes}
          disabled={loading}
          className="ra-btn ra-btn-secondary ra-btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            fontWeight: 600,
          }}
        >
          <span>↻</span>
          <span>{loading ? 'Refreshing...' : 'Refresh Disputes'}</span>
        </button>
      </div>

      {/* ─── KPI SUMMARY METRICS ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="ra-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL DISPUTES FILED</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>All-time formal arbitration claims</div>
        </div>

        <div className="ra-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#b91c1c' }}>AWAITING ARBITRATION</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#b91c1c', marginTop: '8px' }}>
            {openCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Requires Admin evidence review</div>
        </div>

        <div className="ra-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>ESCROW IN ARBITRATION</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#92400e', marginTop: '8px' }}>
            ₹{totalInDisputeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Locked pending administrative ruling</div>
        </div>

        <div className="ra-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>RESOLVED & SETTLED</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#166534', marginTop: '8px' }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Legally closed with funds disbursed</div>
        </div>
      </div>

      {/* ─── FILTERS & SEARCH ────────────────────────────────────────────── */}
      <div
        className="ra-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {['All', 'Open', 'UnderReview', 'Resolved', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: 'none',
                background: statusFilter === st ? '#18181b' : '#f4f4f5',
                color: statusFilter === st ? '#ffffff' : '#3f3f46',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {st === 'All' ? 'All Disputes' : st === 'UnderReview' ? 'Under Review' : st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <input
            type="text"
            placeholder="Search ticket, ref, customer, store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ra-input"
            style={{
              paddingLeft: '34px',
              height: '38px',
              fontSize: '13px',
              borderRadius: '8px',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            🔍
          </span>
        </div>
      </div>

      {/* ─── DATA TABLE ──────────────────────────────────────────────────── */}
      <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading arbitration cases...
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#b91c1c' }}>
            {error}
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No dispute cases found matching current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>TICKET #</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>BOOKING REF & ITEM</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>CUSTOMER</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>MERCHANT</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>DISPUTE REASON</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>CLAIMED AMOUNT</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>STATUS</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredDisputes.map((d) => (
                  <tr
                    key={d.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{d.disputeTicketNumber}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{d.bookingReference}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{d.itemTitle}</div>
                    </td>

                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#1e293b' }}>{d.customerName}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#1e293b' }}>{d.vendorStoreName}</td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {DISPUTE_REASONS[d.reason] || 'General Escrow Contestation'}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, color: '#991b1b' }}>
                        ₹{Number(d.claimAmount || d.depositHeld || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Deposit: ₹{Number(d.depositHeld || 0).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>{getDisputeStatusBadge(d.status)}</td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => openArbitrationModal(d)}
                        className="ra-btn ra-btn-secondary ra-btn-sm"
                        style={{ fontSize: '12px', padding: '6px 12px', fontWeight: 700 }}
                      >
                        {String(d.status || '').toLowerCase() === 'open' || d.status === 1 ? '⚖️ Arbitrate' : 'View Case'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ARBITRATION & RESOLUTION MODAL ──────────────────────────────── */}
      {selectedDispute && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
          onClick={() => setSelectedDispute(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>⚖️</span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Arbitration Case: {selectedDispute.disputeTicketNumber}
                  </h3>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Booking Reference: <strong>{selectedDispute.bookingReference}</strong> ({selectedDispute.itemTitle})
                </div>
              </div>

              <div>{getDisputeStatusBadge(selectedDispute.status)}</div>
            </div>

            {/* Case Snapshot Box */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>COMPLAINANT / CUSTOMER</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedDispute.customerName}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>RESPONDENT / MERCHANT</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedDispute.vendorStoreName}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>DISPUTED REASON</div>
                  <div style={{ fontWeight: 700, color: '#b91c1c', marginTop: '2px' }}>
                    {DISPUTE_REASONS[selectedDispute.reason] || 'Contested Security Deposit Deduction'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>SECURITY DEPOSIT IN ESCROW</div>
                  <div style={{ fontWeight: 800, color: '#0369a1', marginTop: '2px', fontSize: '15px' }}>
                    ₹{Number(selectedDispute.depositHeld || selectedDispute.claimAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                  CUSTOMER STATEMENT & EVIDENCE DETAILS:
                </div>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#334155',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  {selectedDispute.description || 'No detailed statement entered.'}
                </div>
              </div>
            </div>

            {/* Arbitration Rulings Form / Resolved State */}
            {selectedDispute.status === 'ResolvedCustomerFavored' ||
            selectedDispute.status === 'ResolvedVendorFavored' ||
            selectedDispute.status === 'SplitResolution' ||
            selectedDispute.status === 'Closed' ||
            selectedDispute.status === 3 ||
            selectedDispute.status === 4 ||
            selectedDispute.status === 5 ||
            selectedDispute.status === 6 ? (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#166534',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '6px' }}>
                  ✓ This Dispute Has Been Formally Resolved & Disbursed
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <div>Refund to Customer: <strong>₹{Number(selectedDispute.refundToCustomerAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                  <div>Payout to Merchant: <strong>₹{Number(selectedDispute.payoutToVendorAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                </div>
                {selectedDispute.adminDecisionNotes && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #bbf7d0' }}>
                    <strong>Admin Ruling Notes:</strong> {selectedDispute.adminDecisionNotes}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleResolveDispute}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                  Official Administrator Arbitration Decision
                </div>

                {arbitrationForm.error && (
                  <div
                    style={{
                      background: '#fee2e2',
                      border: '1px solid #f87171',
                      color: '#b91c1c',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      marginBottom: '16px',
                    }}
                  >
                    {arbitrationForm.error}
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Arbitration Ruling Option
                  </label>
                  <select
                    value={arbitrationForm.decision}
                    onChange={(e) => handleDecisionTypeChange(e.target.value)}
                    className="ra-select"
                    style={{ background: '#f4f4f5', borderRadius: '8px', padding: '10px 14px', fontWeight: 700 }}
                  >
                    <option value={3}>Full Refund to Customer (Merchant claim unverified / item defect verified)</option>
                    <option value={4}>Award Full Deposit to Merchant (Verified damage / non-return by customer)</option>
                    <option value={5}>Split Escrow Resolution (Fair partial deduction & partial refund)</option>
                    <option value={6}>Dismiss & Close Dispute (Invalid claim, normal rental cycle resumes)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Disburse to Customer Card (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={Number(selectedDispute?.depositHeld || selectedDispute?.claimAmount || 0)}
                      value={arbitrationForm.refundToCustomerAmount}
                      readOnly={arbitrationForm.decision !== 5}
                      onChange={(e) => handleCustomerRefundChange(e.target.value)}
                      className="ra-input"
                      style={{
                        background: arbitrationForm.decision === 5 ? '#ffffff' : '#f1f5f9',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontWeight: 700,
                        cursor: arbitrationForm.decision === 5 ? 'text' : 'not-allowed',
                      }}
                    />
                    {arbitrationForm.decision === 3 && (
                      <span style={{ fontSize: '11px', color: '#166534', marginTop: '3px', display: 'block' }}>
                        🔒 100% of deposit returned to customer
                      </span>
                    )}
                    {arbitrationForm.decision === 4 && (
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                        🔒 ₹0 refunded to customer
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Disburse to Merchant Payout (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={Number(selectedDispute?.depositHeld || selectedDispute?.claimAmount || 0)}
                      value={arbitrationForm.payoutToVendorAmount}
                      readOnly={arbitrationForm.decision !== 5}
                      onChange={(e) => handleVendorPayoutChange(e.target.value)}
                      className="ra-input"
                      style={{
                        background: arbitrationForm.decision === 5 ? '#ffffff' : '#f1f5f9',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontWeight: 700,
                        cursor: arbitrationForm.decision === 5 ? 'text' : 'not-allowed',
                      }}
                    />
                    {arbitrationForm.decision === 4 && (
                      <span style={{ fontSize: '11px', color: '#1e40af', marginTop: '3px', display: 'block' }}>
                        🔒 100% of deposit awarded to merchant
                      </span>
                    )}
                    {arbitrationForm.decision === 3 && (
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                        🔒 ₹0 awarded to merchant
                      </span>
                    )}
                  </div>

                  {arbitrationForm.decision === 5 && (
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span style={{ color: '#475569' }}>Escrow Security Deposit:</span>
                        <span style={{ color: '#0f172a' }}>
                          ₹{Number(selectedDispute?.depositHeld || selectedDispute?.claimAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '4px', color: '#166534' }}>
                        <span>
                          Customer (₹{Number(arbitrationForm.refundToCustomerAmount || 0).toLocaleString('en-IN')}) + Merchant (₹{Number(arbitrationForm.payoutToVendorAmount || 0).toLocaleString('en-IN')})
                        </span>
                        <span>
                          = ₹{(Number(arbitrationForm.refundToCustomerAmount || 0) + Number(arbitrationForm.payoutToVendorAmount || 0)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px' }}>
                        ✓ Auto-Balanced: Editing either amount automatically adjusts the other so the sum strictly matches the deposit.
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Arbitration Justification & Official Notes
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Provide evidence summary, checklist citations, and reasoning for this arbitration ruling..."
                    value={arbitrationForm.adminNotes}
                    onChange={(e) => setArbitrationForm({ ...arbitrationForm, adminNotes: e.target.value })}
                    className="ra-textarea"
                    style={{ background: '#f4f4f5', borderRadius: '8px', padding: '10px 14px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDispute(null)}
                    className="ra-btn ra-btn-secondary"
                    disabled={arbitrationForm.submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      arbitrationForm.submitting ||
                      Math.round(Number(arbitrationForm.refundToCustomerAmount || 0) + Number(arbitrationForm.payoutToVendorAmount || 0)) !==
                        Math.round(Number(selectedDispute?.depositHeld || selectedDispute?.claimAmount || 0))
                    }
                    className="ra-btn ra-btn-primary"
                    style={{ fontWeight: 700, padding: '10px 22px' }}
                  >
                    {arbitrationForm.submitting ? 'Executing Escrow Settlement...' : '✓ Enforce Arbitration Ruling'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
