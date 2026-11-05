import React, { useState, useEffect } from 'react';
import { customerApi, paymentsApi } from '../../../../src/shared/api';

export default function CustomerRentalsPage({
  onBackToCatalog,
  onOpenSupport,
  user,
}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'RESERVED' | 'ACTIVE' | 'RETURN_REQUESTED' | 'COMPLETED'

  // Monthly Payment Processing State
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [paySuccessMsg, setPaySuccessMsg] = useState(null);

  // Return Request Modal State
  const [returnModal, setReturnModal] = useState({
    isOpen: false,
    booking: null,
    reason: '',
    preferredDate: '',
    loading: false,
  });

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await customerApi.getMyBookings();
      if (res.isSuccess && Array.isArray(res.data)) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your rentals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Handle online monthly rent payment via Stripe
  const handlePayMonthlyRentOnline = async (booking) => {
    const nextMonth = (booking.monthsPaidCount || 1) + 1;
    if (!window.confirm(`Pay Month ${nextMonth} rent of ₹${booking.monthlyRent} online directly on app via Stripe?`)) {
      return;
    }

    setPayingBookingId(booking.id);
    setPaySuccessMsg(null);
    try {
      // 1. Create monthly rent intent
      const intentRes = await paymentsApi.createMonthlyRentIntent(booking.id);
      if (!intentRes.isSuccess || !intentRes.data?.paymentIntentId) {
        throw new Error(intentRes.message || 'Failed to generate payment intent.');
      }

      const intentId = intentRes.data.paymentIntentId;

      // 2. Test-confirm intent
      await paymentsApi.testConfirm(intentId);

      // 3. Confirm monthly rent payment on backend
      const confirmRes = await paymentsApi.confirmMonthlyRent(booking.id, intentId);
      if (confirmRes.isSuccess) {
        setPaySuccessMsg(`Month ${nextMonth} rent paid successfully via Stripe!`);
        setTimeout(() => setPaySuccessMsg(null), 6000);
        await fetchBookings();
      } else {
        throw new Error(confirmRes.message || 'Payment confirmation failed.');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error processing monthly rent payment.');
    } finally {
      setPayingBookingId(null);
    }
  };

  // Submit Return Request
  const handleSubmitReturnRequest = async (e) => {
    e.preventDefault();
    if (!returnModal.booking) return;

    setReturnModal((prev) => ({ ...prev, loading: true }));
    try {
      const res = await customerApi.requestReturn(returnModal.booking.id, {
        reason: returnModal.reason.trim() || 'Rental tenure complete / Return requested by customer',
        preferredPickupDate: returnModal.preferredDate ? new Date(returnModal.preferredDate).toISOString() : new Date().toISOString(),
      });

      if (res.isSuccess) {
        setReturnModal({ isOpen: false, booking: null, reason: '', preferredDate: '', loading: false });
        await fetchBookings();
      } else {
        alert(res.message || 'Failed to schedule return.');
        setReturnModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting return request.');
      setReturnModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    if (filter === 'RESERVED') return b.status === 'Reserved' || !b.isDeliveryVerified;
    if (filter === 'ACTIVE') return b.status === 'Active' && b.isDeliveryVerified;
    if (filter === 'RETURN_REQUESTED') return b.status === 'ReturnRequested';
    if (filter === 'COMPLETED') return b.status === 'Completed' || b.status === 'PickedUp';
    return true;
  });

  const totalHeldDeposit = bookings
    .filter((b) => b.depositStatus === 'Held')
    .reduce((sum, b) => sum + (Number(b.securityDeposit) || 0), 0);

  const activeRentalsCount = bookings.filter((b) => b.status === 'Active' || b.status === 'Reserved').length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* ─── Breadcrumb & Header ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={onBackToCatalog}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--primary)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>←</span> Back to Marketplace
        </button>
        <span>/</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>My Rentals</span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            My Rentals & Active Leases
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            Manage delivery verification OTPs, monthly rental cycles, and physical return inspections.
          </p>
        </div>

        <button
          onClick={onBackToCatalog}
          className="ra-btn ra-btn-secondary"
          style={{ fontSize: '13px', fontWeight: 600 }}
        >
          + Rent Another Item
        </button>
      </div>

      {paySuccessMsg && (
        <div
          style={{
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span>
          <span>{paySuccessMsg}</span>
        </div>
      )}

      {/* ─── Metrics Bar ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Active Leases</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            {activeRentalsCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Ongoing or awaiting delivery
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Held Escrow Deposits</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
            ₹{totalHeldDeposit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Refunded via Stripe upon return
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Total Rental Orders</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            {bookings.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Lifetime orders with RentAssure
          </div>
        </div>
      </div>

      {/* ─── Filter Tabs ─── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '12px',
          marginBottom: '24px',
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'ALL', label: 'All Rentals' },
          { key: 'RESERVED', label: 'Awaiting Delivery (OTP)' },
          { key: 'ACTIVE', label: 'Active Leases' },
          { key: 'RETURN_REQUESTED', label: 'Return Scheduled' },
          { key: 'COMPLETED', label: 'Completed & Refunded' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: filter === t.key ? '1px solid var(--primary)' : '1px solid var(--border-light)',
              background: filter === t.key ? 'var(--primary-light)' : '#ffffff',
              color: filter === t.key ? 'var(--primary)' : 'var(--text-body)',
              fontSize: '13px',
              fontWeight: filter === t.key ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Rentals Cards List ─── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading your rentals...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
            No rentals found in this view
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px 0', maxWidth: '420px', margin: '0 auto 20px' }}>
            Browse certified furniture and home appliances from local stores and enjoy flexible monthly subscriptions.
          </p>
          <button onClick={onBackToCatalog} className="ra-btn ra-btn-primary">
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredBookings.map((b) => {
            const isReserved = b.status === 'Reserved' || !b.isDeliveryVerified;
            const isActive = b.status === 'Active' && b.isDeliveryVerified;
            const isReturnRequested = b.status === 'ReturnRequested';
            const isCompleted = b.status === 'Completed' || b.status === 'PickedUp';

            const monthsPaid = b.monthsPaidCount || 1;
            const totalMonths = b.rentalDurationMonths || 3;
            const hasRemainingMonths = monthsPaid < totalMonths;

            return (
              <div
                key={b.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-light)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Header row: Item Title, Store, Ref & Status */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img
                      src={b.itemImageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=140&q=80'}
                      alt=""
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: 'var(--radius-md)',
                        objectFit: 'cover',
                        border: '1px solid var(--border-light)',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginBottom: '2px' }}>
                        {b.vendorStoreName || 'Merchant Store'} • 📍 {b.deliveryCity || 'Ahmedabad'}
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                        {b.itemTitle}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Ref: <strong style={{ color: 'var(--text-body)' }}>{b.bookingReference}</strong>
                        <span style={{ margin: '0 8px' }}>•</span>
                        Ordered on: {new Date(b.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isReserved && (
                      <span
                        style={{
                          background: '#fffbeb',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        ⏳ Awaiting Doorstep Delivery
                      </span>
                    )}

                    {isActive && (
                      <span
                        style={{
                          background: '#f0fdf4',
                          color: '#166534',
                          border: '1px solid #bbf7d0',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        ● Active Rental
                      </span>
                    )}

                    {isReturnRequested && (
                      <span
                        style={{
                          background: '#eff6ff',
                          color: '#1e40af',
                          border: '1px solid #bfdbfe',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        🚚 Return Requested
                      </span>
                    )}

                    {isCompleted && (
                      <span
                        style={{
                          background: '#f8fafc',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Completed & Deposit Refunded
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content based on state */}

                {/* ─── 1. RESERVED STATE: PROMINENT DELIVERY OTP ─── */}
                {isReserved && (
                  <div
                    style={{
                      marginTop: '20px',
                      background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
                      border: '1px solid #fde68a',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400e', marginBottom: '4px' }}>
                        🔑 Doorstep Delivery Verification OTP
                      </div>
                      <p style={{ fontSize: '13px', color: '#78350f', margin: 0, maxWidth: '520px', lineHeight: 1.5 }}>
                        Provide this 6-digit OTP to the delivery agent when they bring the item. <strong>Your rental start date officially begins from the day of delivery!</strong>
                      </p>
                    </div>

                    <div
                      style={{
                        background: '#ffffff',
                        border: '2px dashed #d97706',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 24px',
                        fontSize: '28px',
                        fontWeight: 900,
                        letterSpacing: '6px',
                        color: '#b45309',
                        fontFamily: 'monospace',
                      }}
                    >
                      {b.deliveryOtp || '482910'}
                    </div>
                  </div>
                )}

                {/* ─── 2. ACTIVE STATE: LEASE SCHEDULE & RECURRING MONTHLY PAYMENTS ─── */}
                {isActive && (
                  <div style={{ marginTop: '20px' }}>
                    {/* Schedule Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        background: '#f8fafc',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        padding: '16px',
                        marginBottom: '16px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Verified Delivery</span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                          {b.deliveredAt ? new Date(b.deliveredAt).toLocaleDateString() : 'Active'}
                        </strong>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Tenure Schedule</span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                          {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                        </strong>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Payment Progress</span>
                        <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>
                          {monthsPaid} of {totalMonths} Months Paid
                        </strong>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Next Payment Due</span>
                        <strong style={{ fontSize: '14px', color: hasRemainingMonths ? '#b45309' : '#166534' }}>
                          {hasRemainingMonths
                            ? (b.nextPaymentDueDate ? new Date(b.nextPaymentDueDate).toLocaleDateString() : 'In 1 Month')
                            : 'All Months Settled'}
                        </strong>
                      </div>
                    </div>

                    {/* Recurring Monthly Payment Box */}
                    {hasRemainingMonths && (
                      <div
                        style={{
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '16px',
                          marginBottom: '16px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0369a1' }}>
                            💳 Month {monthsPaid + 1} Rent: ₹{Number(b.monthlyRent).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '12px', color: '#0c4a6e', marginTop: '2px' }}>
                            Pay directly on app via Stripe (instant vendor payout) or pay cash/offline to the vendor.
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <button
                            type="button"
                            disabled={payingBookingId === b.id}
                            onClick={() => handlePayMonthlyRentOnline(b)}
                            className="ra-btn ra-btn-primary ra-btn-sm"
                            style={{ fontWeight: 700 }}
                          >
                            {payingBookingId === b.id
                              ? 'Processing...'
                              : `Pay Month ${monthsPaid + 1} Online (Stripe)`}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Return Action Row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setReturnModal({
                            isOpen: true,
                            booking: b,
                            reason: '',
                            preferredDate: '',
                            loading: false,
                          })
                        }
                        className="ra-btn ra-btn-secondary ra-btn-sm"
                        style={{ fontWeight: 600, color: 'var(--text-body)' }}
                      >
                        Request Return & Inspection →
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── 3. RETURN REQUESTED STATE ─── */}
                {isReturnRequested && (
                  <div
                    style={{
                      marginTop: '20px',
                      background: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      padding: '16px 20px',
                      fontSize: '13px',
                      color: 'var(--text-body)',
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>🚚 Return Scheduled:</strong> The merchant will physically inspect the item at pickup. Once verified, your refundable security deposit of <strong>₹{Number(b.securityDeposit).toLocaleString('en-IN')}</strong> will be released back to your card via Stripe.
                  </div>
                )}

                {/* ─── 4. COMPLETED STATE ─── */}
                {isCompleted && (
                  <div
                    style={{
                      marginTop: '20px',
                      background: '#f0fdf4',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #bbf7d0',
                      padding: '16px 20px',
                      fontSize: '13px',
                      color: '#166534',
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>✓ Physical Inspection Verified:</strong> Item successfully returned in good condition. Your held security deposit of <strong>₹{Number(b.securityDeposit).toLocaleString('en-IN')}</strong> has been released back to your card via Stripe. {b.stripeRefundId && `(Stripe Refund ID: ${b.stripeRefundId})`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── RETURN REQUEST MODAL ─── */}
      {returnModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px',
          }}
          onClick={() => setReturnModal({ isOpen: false, booking: null, reason: '', preferredDate: '', loading: false })}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: 'var(--shadow-modal)',
              border: '1px solid var(--border-light)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
              Schedule Item Return & Deposit Release
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              The merchant will arrange physical pickup inspection. Once inspected, your <strong>₹{Number(returnModal.booking?.securityDeposit).toLocaleString('en-IN')}</strong> security deposit is automatically released to your card via Stripe.
            </p>

            <form onSubmit={handleSubmitReturnRequest}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Preferred Pickup Date
                </label>
                <input
                  type="date"
                  required
                  value={returnModal.preferredDate}
                  onChange={(e) => setReturnModal({ ...returnModal, preferredDate: e.target.value })}
                  className="ra-input"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Reason for Return / Item Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Tenure completed, moving city, or no longer needed"
                  value={returnModal.reason}
                  onChange={(e) => setReturnModal({ ...returnModal, reason: e.target.value })}
                  className="ra-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReturnModal({ isOpen: false, booking: null, reason: '', preferredDate: '', loading: false })}
                  className="ra-btn ra-btn-secondary"
                  disabled={returnModal.loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnModal.loading}
                  className="ra-btn ra-btn-primary"
                >
                  {returnModal.loading ? 'Submitting...' : 'Confirm Return Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
