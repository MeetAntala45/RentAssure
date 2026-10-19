import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { useAdminToast } from '../context/AdminToastContext';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Resolution Modal states
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Adjudication form state
  const [decision, setDecision] = useState('4'); // 4 = ResolvedVendorFavored, 3 = ResolvedCustomerFavored, 5 = SplitResolution
  const [refundToCustomer, setRefundToCustomer] = useState(0);
  const [payoutToVendor, setPayoutToVendor] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');

  const { showToast } = useAdminToast();

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getDisputes({
        status: statusFilter ? Number(statusFilter) : undefined,
        search: searchTerm,
        page: 1,
        pageSize: 50,
      });

      if (res.isSuccess && res.data) {
        setDisputes(res.data.items || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'Failed to fetch dispute cases.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const handleOpenAdjudicator = async (id) => {
    setIsSubmitting(true);
    try {
      const res = await adminService.getDisputeById(id);
      if (res.isSuccess && res.data) {
        const d = res.data;
        setSelectedDispute(d);

        // Pre-fill smart defaults based on claim amount and deposit held
        const deposit = d.DepositHeld || 0;
        const claim = d.ClaimAmount || 0;

        // Default to vendor favored deduction of claim amount
        setDecision('4');
        setPayoutToVendor(Math.min(claim, deposit));
        setRefundToCustomer(Math.max(0, deposit - claim));
        setAdminNotes(d.AdminDecisionNotes || '');
        setIsModalOpen(true);
      } else {
        showToast('error', 'Error', res.message || 'Failed to open dispute details.');
      }
    } catch {
      showToast('error', 'Error', 'Failed to retrieve dispute details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecisionPresetChange = (newDecision) => {
    setDecision(newDecision);
    if (!selectedDispute) return;

    const deposit = selectedDispute.DepositHeld || 0;
    const claim = selectedDispute.ClaimAmount || 0;

    if (newDecision === '3') {
      // Customer Favored: Full deposit returned to customer, zero damage deduction
      setRefundToCustomer(deposit);
      setPayoutToVendor(0);
    } else if (newDecision === '4') {
      // Vendor Favored: Claim deducted from deposit and paid to vendor, remainder refunded to customer
      const vendorCut = Math.min(claim, deposit);
      setPayoutToVendor(vendorCut);
      setRefundToCustomer(Math.max(0, deposit - vendorCut));
    } else if (newDecision === '5') {
      // Split 50/50 of claim
      const halfClaim = Math.round(claim / 2);
      setPayoutToVendor(halfClaim);
      setRefundToCustomer(Math.max(0, deposit - halfClaim));
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    if (!adminNotes.trim()) {
      showToast('error', 'Missing Rationale', 'An administrative explanation must be recorded for audit purposes.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminService.resolveDispute(selectedDispute.id, {
        decision: Number(decision),
        refundToCustomerAmount: Number(refundToCustomer),
        payoutToVendorAmount: Number(payoutToVendor),
        adminNotes: adminNotes.trim(),
      });

      if (res.isSuccess) {
        showToast('success', 'Dispute Settled', `Case ${selectedDispute.DisputeTicketNumber} resolved and escrow disbursed.`);
        setIsModalOpen(false);
        fetchDisputes();
      } else {
        showToast('error', 'Error', res.message);
      }
    } catch {
      showToast('error', 'Error', 'Failed to execute dispute resolution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReasonLabel = (reason) => {
    switch (reason) {
      case 1: return 'Damage Assessment';
      case 2: return 'Deposit Deduction';
      case 3: return 'Delivery Failure';
      case 4: return 'Late Return';
      case 5: return 'Condition Mismatch';
      default: return 'General Claim';
    }
  };

  const getStatusBadge = (status) => {
    // 1: Open, 2: UnderReview, 3: ResolvedCustomerFavored, 4: ResolvedVendorFavored, 5: SplitResolution, 6: Closed
    switch (status) {
      case 1:
        return <span className="badge-status badge-status--pending"><span className="badge-status__dot" />Open Claim</span>;
      case 2:
        return <span className="badge-status badge-status--under-review"><span className="badge-status__dot" />Under Review</span>;
      case 3:
        return <span className="badge-status badge-status--approved"><span className="badge-status__dot" />Customer Favored</span>;
      case 4:
        return <span className="badge-status badge-status--resolved"><span className="badge-status__dot" />Vendor Favored</span>;
      case 5:
        return <span className="badge-status badge-status--resolved"><span className="badge-status__dot" />Split Settlement</span>;
      case 6:
        return <span className="badge-status badge-status--completed"><span className="badge-status__dot" />Closed</span>;
      default:
        return <span>N/A</span>;
    }
  };

  return (
    <div>
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1>Dispute Adjudication & Escrow Custody</h1>
          <p>
            Arbitrate damage assessments, uninspected returns, and deposit deduction claims with transparent split execution.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button onClick={fetchDisputes} className="btn-admin btn-admin--secondary btn-admin--sm">
            Refresh Cases
          </button>
        </div>
      </div>

      {/* ─── Filters & Search ────────────────────────────────────────── */}
      <div className="admin-filter-bar">
        <div className="admin-tabs">
          <button
            onClick={() => setStatusFilter('')}
            className={`admin-tab ${statusFilter === '' ? 'active' : ''}`}
          >
            <span>All Disputes</span>
            <span className="admin-tab-count">{totalCount}</span>
          </button>
          <button
            onClick={() => setStatusFilter('1')}
            className={`admin-tab ${statusFilter === '1' ? 'active' : ''}`}
          >
            <span>Open Claims</span>
          </button>
          <button
            onClick={() => setStatusFilter('2')}
            className={`admin-tab ${statusFilter === '2' ? 'active' : ''}`}
          >
            <span>Under Review</span>
          </button>
          <button
            onClick={() => setStatusFilter('3')}
            className={`admin-tab ${statusFilter === '3' ? 'active' : ''}`}
          >
            <span>Settled / Closed</span>
          </button>
        </div>

        <div className="admin-input-group">
          <div className="admin-search-box">
            <svg className="admin-search-box__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="admin-search-box__input"
              placeholder="Search ticket, booking, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDisputes()}
            />
          </div>
          <button onClick={fetchDisputes} className="btn-admin btn-admin--secondary btn-admin--sm">
            Filter
          </button>
        </div>
      </div>

      {/* ─── Dispute Cases Table ─────────────────────────────────────── */}
      <div className="admin-card">
        <div className="admin-card__body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
              Loading arbitration docket...
            </div>
          ) : disputes.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
              No disputes matching current filter criteria.
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket / Reason</th>
                    <th>Booking / Item</th>
                    <th>Customer vs Vendor</th>
                    <th>Claim vs Escrow Held</th>
                    <th>Filed Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Adjudication</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: '#ffffff', fontSize: '0.88rem' }}>
                            {d.DisputeTicketNumber}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                            {getReasonLabel(d.Reason)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>
                            {d.ItemTitle}
                          </strong>
                          <code style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            Ref: {d.BookingReference}
                          </code>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                          <div><span style={{ color: '#94a3b8' }}>Renter:</span> {d.CustomerName}</div>
                          <div><span style={{ color: '#94a3b8' }}>Shop:</span> {d.VendorStoreName}</div>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <strong style={{ color: '#fbbf24' }}>${d.ClaimAmount.toFixed(2)}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Escrow: ${d.DepositHeld.toFixed(2)}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {new Date(d.CreatedAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td>{getStatusBadge(d.Status)}</td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenAdjudicator(d.id)}
                          className={`btn-admin btn-admin--sm ${
                            d.Status === 1 || d.Status === 2 ? 'btn-admin--primary' : 'btn-admin--secondary'
                          }`}
                        >
                          {d.Status === 1 || d.Status === 2 ? 'Arbitrate Case' : 'View Decision'}
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

      {/* ─── Interactive Adjudication Modal ─────────────────────────── */}
      {isModalOpen && selectedDispute && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <h3>Dispute Case #{selectedDispute.DisputeTicketNumber}</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {getReasonLabel(selectedDispute.Reason)} • Booking Ref: {selectedDispute.BookingReference}
                </span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="admin-modal__close">✕</button>
            </div>

            <div className="admin-modal__body">
              {/* Top Claim & Escrow Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: 10,
                  border: '1px solid var(--admin-border)',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Security Deposit Held</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24' }}>
                    ${selectedDispute.DepositHeld?.toFixed(2)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Amount in Dispute</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f87171' }}>
                    ${selectedDispute.ClaimAmount?.toFixed(2)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Rental Item Subject</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedDispute.ItemTitle}
                  </div>
                </div>
              </div>

              {/* Side-by-side Evidence & Statements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {/* Customer Position */}
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', padding: '1rem', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#60a5fa' }}>Customer / Renter Statement</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{selectedDispute.CustomerName}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.5', fontStyle: 'italic' }}>
                    "{selectedDispute.CustomerStatement || 'No written testimony filed.'}"
                  </p>
                </div>

                {/* Vendor Position */}
                <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', padding: '1rem', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#fbbf24' }}>Vendor / Shop Statement</strong>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{selectedDispute.VendorStoreName}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.5', fontStyle: 'italic' }}>
                    "{selectedDispute.VendorStatement || 'No written testimony filed.'}"
                  </p>
                </div>
              </div>

              {/* Dispute Description & Proof */}
              <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 8, border: '1px solid var(--admin-border)' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  Factual Claim & Evidence Summary
                </span>
                <p style={{ fontSize: '0.85rem', color: '#f8fafc', lineHeight: '1.6' }}>
                  {selectedDispute.Description}
                </p>
              </div>

              {/* Already resolved notification if applicable */}
              {(selectedDispute.Status === 3 || selectedDispute.Status === 4 || selectedDispute.Status === 5 || selectedDispute.Status === 6) ? (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '1.25rem', borderRadius: 8 }}>
                  <strong style={{ color: '#34d399', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                    ✓ Case Adjudicated on {new Date(selectedDispute.ResolvedAt).toLocaleDateString()}
                  </strong>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
                    <div>Refund to Customer: <strong>${selectedDispute.RefundToCustomerAmount.toFixed(2)}</strong></div>
                    <div>Payout to Vendor: <strong>${selectedDispute.PayoutToVendorAmount.toFixed(2)}</strong></div>
                    <div style={{ marginTop: '0.5rem', color: '#94a3b8' }}>
                      <em>Notes: {selectedDispute.AdminDecisionNotes}</em>
                    </div>
                  </div>
                </div>
              ) : (
                /* Interactive Settlement Form */
                <form onSubmit={handleResolveSubmit}>
                  <h4 style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Adjudication Settlement Calculator
                  </h4>

                  <div className="admin-form-group">
                    <label>Ruling Direction Preset</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => handleDecisionPresetChange('3')}
                        className={`btn-admin btn-admin--sm ${decision === '3' ? 'btn-admin--success' : 'btn-admin--secondary'}`}
                      >
                        Customer Favored (Full Deposit Refund)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecisionPresetChange('4')}
                        className={`btn-admin btn-admin--sm ${decision === '4' ? 'btn-admin--danger' : 'btn-admin--secondary'}`}
                      >
                        Vendor Favored (Deduct Claim from Deposit)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecisionPresetChange('5')}
                        className={`btn-admin btn-admin--sm ${decision === '5' ? 'btn-admin--primary' : 'btn-admin--secondary'}`}
                      >
                        Split Settlement (Custom 50/50)
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="admin-form-group">
                      <label>Refund to Customer ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={selectedDispute.DepositHeld}
                        className="admin-form-input"
                        value={refundToCustomer}
                        onChange={(e) => setRefundToCustomer(e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Returned immediately to customer's source card
                      </span>
                    </div>

                    <div className="admin-form-group">
                      <label>Payout to Vendor for Damage / Delay ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={selectedDispute.DepositHeld}
                        className="admin-form-input"
                        value={payoutToVendor}
                        onChange={(e) => setPayoutToVendor(e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Deducted from deposit and disbursed to shop Stripe account
                      </span>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Adjudication Finding & Official Notes (Required)</label>
                    <textarea
                      rows="3"
                      required
                      className="admin-form-textarea"
                      placeholder="Detail inspection photos examined, rental terms invoked, and basis for split decision..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="btn-admin btn-admin--secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-admin btn-admin--primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Executing Settlement...' : 'Finalize & Disburse Escrow'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
