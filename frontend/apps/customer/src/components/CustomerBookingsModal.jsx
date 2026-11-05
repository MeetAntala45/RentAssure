import React, { useState, useEffect } from 'react';
import { customerApi } from '../../../../src/shared/api';

const DISPUTE_REASONS = [
  { value: 5, label: 'Item Condition Mismatch / Defect on Delivery' },
  { value: 3, label: 'Delivery Delay / Non-Delivery by Merchant' },
  { value: 1, label: 'Dispute Over Damage Assessment' },
  { value: 2, label: 'Unfair Deposit Deduction Claim' },
  { value: 4, label: 'Pickup / Return Logistics Delay' },
];

const RETURN_REASONS = [
  'Rental Tenure Completed',
  'Relocating to New Home / City',
  'No Longer Needed',
  'Upgrading to Another Model / Appliance',
  'Temporary Rental Ended',
  'Other Reason',
];

export default function CustomerBookingsModal({ onClose, onOpenSupport = () => {} }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Active inline action panels: { [bookingId]: 'return' | 'dispute' | null }
  const [actionTab, setActionTab] = useState({});

  // Return Form State per booking
  const [returnFormData, setReturnFormData] = useState({});
  const [submittingReturnId, setSubmittingReturnId] = useState(null);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState({});
  const [returnErrorMsg, setReturnErrorMsg] = useState({});

  // Dispute Form State per booking
  const [disputeFormData, setDisputeFormData] = useState({});
  const [submittingDisputeId, setSubmittingDisputeId] = useState(null);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState({});
  const [disputeErrorMsg, setDisputeErrorMsg] = useState({});

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await customerApi.getMyBookings();
      if (res.data) {
        setBookings(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const totalHeldDeposit = bookings.reduce((sum, b) => {
    const isCompleted = b.status === 'Completed' || b.status === 6;
    const isCancelled = b.status === 'Cancelled' || b.status === 7;
    return isCompleted || isCancelled ? sum : sum + (Number(b.securityDeposit) || 0);
  }, 0);

  const activeCount = bookings.filter((b) => {
    return b.status === 'Active' || b.status === 3 || b.status === 'Delivered' || b.status === 2 || b.status === 'Reserved' || b.status === 1;
  }).length;

  const handleCopy = (ref, id) => {
    navigator.clipboard?.writeText(ref);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleAction = (bookingId, type) => {
    setActionTab((prev) => ({
      ...prev,
      [bookingId]: prev[bookingId] === type ? null : type,
    }));

    if (type === 'return' && !returnFormData[bookingId]) {
      const defaultDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
      setReturnFormData((prev) => ({
        ...prev,
        [bookingId]: {
          reason: RETURN_REASONS[0],
          pickupDate: defaultDate,
          notes: '',
        },
      }));
    }

    if (type === 'dispute' && !disputeFormData[bookingId]) {
      const booking = bookings.find((b) => b.id === bookingId);
      setDisputeFormData((prev) => ({
        ...prev,
        [bookingId]: {
          reason: 5,
          claimedAmount: booking ? Number(booking.securityDeposit) || 0 : 0,
          description: '',
        },
      }));
    }
  };

  const handleReturnSubmit = async (booking) => {
    const data = returnFormData[booking.id] || {};
    const reasonText = data.reason || RETURN_REASONS[0];
    const notesText = data.notes?.trim() || '';
    const fullReason = notesText ? `${reasonText} (${notesText})` : reasonText;
    const pickupDateIso = data.pickupDate ? new Date(data.pickupDate).toISOString() : new Date().toISOString();

    setSubmittingReturnId(booking.id);
    setReturnErrorMsg((prev) => ({ ...prev, [booking.id]: '' }));

    try {
      const res = await customerApi.requestReturn(booking.id, {
        reason: fullReason,
        preferredPickupDate: pickupDateIso,
      });

      if (res.isSuccess || res.IsSuccess) {
        setReturnSuccessMsg((prev) => ({
          ...prev,
          [booking.id]: 'Return pickup scheduled! The merchant will contact you for doorstep pickup and deposit release.',
        }));
        // Update local booking status
        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, status: 'ReturnRequested' } : b))
        );
        setTimeout(() => {
          setActionTab((prev) => ({ ...prev, [booking.id]: null }));
        }, 3000);
      } else {
        setReturnErrorMsg((prev) => ({
          ...prev,
          [booking.id]: res.message || res.Message || 'Failed to submit return request.',
        }));
      }
    } catch (err) {
      setReturnErrorMsg((prev) => ({
        ...prev,
        [booking.id]: err.response?.data?.message || 'Failed to submit return request. Please try again.',
      }));
    } finally {
      setSubmittingReturnId(null);
    }
  };

  const handleDisputeSubmit = async (booking) => {
    const data = disputeFormData[booking.id] || {};
    if (!data.description || !data.description.trim()) {
      setDisputeErrorMsg((prev) => ({ ...prev, [booking.id]: 'Please provide details explaining the issue.' }));
      return;
    }

    setSubmittingDisputeId(booking.id);
    setDisputeErrorMsg((prev) => ({ ...prev, [booking.id]: '' }));

    try {
      const res = await customerApi.raiseDispute(booking.id, {
        reason: Number(data.reason) || 5,
        claimedAmount: Number(data.claimedAmount) || Number(booking.securityDeposit) || 0,
        description: data.description.trim(),
      });

      if (res.isSuccess || res.IsSuccess) {
        setDisputeSuccessMsg((prev) => ({
          ...prev,
          [booking.id]: 'Dispute submitted. RentAssure trust & safety arbitration will review this within 24 hours.',
        }));
        setTimeout(() => {
          setActionTab((prev) => ({ ...prev, [booking.id]: null }));
        }, 3500);
      } else {
        setDisputeErrorMsg((prev) => ({
          ...prev,
          [booking.id]: res.message || res.Message || 'Failed to file dispute ticket.',
        }));
      }
    } catch (err) {
      setDisputeErrorMsg((prev) => ({
        ...prev,
        [booking.id]: err.response?.data?.message || 'Failed to file dispute. Please try again.',
      }));
    } finally {
      setSubmittingDisputeId(null);
    }
  };

  const renderStatusBadge = (status) => {
    const s = String(status);
    if (s === 'Active' || s === '3') {
      return (
        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
          ● Active Rental
        </span>
      );
    }
    if (s === 'Delivered' || s === '2') {
      return (
        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7' }}>
          ● Delivered & In Use
        </span>
      );
    }
    if (s === 'Reserved' || s === '1') {
      return (
        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
          ● Reserved / Dispatching
        </span>
      );
    }
    if (s === 'ReturnRequested' || s === '4') {
      return (
        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
          ● Return & Inspection Scheduled
        </span>
      );
    }
    if (s === 'PickedUp' || s === '5') {
      return (
        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4' }}>
          ● Picked Up / Inspecting Deposit
        </span>
      );
    }
    if (s === 'Completed' || s === '6') {
      return (
        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
          ● Completed & Deposit Released
        </span>
      );
    }
    if (s === 'Cancelled' || s === '7') {
      return (
        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          ● Cancelled
        </span>
      );
    }
    return (
      <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
        {status}
      </span>
    );
  };

  return (
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
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(3, 48, 71, 0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #ffffff 0%, var(--primary-subtle) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #033047 0%, #304C62 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '20px',
              }}
            >
              📦
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                My Rental Subscriptions & Escrow
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Manage ongoing subscriptions, schedule return pickup, and track held escrow security deposits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              lineHeight: 1,
              padding: '6px',
            }}
            title="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Top KPI Metrics Row */}
        {!loading && bookings.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              padding: '14px 28px',
              background: '#f8fafc',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Active Subscriptions
              </span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                {activeCount} Items
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Held in Escrow
              </span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                ₹{totalHeldDeposit.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Deposit Protection
              </span>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#065f46', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🛡️</span> 100% Escrow Guaranteed
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
              <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>Loading Subscriptions...</strong>
              <span style={{ fontSize: '13px' }}>Fetching your live orders and held escrow data</span>
            </div>
          ) : error ? (
            <div
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger-text)',
                border: '1px solid var(--danger-border)',
                padding: '14px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📦</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                No Active Subscriptions Yet
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                Browse our verified merchant catalog, select your duration, and reserve items with complete escrow protection.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="ra-btn ra-btn-primary ra-btn-sm"
                style={{ borderRadius: 'var(--radius-full)', padding: '10px 22px' }}
              >
                Browse Marketplace Catalog
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {bookings.map((b) => {
                const canReturn = b.status === 'Active' || b.status === 3 || b.status === 'Delivered' || b.status === 2;
                const isReturnScheduled = b.status === 'ReturnRequested' || b.status === 4;
                const isCompleted = b.status === 'Completed' || b.status === 6;
                const currentAction = actionTab[b.id];
                const monthlyNum = Number(b.monthlyRent) || 0;
                const depositNum = Number(b.securityDeposit) || 0;
                const startDateStr = b.startDate ? new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                const endDateStr = b.endDate ? new Date(b.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

                return (
                  <div
                    key={b.id}
                    style={{
                      border: '1px solid var(--border-light)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      background: '#ffffff',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(3, 48, 71, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Top Reference & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--primary)' }}>
                          {b.bookingReference || `#BK-${b.id}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(b.bookingReference || `#BK-${b.id}`, b.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: copiedId === b.id ? '#065f46' : 'var(--text-muted)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                          title="Copy booking reference"
                        >
                          {copiedId === b.id ? '✓ Copied' : '📋'}
                        </button>
                        <span style={{ color: 'var(--border-light)' }}>|</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Ordered: {new Date(b.createdAt || b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div>{renderStatusBadge(b.status)}</div>
                    </div>

                    {/* Item & Financials Row */}
                    <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {b.itemImageUrl ? (
                        <img
                          src={b.itemImageUrl}
                          alt={b.itemTitle}
                          style={{
                            width: '82px',
                            height: '82px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            border: '1px solid var(--border-light)',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '82px',
                            height: '82px',
                            borderRadius: '12px',
                            background: 'var(--primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '28px',
                            flexShrink: 0,
                          }}
                        >
                          📦
                        </div>
                      )}

                      <div style={{ flex: '1 1 240px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                          {b.itemTitle}
                        </h4>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          Merchant: <strong>{b.vendorStoreName || 'Authorized Merchant'}</strong> ({b.vendorCity})
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          📍 Delivery Address: <strong>{b.deliveryAddress}</strong> ({b.deliveryCity})
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          📅 Tenure: <strong>{startDateStr}</strong> to <strong>{endDateStr}</strong> ({b.rentalDurationMonths} Months)
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '160px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                          ₹{monthlyNum.toLocaleString('en-IN')}{' '}
                          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>
                            / mo
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-body)', marginTop: '4px' }}>
                          Deposit: <strong>₹{depositNum.toLocaleString('en-IN')}</strong>
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          {b.stripeRefundId ? (
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#065f46', background: '#ecfdf5', padding: '3px 8px', borderRadius: '9999px', display: 'inline-block', border: '1px solid #a7f3d0' }}>
                                ✓ Refunded to Card via Stripe
                              </span>
                              <div style={{ fontSize: '10px', color: '#047857', fontFamily: 'monospace', marginTop: '2px' }}>
                                Ref: {b.stripeRefundId}
                              </div>
                            </div>
                          ) : isCompleted ? (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', background: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', display: 'inline-block' }}>
                              ✓ Deposit Released
                            </span>
                          ) : (
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: b.isPaidOnline ? '#0369a1' : '#047857', background: b.isPaidOnline ? '#f0f9ff' : '#f0fdf4', padding: '2px 8px', borderRadius: '9999px', display: 'inline-block', border: `1px solid ${b.isPaidOnline ? '#bae6fd' : '#bbf7d0'}` }}>
                                🛡️ {b.isPaidOnline ? 'Card Deposit in Escrow' : 'Held in Escrow'}
                              </span>
                              {b.isPaidOnline && (
                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                  💳 Paid via Stripe
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Return Requested Notification Banner */}
                    {isReturnScheduled && (
                      <div
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          color: '#92400e',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>🔄</span>
                        <span>
                          <strong>Return In Progress:</strong> The merchant will contact you to coordinate technician pickup and disassembly. Once verified, your deposit of ₹{depositNum.toLocaleString('en-IN')} will be unlocked and returned.
                        </span>
                      </div>
                    )}

                    {/* Inline Form: Request Return */}
                    {currentAction === 'return' && canReturn && (
                      <div
                        style={{
                          background: 'var(--primary-subtle)',
                          border: '1px solid var(--color-light-blue-border)',
                          borderRadius: '12px',
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🔄</span> Schedule Doorstep Return Pickup & Escrow Refund
                          </strong>
                          <button
                            type="button"
                            onClick={() => toggleAction(b.id, 'return')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}
                          >
                            ✕
                          </button>
                        </div>

                        {returnSuccessMsg[b.id] && (
                          <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                            {returnSuccessMsg[b.id]}
                          </div>
                        )}

                        {returnErrorMsg[b.id] && (
                          <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                            {returnErrorMsg[b.id]}
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                              Reason for Return
                            </label>
                            <select
                              value={returnFormData[b.id]?.reason || RETURN_REASONS[0]}
                              onChange={(e) =>
                                setReturnFormData((prev) => ({
                                  ...prev,
                                  [b.id]: { ...(prev[b.id] || {}), reason: e.target.value },
                                }))
                              }
                              className="ra-input"
                              style={{ width: '100%', fontSize: '12px', padding: '8px 10px' }}
                            >
                              {RETURN_REASONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                              Preferred Pickup Date
                            </label>
                            <input
                              type="date"
                              value={returnFormData[b.id]?.pickupDate || ''}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) =>
                                setReturnFormData((prev) => ({
                                  ...prev,
                                  [b.id]: { ...(prev[b.id] || {}), pickupDate: e.target.value },
                                }))
                              }
                              className="ra-input"
                              style={{ width: '100%', fontSize: '12px', padding: '8px 10px' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                            Special Pickup Instructions / Access Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Lift is operational; please call 1 hour before pickup"
                            value={returnFormData[b.id]?.notes || ''}
                            onChange={(e) =>
                              setReturnFormData((prev) => ({
                                ...prev,
                                [b.id]: { ...(prev[b.id] || {}), notes: e.target.value },
                              }))
                            }
                            className="ra-input"
                            style={{ width: '100%', fontSize: '12px', padding: '8px 10px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => toggleAction(b.id, 'return')}
                            className="ra-btn ra-btn-secondary ra-btn-sm"
                            style={{ fontSize: '12px', padding: '6px 14px' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReturnSubmit(b)}
                            disabled={submittingReturnId === b.id}
                            className="ra-btn ra-btn-primary ra-btn-sm"
                            style={{ fontSize: '12px', padding: '6px 18px', fontWeight: 800 }}
                          >
                            {submittingReturnId === b.id ? 'Scheduling...' : 'Confirm Return Request'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Form: Dispute Filing */}
                    {currentAction === 'dispute' && (
                      <div
                        style={{
                          background: '#fff1f2',
                          border: '1px solid #fecdd3',
                          borderRadius: '12px',
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>⚠️</span> File Trust & Safety Dispute for {b.bookingReference}
                          </strong>
                          <button
                            type="button"
                            onClick={() => toggleAction(b.id, 'dispute')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#9f1239' }}
                          >
                            ✕
                          </button>
                        </div>

                        {disputeSuccessMsg[b.id] && (
                          <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                            {disputeSuccessMsg[b.id]}
                          </div>
                        )}

                        {disputeErrorMsg[b.id] && (
                          <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                            {disputeErrorMsg[b.id]}
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                              Dispute Category
                            </label>
                            <select
                              value={disputeFormData[b.id]?.reason || 5}
                              onChange={(e) =>
                                setDisputeFormData((prev) => ({
                                  ...prev,
                                  [b.id]: { ...(prev[b.id] || {}), reason: Number(e.target.value) },
                                }))
                              }
                              className="ra-input"
                              style={{ width: '100%', fontSize: '12px', padding: '8px 10px' }}
                            >
                              {DISPUTE_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                              Claimed Dispute Amount (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={disputeFormData[b.id]?.claimedAmount || ''}
                              onChange={(e) =>
                                setDisputeFormData((prev) => ({
                                  ...prev,
                                  [b.id]: { ...(prev[b.id] || {}), claimedAmount: e.target.value },
                                }))
                              }
                              className="ra-input"
                              style={{ width: '100%', fontSize: '12px', padding: '8px 10px' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                            Detailed Issue Explanation <span style={{ color: '#e11d48' }}>*</span>
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Describe clearly what occurred (e.g. merchant delayed delivery, item arrived defective, or deposit disputed)..."
                            value={disputeFormData[b.id]?.description || ''}
                            onChange={(e) =>
                              setDisputeFormData((prev) => ({
                                ...prev,
                                [b.id]: { ...(prev[b.id] || {}), description: e.target.value },
                              }))
                            }
                            className="ra-input"
                            style={{ width: '100%', fontSize: '12px', padding: '8px 10px', resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => toggleAction(b.id, 'dispute')}
                            className="ra-btn ra-btn-secondary ra-btn-sm"
                            style={{ fontSize: '12px', padding: '6px 14px' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDisputeSubmit(b)}
                            disabled={submittingDisputeId === b.id}
                            className="ra-btn ra-btn-danger ra-btn-sm"
                            style={{ fontSize: '12px', padding: '6px 18px', fontWeight: 800 }}
                          >
                            {submittingDisputeId === b.id ? 'Submitting...' : 'Submit Formal Dispute'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
                      {canReturn && (
                        <button
                          type="button"
                          onClick={() => toggleAction(b.id, 'return')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--primary)',
                            background: currentAction === 'return' ? 'var(--primary)' : 'var(--primary-light)',
                            color: currentAction === 'return' ? '#ffffff' : 'var(--primary)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          🔄 {currentAction === 'return' ? 'Close Return Form' : 'Request Return & Deposit Release'}
                        </button>
                      )}

                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => toggleAction(b.id, 'dispute')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #fecdd3',
                            background: currentAction === 'dispute' ? '#e11d48' : '#fff1f2',
                            color: currentAction === 'dispute' ? '#ffffff' : '#9f1239',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          ⚠️ {currentAction === 'dispute' ? 'Close Dispute' : 'File Dispute'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSupport();
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)',
                          background: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--text-body)',
                          cursor: 'pointer',
                        }}
                      >
                        💬 Need Support
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            All security deposits are held in regulated escrow until pickup inspection is completed.
          </div>
          <button onClick={onClose} className="ra-btn ra-btn-secondary ra-btn-sm" style={{ padding: '8px 20px', fontWeight: 700 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
