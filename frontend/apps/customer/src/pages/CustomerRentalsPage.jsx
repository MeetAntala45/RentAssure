import React, { useState, useEffect } from 'react';
import { customerApi, paymentsApi } from '../../../../src/shared/api';

const DISPUTE_REASON_NAMES = {
  1: 'DamageAssessment',
  2: 'DepositDeduction',
  3: 'DeliveryFailure',
  4: 'LateReturn',
  5: 'ItemConditionMismatch',
};

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

  // Dispute Request Modal State
  const [disputeModal, setDisputeModal] = useState({
    isOpen: false,
    booking: null,
    reason: 5,
    claimedAmount: '',
    description: '',
    loading: false,
    error: '',
  });

  // Rating Modal State
  const [ratingModal, setRatingModal] = useState({
    isOpen: false,
    booking: null,
    rating: 5,
    hoverRating: 0,
    comment: '',
    loading: false,
    error: '',
    success: '',
  });

  const openRatingModal = (booking) => {
    setRatingModal({
      isOpen: true,
      booking,
      rating: booking.customerRating || 5,
      hoverRating: 0,
      comment: booking.customerReviewComment || '',
      loading: false,
      error: '',
      success: '',
    });
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!ratingModal.booking) return;
    setRatingModal((prev) => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      const res = await customerApi.rateBooking(ratingModal.booking.id, {
        rating: ratingModal.rating,
        comment: ratingModal.comment,
      });

      if (res.isSuccess || res.IsSuccess) {
        setRatingModal((prev) => ({ ...prev, loading: false, success: 'Rating saved successfully!' }));
        setTimeout(() => {
          setRatingModal({
            isOpen: false,
            booking: null,
            rating: 5,
            hoverRating: 0,
            comment: '',
            loading: false,
            error: '',
            success: '',
          });
          fetchBookings();
        }, 1000);
      } else {
        setRatingModal((prev) => ({
          ...prev,
          loading: false,
          error: res.message || res.Message || 'Failed to submit rating.',
        }));
      }
    } catch (err) {
      setRatingModal((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Error saving review. Please try again.',
      }));
    }
  };

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

  // Submit Formal Escrow Dispute
  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!disputeModal.booking) return;

    if (!disputeModal.description || !disputeModal.description.trim()) {
      setDisputeModal((prev) => ({ ...prev, error: 'Please enter details explaining why you are disputing.' }));
      return;
    }

    setDisputeModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await customerApi.raiseDispute(disputeModal.booking.id, {
        reason: DISPUTE_REASON_NAMES[disputeModal.reason] || Number(disputeModal.reason),
        description: disputeModal.description.trim(),
        claimedAmount: Number(disputeModal.claimedAmount) || Number(disputeModal.booking.securityDeposit) || 0,
      });

      if (res.isSuccess) {
        alert('✓ Formal dispute filed successfully! RentAssure Trust & Safety team has been notified for objective arbitration.');
        setDisputeModal({
          isOpen: false,
          booking: null,
          reason: 5,
          claimedAmount: '',
          description: '',
          loading: false,
          error: '',
        });
        await fetchBookings();
      } else {
        setDisputeModal((prev) => ({ ...prev, error: res.message || 'Failed to submit dispute.' }));
      }
    } catch (err) {
      setDisputeModal((prev) => ({
        ...prev,
        error: err.response?.data?.message || err.message || 'Error submitting dispute.',
      }));
    } finally {
      setDisputeModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const isBookingCompleted = (b) => {
    const isDisputeResolved =
      b.disputeStatus === 'ResolvedCustomerFavored' ||
      b.disputeStatus === 'ResolvedVendorFavored' ||
      b.disputeStatus === 'SplitResolution' ||
      b.disputeStatus === 'Closed' ||
      b.disputeStatus === 3 ||
      b.disputeStatus === 4 ||
      b.disputeStatus === 5 ||
      b.disputeStatus === 6;

    const isDepositSettled =
      b.depositStatus === 'Refunded' ||
      b.depositStatus === 'PartiallyRefunded' ||
      b.depositStatus === 'Deducted' ||
      b.depositStatus === 2 ||
      b.depositStatus === 3 ||
      b.depositStatus === 4;

    return b.status === 'Completed' || b.status === 'PickedUp' || (isDepositSettled && isDisputeResolved);
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const completed = isBookingCompleted(b);
    if (filter === 'ALL') return true;
    if (filter === 'RESERVED') return !completed && (b.status === 'Reserved' || !b.isDeliveryVerified);
    if (filter === 'ACTIVE') return !completed && b.status === 'Active' && b.isDeliveryVerified;
    if (filter === 'RETURN_REQUESTED') return !completed && b.status === 'ReturnRequested';
    if (filter === 'COMPLETED') return completed;
    return true;
  });

  const totalHeldDeposit = bookings
    .filter((b) => !isBookingCompleted(b) && (b.depositStatus === 'Held' || b.depositStatus === 1))
    .reduce((sum, b) => sum + (Number(b.securityDeposit) || 0), 0);

  const activeRentalsCount = bookings.filter((b) => !isBookingCompleted(b) && (b.status === 'Active' || b.status === 'Reserved')).length;

  return (
    <div className="ra-page-container" style={{ padding: '24px 20px 80px 20px' }}>
      {/* ─── Breadcrumb & Header ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={onBackToCatalog}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--text-main)',
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
            borderRadius: '10px',
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
            borderRadius: '16px',
            padding: '20px 24px',
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
            borderRadius: '16px',
            padding: '20px 24px',
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
            borderRadius: '16px',
            padding: '20px 24px',
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

      {/* ─── Filter Tabs (Borderless sleek pills) ─── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
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
              border: 'none',
              background: filter === t.key ? '#18181b' : '#f4f4f5',
              color: filter === t.key ? '#ffffff' : 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 600,
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
            borderRadius: '16px',
            padding: '60px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
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
            const isCompleted = isBookingCompleted(b);
            const isDisputeOpen =
              b.disputeStatus === 'Open' ||
              b.disputeStatus === 'UnderReview' ||
              b.disputeStatus === 1 ||
              b.disputeStatus === 2;
            const isDisputeResolved =
              b.disputeStatus === 'ResolvedCustomerFavored' ||
              b.disputeStatus === 'ResolvedVendorFavored' ||
              b.disputeStatus === 'SplitResolution' ||
              b.disputeStatus === 'Closed' ||
              b.disputeStatus === 3 ||
              b.disputeStatus === 4 ||
              b.disputeStatus === 5 ||
              b.disputeStatus === 6;

            const isReserved = !isCompleted && (b.status === 'Reserved' || !b.isDeliveryVerified);
            const isActive = !isCompleted && b.status === 'Active' && b.isDeliveryVerified;
            const isReturnRequested = !isCompleted && b.status === 'ReturnRequested';

            const monthsPaid = b.monthsPaidCount || 1;
            const totalMonths = b.rentalDurationMonths || 3;
            const hasRemainingMonths = monthsPaid < totalMonths;

            return (
              <div
                key={b.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
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
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img
                      src={b.itemImageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=140&q=80'}
                      alt=""
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
                        {b.vendorStoreName || 'Merchant Store'} • 📍 {b.deliveryCity || 'Ahmedabad'}
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                        {b.itemTitle}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Ref: <strong style={{ color: 'var(--text-body)' }}>{b.bookingReference}</strong>
                        <span style={{ margin: '0 8px' }}>•</span>
                        Quantity: <strong style={{ color: 'var(--text-main)' }}>{b.quantity || 1} unit(s)</strong>
                        <span style={{ margin: '0 8px' }}>•</span>
                        Ordered on: {new Date(b.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isDisputeOpen && (
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        ⚠️ Dispute Under Review
                      </span>
                    )}

                    {!isDisputeOpen && isDisputeResolved && (
                      <span
                        style={{
                          background: '#f0fdf4',
                          color: '#166534',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        ⚖️ Dispute Settled & Disbursed
                      </span>
                    )}

                    {!isDisputeOpen && !isDisputeResolved && isReserved && (
                      <span
                        style={{
                          background: '#f4f4f5',
                          color: '#18181b',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        ⏳ Awaiting Doorstep Delivery
                      </span>
                    )}

                    {!isDisputeOpen && !isDisputeResolved && isActive && (
                      <span
                        style={{
                          background: '#f0fdf4',
                          color: '#166534',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        ● Active Rental
                      </span>
                    )}

                    {!isDisputeOpen && !isDisputeResolved && isReturnRequested && (
                      <span
                        style={{
                          background: '#f4f4f5',
                          color: '#18181b',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        🚚 Return Requested
                      </span>
                    )}

                    {!isDisputeOpen && !isDisputeResolved && isCompleted && (
                      <span
                        style={{
                          background: '#fafafa',
                          color: '#71717a',
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
                      background: '#f4f4f5',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        Doorstep Delivery Verification OTP
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: 0, maxWidth: '520px', lineHeight: 1.5 }}>
                        Provide this 6-digit OTP to the delivery agent upon receiving your item. <strong>Your rental start date officially begins from the verified day of delivery!</strong>
                      </p>
                    </div>

                    <div
                      style={{
                        background: '#ffffff',
                        borderRadius: '10px',
                        padding: '10px 24px',
                        fontSize: '28px',
                        fontWeight: 900,
                        letterSpacing: '6px',
                        color: '#18181b',
                        fontFamily: 'monospace',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
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
                        background: '#f8f8f9',
                        borderRadius: '12px',
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
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                          {monthsPaid} of {totalMonths} Months Paid
                        </strong>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Next Payment Due</span>
                        <strong style={{ fontSize: '14px', color: hasRemainingMonths ? '#18181b' : '#15803d' }}>
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
                          background: '#f8f8f9',
                          borderRadius: '12px',
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
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                            Month {monthsPaid + 1} Rent: ₹{Number(b.monthlyRent).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Pay directly on app via Stripe (instant vendor payout) or settle offline with vendor.
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

                {/* ─── 3. RETURN REQUESTED STATE (NO DISPUTE) ─── */}
                {isReturnRequested && !isDisputeOpen && !isDisputeResolved && (
                  <div
                    style={{
                      marginTop: '20px',
                      background: '#f4f4f5',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      fontSize: '13px',
                      color: 'var(--text-body)',
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>🚚 Return Scheduled:</strong> The merchant will physically inspect the item at pickup. Once verified, your refundable security deposit of <strong>₹{Number(b.securityDeposit).toLocaleString('en-IN')}</strong> will be released back to your card via Stripe.
                  </div>
                )}

                {/* ─── 4. DISPUTE UNDER REVIEW STATE ─── */}
                {isDisputeOpen && (
                  <div
                    style={{
                      marginTop: '20px',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '12px',
                      padding: '16px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#92400e', fontSize: '14px' }}>
                      <span>⚠️</span>
                      <span>Formal Dispute Case Under Review ({b.disputeTicketNumber})</span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#78350f', lineHeight: 1.5 }}>
                      Your security deposit of <strong>₹{Number(b.securityDeposit).toLocaleString('en-IN')}</strong> is safely locked in RentAssure Escrow. Platform administrators are actively evaluating case statements and merchant inspection checklists. You will be notified as soon as an arbitration ruling is published.
                    </p>
                  </div>
                )}

                {/* ─── 5. ARBITRATION RESOLUTION & ESCROW DISTRIBUTION STATE ─── */}
                {isDisputeResolved && (
                  <div
                    style={{
                      marginTop: '20px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      padding: '18px 20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#166534', fontSize: '15px' }}>
                        <span>⚖️</span>
                        <span>Arbitration Settlement Finalized ({b.disputeTicketNumber || 'Escrow Settled'})</span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: '#dcfce7',
                          color: '#15803d',
                        }}
                      >
                        {b.disputeStatus === 'ResolvedCustomerFavored' || b.disputeStatus === 3
                          ? 'Customer Favored'
                          : b.disputeStatus === 'ResolvedVendorFavored' || b.disputeStatus === 4
                          ? 'Merchant Favored'
                          : 'Split Resolution'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '12px',
                        background: '#ffffff',
                        padding: '14px 18px',
                        borderRadius: '10px',
                        border: '1px solid #dcfce7',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>REFUNDED TO YOUR CARD</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#166534', marginTop: '3px' }}>
                          ₹{Number(b.depositRefundedAmount ?? b.disputeRefundToCustomer ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>Via Stripe Payment Method</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>DISBURSED TO STORE</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                          ₹{Number(b.depositDeductedAmount ?? b.disputePayoutToVendor ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Damage / compensation payout</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ESCROW STATUS</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#166534', marginTop: '3px' }}>
                          {b.depositStatus || 'Refunded'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Escrow Closed</div>
                      </div>
                    </div>

                    {b.disputeAdminNotes && (
                      <div
                        style={{
                          marginTop: '12px',
                          fontSize: '12px',
                          color: '#166534',
                          lineHeight: 1.5,
                          background: '#ffffff',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #dcfce7',
                        }}
                      >
                        <strong>Trust & Safety Arbitration Findings:</strong> {b.disputeAdminNotes}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── 6. NORMAL COMPLETED STATE (NO DISPUTE) ─── */}
                {isCompleted && !isDisputeResolved && (
                  <div
                    style={{
                      marginTop: '20px',
                      background: '#f0fdf4',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      fontSize: '13px',
                      color: '#166534',
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>✓ Physical Inspection Verified:</strong> Item successfully returned in good condition. Your held security deposit of <strong>₹{Number(b.depositRefundedAmount || b.securityDeposit).toLocaleString('en-IN')}</strong> has been released back to your card via Stripe. {b.stripeRefundId && `(Stripe Refund ID: ${b.stripeRefundId})`}
                  </div>
                )}

                {/* ─── 7. CUSTOMER RATING & REVIEW SECTION ─── */}
                {b.customerRating ? (
                  <div
                    style={{
                      marginTop: '16px',
                      background: '#fefce8',
                      border: '1px solid #fef08a',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#eab308', fontSize: '18px', letterSpacing: '2px' }}>
                          {'★'.repeat(b.customerRating)}{'☆'.repeat(5 - b.customerRating)}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#854d0e' }}>
                          Rated {b.customerRating}/5
                        </span>
                        {b.customerReviewDate && (
                          <span style={{ fontSize: '11px', color: '#a16207' }}>
                            • {new Date(b.customerReviewDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {b.customerReviewComment && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#713f12', fontStyle: 'italic', lineHeight: 1.4 }}>
                          "{b.customerReviewComment}"
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openRatingModal(b)}
                      className="ra-btn ra-btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 14px', background: '#fff', borderColor: '#fef08a', fontWeight: 600 }}
                    >
                      ✎ Edit Review
                    </button>
                  </div>
                ) : (isCompleted || b.status === 'Active' || b.isDeliveryVerified || b.status === 'ReturnRequested') ? (
                  <div
                    style={{
                      marginTop: '16px',
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>⭐</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                          {isCompleted ? 'How was your rental experience?' : 'Rate this product'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Help fellow renters in your city by leaving a star rating & review.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openRatingModal(b)}
                      className="ra-btn ra-btn-primary"
                      style={{
                        fontSize: '12px',
                        padding: '7px 16px',
                        background: '#eab308',
                        borderColor: '#ca8a04',
                        color: '#000',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(234, 179, 8, 0.25)',
                      }}
                    >
                      ★ Rate Order
                    </button>
                  </div>
                ) : null}

                {/* ─── CARD ACTIONS FOOTER: ESCROW DISPUTE & SUPPORT ─── */}
                {!isCompleted && !isDisputeOpen && !isDisputeResolved && b.status !== 'Cancelled' && (
                  <div
                    style={{
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>🛡️</span>
                      <span>
                        Deposit of <strong>₹{Number(b.securityDeposit).toLocaleString('en-IN')}</strong> securely held in escrow.
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setDisputeModal({
                            isOpen: true,
                            booking: b,
                            reason: b.status === 'Reserved' ? 3 : 5,
                            claimedAmount: b.securityDeposit || '',
                            description: '',
                            loading: false,
                            error: '',
                          })
                        }
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: '1px solid #fecdd3',
                          background: '#fff1f2',
                          color: '#9f1239',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>⚖️</span> Open Dispute
                      </button>

                      {onOpenSupport && (
                        <button
                          type="button"
                          onClick={onOpenSupport}
                          className="ra-btn ra-btn-secondary ra-btn-sm"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          💬 Need Help
                        </button>
                      )}
                    </div>
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
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: 'var(--shadow-modal)',
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

      {/* ─── ESCROW DISPUTE MODAL ─── */}
      {disputeModal.isOpen && (
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
            zIndex: 1100,
            padding: '16px',
          }}
          onClick={() => setDisputeModal({ isOpen: false, booking: null, reason: 5, claimedAmount: '', description: '', loading: false, error: '' })}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>⚖️</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Open Escrow Dispute
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              File a formal dispute for Booking <strong>#{disputeModal.booking?.id}</strong> ({disputeModal.booking?.itemTitle}). Our neutral Trust & Safety arbitration team will examine evidence and adjudicate fairly.
            </p>

            <div
              style={{
                background: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#991b1b',
                lineHeight: 1.5,
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '16px' }}>🛡</span>
              <div>
                <strong>Escrow Protection Active:</strong> Your deposit of ₹{Number(disputeModal.booking?.securityDeposit || 0).toLocaleString('en-IN')} remains locked in escrow and will not be deducted or released until an administrator resolves this case.
              </div>
            </div>

            {disputeModal.error && (
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
                {disputeModal.error}
              </div>
            )}

            <form onSubmit={handleSubmitDispute}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Dispute Reason
                </label>
                <select
                  value={disputeModal.reason}
                  onChange={(e) => setDisputeModal({ ...disputeModal, reason: Number(e.target.value) })}
                  className="ra-select"
                  style={{ background: '#f4f4f5', borderRadius: '8px', padding: '10px 14px' }}
                >
                  <option value={5}>Item Condition Mismatch / Defect on Delivery</option>
                  <option value={3}>Delivery Delay / Non-Delivery by Merchant</option>
                  <option value={1}>Dispute Over Damage Assessment</option>
                  <option value={2}>Unfair Deposit Deduction Claim</option>
                  <option value={4}>Pickup / Return Logistics Delay</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Disputed / Claimed Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max={Number(disputeModal.booking?.securityDeposit || 100000)}
                  value={disputeModal.claimedAmount}
                  onChange={(e) => setDisputeModal({ ...disputeModal, claimedAmount: e.target.value })}
                  placeholder={`Max ₹${disputeModal.booking?.securityDeposit}`}
                  className="ra-input"
                  style={{ background: '#f4f4f5', borderRadius: '8px', padding: '10px 14px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Default is full security deposit (₹{disputeModal.booking?.securityDeposit}).
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Detailed Explanation & Evidence
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe what occurred, any communication with merchant, condition upon arrival, or reasons why deductions are unfair..."
                  value={disputeModal.description}
                  onChange={(e) => setDisputeModal({ ...disputeModal, description: e.target.value })}
                  className="ra-textarea"
                  style={{ background: '#f4f4f5', borderRadius: '8px', padding: '10px 14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDisputeModal({ isOpen: false, booking: null, reason: 5, claimedAmount: '', description: '', loading: false, error: '' })}
                  className="ra-btn ra-btn-secondary"
                  disabled={disputeModal.loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeModal.loading}
                  className="ra-btn ra-btn-danger"
                  style={{ background: '#dc2626', color: '#ffffff', fontWeight: 700 }}
                >
                  {disputeModal.loading ? 'Submitting...' : 'Submit Formal Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RATING & REVIEW MODAL ─── */}
      {ratingModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px',
          }}
          onClick={() => !ratingModal.loading && setRatingModal({ isOpen: false, booking: null, rating: 5, hoverRating: 0, comment: '', loading: false, error: '', success: '' })}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⭐</span> Rate Your Rental
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {ratingModal.booking?.itemTitle} • {ratingModal.booking?.bookingReference}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRatingModal({ isOpen: false, booking: null, rating: 5, hoverRating: 0, comment: '', loading: false, error: '', success: '' })}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {ratingModal.error && (
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
                {ratingModal.error}
              </div>
            )}

            {ratingModal.success && (
              <div
                style={{
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  color: '#15803d',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  fontWeight: 600,
                }}
              >
                ✓ {ratingModal.success}
              </div>
            )}

            <form onSubmit={handleRatingSubmit}>
              {/* Star Rating Interactive Picker */}
              <div style={{ textAlign: 'center', margin: '20px 0 16px 0' }}>
                <div style={{ display: 'inline-flex', gap: '8px', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeScore = ratingModal.hoverRating || ratingModal.rating;
                    const isFilled = star <= activeScore;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingModal((prev) => ({ ...prev, rating: star }))}
                        onMouseEnter={() => setRatingModal((prev) => ({ ...prev, hoverRating: star }))}
                        onMouseLeave={() => setRatingModal((prev) => ({ ...prev, hoverRating: 0 }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                          cursor: 'pointer',
                          fontSize: '32px',
                          lineHeight: 1,
                          color: isFilled ? '#eab308' : '#e2e8f0',
                          transition: 'transform 0.1s ease',
                          transform: isFilled ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: 700, color: '#ca8a04' }}>
                  {(ratingModal.hoverRating || ratingModal.rating) === 1 && '😞 1/5 - Poor'}
                  {(ratingModal.hoverRating || ratingModal.rating) === 2 && '😐 2/5 - Fair'}
                  {(ratingModal.hoverRating || ratingModal.rating) === 3 && '🙂 3/5 - Good'}
                  {(ratingModal.hoverRating || ratingModal.rating) === 4 && '😊 4/5 - Very Good'}
                  {(ratingModal.hoverRating || ratingModal.rating) === 5 && '🤩 5/5 - Excellent!'}
                </div>
              </div>

              {/* Review Comments */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Share Your Experience (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Tell other renters about the item quality, condition, pickup/delivery ease..."
                  value={ratingModal.comment}
                  onChange={(e) => setRatingModal({ ...ratingModal, comment: e.target.value })}
                  className="ra-textarea"
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    resize: 'vertical',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRatingModal({ isOpen: false, booking: null, rating: 5, hoverRating: 0, comment: '', loading: false, error: '', success: '' })}
                  className="ra-btn ra-btn-secondary"
                  disabled={ratingModal.loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ratingModal.loading}
                  className="ra-btn ra-btn-primary"
                  style={{
                    background: '#eab308',
                    borderColor: '#ca8a04',
                    color: '#000',
                    fontWeight: 700,
                  }}
                >
                  {ratingModal.loading ? 'Saving...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
