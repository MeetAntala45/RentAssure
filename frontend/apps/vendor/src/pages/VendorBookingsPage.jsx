import React, { useState, useEffect } from 'react';
import { vendorApi, paymentsApi } from '../../../../src/shared/api';

export default function VendorBookingsPage({ initialBookingId = null, onNavigateToEarnings }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState(initialBookingId);

  useEffect(() => {
    if (initialBookingId) {
      setSelectedBookingId(initialBookingId);
    }
  }, [initialBookingId]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [durationFilter, setDurationFilter] = useState('All');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Pagination states (matching reference Image 1)
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Active 3-dot menu tracking
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Action modal / confirm state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null, // 'Completed' | 'Cancelled'
    booking: null,
    notes: '',
    loading: false,
  });

  // Verify Delivery OTP modal
  const [otpModal, setOtpModal] = useState({
    isOpen: false,
    booking: null,
    otp: '',
    loading: false,
    error: '',
  });

  // Record Offline Payment modal
  const [offlinePayModal, setOfflinePayModal] = useState({
    isOpen: false,
    booking: null,
    loading: false,
  });

  // Physical Return & Release Deposit modal
  const [returnInspectModal, setReturnInspectModal] = useState({
    isOpen: false,
    booking: null,
    notes: 'Physical item inspected at return pickup. Item returned in good condition, all accessories verified.',
    loading: false,
    error: '',
  });

  const [refundingId, setRefundingId] = useState(null);
  const [refundNotice, setRefundNotice] = useState(null);

  const handleVerifyOtp = async () => {
    if (!otpModal.otp || otpModal.otp.trim().length !== 6) {
      setOtpModal((prev) => ({ ...prev, error: 'Please enter a valid 6-digit OTP code provided by the customer.' }));
      return;
    }
    setOtpModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await vendorApi.verifyDeliveryOtp(otpModal.booking.id, otpModal.otp.trim());
      if (res.isSuccess) {
        alert('✓ Delivery confirmed! Rental lease duration has officially started from today.');
        setOtpModal({ isOpen: false, booking: null, otp: '', loading: false, error: '' });
        await fetchBookings();
      } else {
        setOtpModal((prev) => ({ ...prev, error: res.message || 'Invalid delivery OTP.' }));
      }
    } catch (err) {
      setOtpModal((prev) => ({ ...prev, error: err.response?.data?.message || 'Error verifying delivery OTP.' }));
    } finally {
      setOtpModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleRecordOfflinePayment = async () => {
    if (!offlinePayModal.booking) return;
    setOfflinePayModal((prev) => ({ ...prev, loading: true }));
    try {
      const res = await vendorApi.recordOfflinePayment(offlinePayModal.booking.id);
      if (res.isSuccess) {
        alert('✓ Offline monthly rent recorded! Vendor payout credited and next billing cycle updated.');
        setOfflinePayModal({ isOpen: false, booking: null, loading: false });
        await fetchBookings();
      } else {
        alert(res.message || 'Failed to record offline payment.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording offline payment.');
    } finally {
      setOfflinePayModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleReturnAndReleaseDeposit = async () => {
    if (!returnInspectModal.booking) return;
    setReturnInspectModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await vendorApi.releaseDeposit(returnInspectModal.booking.id, returnInspectModal.notes);
      if (res.isSuccess) {
        alert('✓ Physical return verified! Security deposit refunded to customer via Stripe and item returned to available stock.');
        setReturnInspectModal({ isOpen: false, booking: null, notes: '', loading: false, error: '' });
        await fetchBookings();
      } else {
        setReturnInspectModal((prev) => ({ ...prev, error: res.message || 'Failed to release deposit.' }));
      }
    } catch (err) {
      setReturnInspectModal((prev) => ({ ...prev, error: err.response?.data?.message || 'Error releasing deposit.' }));
    } finally {
      setReturnInspectModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleRefundDeposit = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to release and refund the security deposit for booking #${bookingId} to the customer's card via Stripe?`)) {
      return;
    }
    setRefundingId(bookingId);
    try {
      const res = await paymentsApi.refundDeposit(bookingId);
      if (res.isSuccess) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  depositStatus: 'Refunded',
                  stripeRefundId: res.data?.refundId,
                  depositRefundedAmount: b.securityDeposit,
                }
              : b
          )
        );
        setRefundNotice({
          bookingId,
          message: res.message || `Deposit of ₹${res.data?.refundedAmount} refunded via Stripe. Refund ID: ${res.data?.refundId}`,
        });
        setTimeout(() => setRefundNotice(null), 8000);
      } else {
        alert(res.message || 'Failed to refund deposit.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error executing Stripe refund.');
    } finally {
      setRefundingId(null);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vendorApi.getBookings();
      if (res.isSuccess && Array.isArray(res.data)) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Close 3-dot menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.ra-action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus, vendorNotes = '') => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const res = await vendorApi.updateBookingStatus(bookingId, newStatus, vendorNotes);
      if (res.isSuccess) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus, vendorNotes: vendorNotes || b.vendorNotes } : b))
        );
        setConfirmModal({ isOpen: false, action: null, booking: null, notes: '', loading: false });
        setActiveMenuId(null);
      } else {
        alert(res.message || 'Failed to update booking status.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating booking status.');
    } finally {
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const getStatusBadge = (statusStr) => {
    const status = (statusStr || '').toLowerCase();
    let dotColor = '#22c55e';
    let textColor = '#15803d';
    let label = statusStr || 'Unknown';

    if (status === 'active') {
      dotColor = '#22c55e';
      textColor = '#15803d';
      label = 'Active';
    } else if (status === 'delivered') {
      dotColor = '#3b82f6';
      textColor = '#1d4ed8';
      label = 'Delivered';
    } else if (status === 'completed') {
      dotColor = '#64748b';
      textColor = '#475569';
      label = 'Completed';
    } else if (status === 'returnrequested') {
      dotColor = '#f59e0b';
      textColor = '#b45309';
      label = 'Return Requested';
    } else if (status === 'reserved') {
      dotColor = '#8b5cf6';
      textColor = '#6d28d9';
      label = 'Reserved';
    } else if (status === 'cancelled') {
      dotColor = '#ef4444';
      textColor = '#b91c1c';
      label = 'Cancelled';
    } else if (status === 'pickedup') {
      dotColor = '#06b6d4';
      textColor = '#0e7490';
      label = 'Picked Up';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: 600,
          color: textColor,
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: dotColor,
            display: 'inline-block',
          }}
        />
        {label}
      </span>
    );
  };

  // Filter logic
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      (b.bookingReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.customerPhone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.itemTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.deliveryAddress || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.deliveryCity || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || (b.status || '').toLowerCase() === statusFilter.toLowerCase();

    const matchesDuration =
      durationFilter === 'All' || b.rentalDurationMonths === parseInt(durationFilter, 10);

    return matchesSearch && matchesStatus && matchesDuration;
  });

  // Pagination logic
  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = filteredBookings.slice(startIndex, endIndex);

  // Selected Booking for Detail View (Image 2)
  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. DETAIL VIEW (Matches Image 2 format)
  // ─────────────────────────────────────────────────────────────────────────────
  if (selectedBooking) {
    const isCompleted = (selectedBooking.status || '').toLowerCase() === 'completed';
    const isCancelled = (selectedBooking.status || '').toLowerCase() === 'cancelled';
    const canModify = !isCompleted && !isCancelled;

    const startDateStr = selectedBooking.startDate
      ? new Date(selectedBooking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A';
    const endDateStr = selectedBooking.endDate
      ? new Date(selectedBooking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A';

    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px', fontFamily: 'inherit' }}>
        {/* Header with Back Arrow (Image 2) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSelectedBookingId(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              title="Back to Bookings"
            >
              ←
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              {selectedBooking.customerName}
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#f1f5f9',
                fontSize: '12px',
                fontWeight: 700,
                color: '#475569',
              }}
            >
              Ref: {selectedBooking.bookingReference}
            </span>
            <div style={{ marginLeft: '6px' }}>{getStatusBadge(selectedBooking.status)}</div>
          </div>

          {canModify && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {(!selectedBooking.isDeliveryVerified || (selectedBooking.status || '').toLowerCase() === 'reserved') && (
                <button
                  onClick={() =>
                    setOtpModal({
                      isOpen: true,
                      booking: selectedBooking,
                      otp: '',
                      loading: false,
                      error: '',
                    })
                  }
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#18181b',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  🔑 Verify Delivery OTP
                </button>
              )}

              {(selectedBooking.status || '').toLowerCase() === 'returnrequested' && (
                <button
                  onClick={() =>
                    setReturnInspectModal({
                      isOpen: true,
                      booking: selectedBooking,
                      notes: 'Item physically inspected at return pickup. Good condition.',
                      loading: false,
                      error: '',
                    })
                  }
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#047857',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🛡 Inspect Return & Release Deposit
                </button>
              )}

              {(selectedBooking.status || '').toLowerCase() === 'active' &&
                (selectedBooking.monthsPaidCount || 1) < selectedBooking.rentalDurationMonths && (
                  <button
                    onClick={() =>
                      setOfflinePayModal({
                        isOpen: true,
                        booking: selectedBooking,
                        loading: false,
                      })
                    }
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: '1px solid #16a34a',
                      background: '#f0fdf4',
                      color: '#166534',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    💵 Record Offline Month {(selectedBooking.monthsPaidCount || 1) + 1}
                  </button>
                )}

              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    action: 'Completed',
                    booking: selectedBooking,
                    notes: '',
                    loading: false,
                  })
                }
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#1e293b',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✓ Mark Completed
              </button>

              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    action: 'Cancelled',
                    booking: selectedBooking,
                    notes: '',
                    loading: false,
                  })
                }
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#b91c1c',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✕ Cancel
              </button>
            </div>
          )}
        </div>

        {/* Customer & Booking Metadata Profile Card (Image 2 Format) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '24px 28px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px 20px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Booking ID
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                #{selectedBooking.id}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Customer Name
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                {selectedBooking.customerName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Mobile Number
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                {selectedBooking.customerPhone || 'Not specified'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Email
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                {selectedBooking.customerEmail || '—'}
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Delivery Address
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155', lineHeight: '1.5' }}>
                {selectedBooking.deliveryAddress}
                {selectedBooking.deliveryCity ? `, ${selectedBooking.deliveryCity}` : ''}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Rental Item
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                {selectedBooking.itemTitle}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Rental Duration & Period
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                {selectedBooking.rentalDurationMonths} Months ({startDateStr} → {endDateStr})
              </div>
            </div>
          </div>
        </div>

        {/* Doorstep Delivery & Monthly Rental Cycle Section */}
        {(!selectedBooking.isDeliveryVerified || (selectedBooking.status || '').toLowerCase() === 'reserved') ? (
          <div
            style={{
              background: '#f4f4f5',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px' }}>📦</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Awaiting Doorstep Delivery Verification
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-body)', lineHeight: '1.5' }}>
                The rental period begins from the physical delivery date, not the order date. Ask the customer for their 6-digit OTP upon delivery to start the rental.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setOtpModal({
                  isOpen: true,
                  booking: selectedBooking,
                  otp: '',
                  loading: false,
                  error: '',
                })
              }
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                background: '#18181b',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              🔑 Enter Delivery OTP
            </button>
          </div>
        ) : (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📅</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Rental Lifecycle & Monthly Billing Cycle
                </h3>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#f0fdf4',
                  color: '#166534',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                ✓ Delivered & Active
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ padding: '14px 16px', background: '#f8f8f9', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DELIVERY CONFIRMED ON</div>
                <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 700, marginTop: '4px' }}>
                  {selectedBooking.deliveredAt
                    ? new Date(selectedBooking.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : startDateStr}
                </div>
              </div>

              <div style={{ padding: '14px 16px', background: '#f8f8f9', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MONTHLY PAYMENT PROGRESS</div>
                <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 700, marginTop: '4px' }}>
                  Month {selectedBooking.monthsPaidCount || 1} of {selectedBooking.rentalDurationMonths} Paid
                </div>
              </div>

              <div style={{ padding: '14px 16px', background: '#f8f8f9', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>NEXT PAYMENT DUE DATE</div>
                <div style={{ fontSize: '14px', color: selectedBooking.nextPaymentDueDate ? '#18181b' : 'var(--text-muted)', fontWeight: 700, marginTop: '4px' }}>
                  {selectedBooking.nextPaymentDueDate
                    ? new Date(selectedBooking.nextPaymentDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Rental Completed'}
                </div>
              </div>
            </div>

            {(selectedBooking.monthsPaidCount || 1) < selectedBooking.rentalDurationMonths && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px dashed #cbd5e1',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '13px', color: '#475569' }}>
                  Customer can pay Month {(selectedBooking.monthsPaidCount || 1) + 1} online via Stripe. If received offline or in cash, record it below:
                </div>
                <button
                  type="button"
                  onClick={() => setOfflinePayModal({ isOpen: true, booking: selectedBooking, loading: false })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #16a34a',
                    background: '#f0fdf4',
                    color: '#166534',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  💵 Record Month {(selectedBooking.monthsPaidCount || 1) + 1} Payment (Offline)
                </button>
              </div>
            )}

            {((selectedBooking.status || '').toLowerCase() === 'returnrequested' || (selectedBooking.status || '').toLowerCase() === 'active') &&
              selectedBooking.depositStatus !== 'Refunded' && !selectedBooking.stripeRefundId && (
                <div
                  style={{
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>
                      {(selectedBooking.status || '').toLowerCase() === 'returnrequested'
                        ? 'Customer has requested item return'
                        : 'Physical Return Inspection & Security Deposit'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
                      Inspect the item physically upon return. Once verified, release the ₹{selectedBooking.securityDeposit?.toFixed(2)} deposit back to customer's card.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setReturnInspectModal({
                        isOpen: true,
                        booking: selectedBooking,
                        notes: 'Item physically inspected and returned in good condition.',
                        loading: false,
                        error: '',
                      })
                    }
                    style={{
                      padding: '9px 18px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#047857',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    🛡 Verify Return & Release Deposit
                  </button>
                </div>
              )}
          </div>
        )}

        {/* Financial & Escrow Overview Cards (Styled like Image 2's cards) */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
            Financial Breakdown & Escrow Settlement
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Monthly Rent</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>
                ₹{selectedBooking.monthlyRent?.toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Charged per month</div>
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Security Deposit</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>
                ₹{selectedBooking.securityDeposit?.toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7', marginTop: '4px' }}>
                {selectedBooking.depositStatus === 'Refunded' || selectedBooking.stripeRefundId
                  ? '✓ Refunded to Customer Card'
                  : '🛡 Held in Escrow'}
              </div>

              {selectedBooking.isPaidOnline && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#0369a1' }}>
                    <span>💳</span> Stripe Online Payment
                  </div>
                  {selectedBooking.stripeRefundId ? (
                    <div style={{ marginTop: '4px', color: '#15803d', fontWeight: 700 }}>
                      Stripe Refund ID: <code style={{ fontSize: '10px' }}>{selectedBooking.stripeRefundId}</code>
                    </div>
                  ) : selectedBooking.depositStatus !== 'Refunded' && (
                    <button
                      type="button"
                      onClick={() => handleRefundDeposit(selectedBooking.id)}
                      disabled={refundingId === selectedBooking.id}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#047857',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: refundingId === selectedBooking.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      {refundingId === selectedBooking.id ? 'Refunding via Stripe...' : '⚡ Release Deposit (Refund via Stripe)'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Gross Volume Collected</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>
                ₹{selectedBooking.totalAmountPaid?.toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Deposit + Upfront Rental</div>
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                Platform Fee ({selectedBooking.commissionRateApplied || 12.5}%)
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#64748b', marginTop: '6px' }}>
                -₹{selectedBooking.platformCommissionAmount?.toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Automated Marketplace Cut</div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Net Vendor Take-Home</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                ₹{selectedBooking.vendorPayoutAmount?.toFixed(2)}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isCompleted ? '#15803d' : '#d97706',
                  marginTop: '4px',
                }}
              >
                {isCompleted ? '✓ Payout Released' : '⏳ Escrow Pending'}
              </div>
              {onNavigateToEarnings && (
                <button
                  type="button"
                  onClick={onNavigateToEarnings}
                  style={{
                    marginTop: '8px',
                    background: 'none',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'left',
                    textDecoration: 'underline',
                  }}
                >
                  View Payouts & Earnings →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fulfillment & Logistics Notes */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '24px 28px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 12px 0' }}>
            Vendor Notes & Logistics Status
          </h3>
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              color: '#334155',
              lineHeight: '1.6',
            }}
          >
            {selectedBooking.vendorNotes || 'No fulfillment notes entered yet for this booking.'}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. BOOKINGS LIST TABLE VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="ra-page-container">
      {/* ─── HEADER BAR ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            Booking Management
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Track and manage all customer equipment rentals, fulfillment, and returns.
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search bookings by customer, phone, item..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="ra-input"
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              width: '260px',
            }}
          />

          <button
            onClick={() => setShowFilterDrawer(true)}
            className="ra-btn ra-btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <span>⚡</span> Filter
            {(statusFilter !== 'All' || durationFilter !== 'All') && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#18181b',
                  display: 'inline-block',
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* ─── ERROR STATE ──────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#991b1b',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* ─── TABLE VIEW ──────────────────────────── */}
      <div
        className="ra-table-responsive"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Loading bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              No bookings found
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'No rental bookings have been recorded yet.'}
            </div>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b', width: '90px' }}>
                    ID <span style={{ fontSize: '10px', color: '#94a3b8' }}>⇅</span>
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Name <span style={{ fontSize: '10px', color: '#94a3b8' }}>⇅</span>
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Mobile Number
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Email <span style={{ fontSize: '10px', color: '#94a3b8' }}>⇅</span>
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Address
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Rental Item
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Duration <span style={{ fontSize: '10px', color: '#94a3b8' }}>⇅</span>
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Status
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b', textAlign: 'center', width: '60px' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((b) => {
                  const isCompleted = (b.status || '').toLowerCase() === 'completed';
                  const isCancelled = (b.status || '').toLowerCase() === 'cancelled';
                  const canModify = !isCompleted && !isCancelled;
                  const displayId = String(b.id).padStart(3, '0');

                  return (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                      onClick={() => setSelectedBookingId(b.id)}
                    >
                      <td style={{ padding: '16px 18px', fontWeight: 600, color: '#1e293b' }}>
                        {displayId}
                      </td>

                      <td style={{ padding: '16px 18px', fontWeight: 600, color: '#1e293b' }}>
                        {b.customerName}
                      </td>

                      <td style={{ padding: '16px 18px', color: '#334155' }}>
                        {b.customerPhone || '—'}
                      </td>

                      <td style={{ padding: '16px 18px', color: '#334155' }}>
                        {b.customerEmail || '—'}
                      </td>

                      <td style={{ padding: '16px 18px', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.deliveryCity || b.deliveryAddress || '—'}
                      </td>

                      <td style={{ padding: '16px 18px', color: '#1e293b', fontWeight: 600, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.itemTitle}
                      </td>

                      <td style={{ padding: '16px 18px', color: '#64748b' }}>
                        {b.rentalDurationMonths} Months
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        {getStatusBadge(b.status)}
                      </td>

                      <td
                        style={{ padding: '16px 18px', textAlign: 'center', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="ra-action-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === b.id ? null : b.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '18px',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '4px',
                            }}
                            title="Actions"
                          >
                            ⋮
                          </button>

                          {activeMenuId === b.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                zIndex: 100,
                                background: '#ffffff',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                                minWidth: '170px',
                                padding: '6px 0',
                                textAlign: 'left',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setSelectedBookingId(b.id);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 14px',
                                  border: 'none',
                                  background: 'none',
                                  fontSize: '13px',
                                  color: '#1e293b',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <span>👁️</span> View Details
                              </button>

                              {canModify && (
                                <>
                                  {(!b.isDeliveryVerified || (b.status || '').toLowerCase() === 'reserved') && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setOtpModal({
                                          isOpen: true,
                                          booking: b,
                                          otp: '',
                                          loading: false,
                                          error: '',
                                        });
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '8px 14px',
                                        border: 'none',
                                        background: 'none',
                                        fontSize: '13px',
                                        color: '#18181b',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontWeight: 600,
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f4f4f5')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                      <span>🔑</span> Verify Delivery OTP
                                    </button>
                                  )}

                                  {(b.status || '').toLowerCase() === 'active' &&
                                    (b.monthsPaidCount || 1) < b.rentalDurationMonths && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setOfflinePayModal({
                                            isOpen: true,
                                            booking: b,
                                            loading: false,
                                          });
                                        }}
                                        style={{
                                          width: '100%',
                                          padding: '8px 14px',
                                          border: 'none',
                                          background: 'none',
                                          fontSize: '13px',
                                          color: '#16a34a',
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          fontWeight: 600,
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                      >
                                        <span>💵</span> Record Offline Month {(b.monthsPaidCount || 1) + 1}
                                      </button>
                                    )}

                                  {((b.status || '').toLowerCase() === 'returnrequested' ||
                                    ((b.status || '').toLowerCase() === 'active' && b.depositStatus !== 'Refunded')) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setReturnInspectModal({
                                          isOpen: true,
                                          booking: b,
                                          notes: 'Physical item inspected at return pickup. Good condition.',
                                          loading: false,
                                          error: '',
                                        });
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '8px 14px',
                                        border: 'none',
                                        background: 'none',
                                        fontSize: '13px',
                                        color: '#047857',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontWeight: 600,
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ecfdf5')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                      <span>🛡</span> Inspect & Release Deposit
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setConfirmModal({
                                        isOpen: true,
                                        action: 'Completed',
                                        booking: b,
                                        notes: '',
                                        loading: false,
                                      });
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '8px 14px',
                                      border: 'none',
                                      background: 'none',
                                      fontSize: '13px',
                                      color: '#15803d',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      fontWeight: 600,
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <span>✓</span> Mark as Completed
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setConfirmModal({
                                        isOpen: true,
                                        action: 'Cancelled',
                                        booking: b,
                                        notes: '',
                                        loading: false,
                                      });
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '8px 14px',
                                      border: 'none',
                                      background: 'none',
                                      fontSize: '13px',
                                      color: '#b91c1c',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <span>✕</span> Cancel Booking
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── PAGINATION BAR (Matching Image 1 bottom format) ──────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '24px',
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            fontSize: '13px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1e293b',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>

          <div>
            {totalItems === 0
              ? '0-0 of 0'
              : `${startIndex + 1}-${endIndex} of ${totalItems}`}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{
                background: 'none',
                border: 'none',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                color: currentPage === 1 ? '#cbd5e1' : '#1e293b',
                fontSize: '16px',
                fontWeight: 700,
                padding: '4px',
              }}
              title="Previous Page"
            >
              &lt;
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              style={{
                background: 'none',
                border: 'none',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                color: currentPage >= totalPages ? '#cbd5e1' : '#1e293b',
                fontSize: '16px',
                fontWeight: 700,
                padding: '4px',
              }}
              title="Next Page"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ─── SLIDE-OUT FILTER DRAWER (Matching Image 3) ────────────────────── */}
      {showFilterDrawer && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(2px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setShowFilterDrawer(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              background: '#ffffff',
              height: '100%',
              boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                Filter
              </h3>
              <button
                onClick={() => setShowFilterDrawer(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  color: '#64748b',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Booking Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#1e293b',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Reserved">Reserved</option>
                  <option value="ReturnRequested">Return Requested</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Rental Duration
                </label>
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#1e293b',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  <option value="All">Any Duration</option>
                  <option value="1">1 Month</option>
                  <option value="2">2 Months</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                </select>
              </div>
            </div>

            {/* Drawer Footer Buttons (Image 3 Style) */}
            <div
              style={{
                padding: '20px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setDurationFilter('All');
                  setSearchQuery('');
                  setShowFilterDrawer(false);
                  setCurrentPage(1);
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f1f5f9',
                  color: '#334155',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  setShowFilterDrawer(false);
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTION CONFIRMATION MODAL ────────────────────────────────────── */}
      {confirmModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
          onClick={() => setConfirmModal({ isOpen: false, action: null, booking: null, notes: '', loading: false })}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>
              {confirmModal.action === 'Completed' ? 'Mark Booking as Completed?' : 'Cancel this Booking?'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              {confirmModal.action === 'Completed'
                ? `Completing booking #${confirmModal.booking?.id} (${confirmModal.booking?.itemTitle}) will release customer security deposit of ₹${confirmModal.booking?.securityDeposit?.toFixed(2)} and credit your payout of ₹${confirmModal.booking?.vendorPayoutAmount?.toFixed(2)}.`
                : `Cancelling booking #${confirmModal.booking?.id} will release the reserved item back to available inventory and initiate deposit refund.`}
            </p>

            {confirmModal.action === 'Completed' && confirmModal.booking?.isPaidOnline && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>💳</span>
                <span>
                  <strong>Stripe Online Payment Detected:</strong> The security deposit of ₹{confirmModal.booking?.securityDeposit?.toFixed(2)} will be automatically refunded to the customer's card via Stripe.
                </span>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Fulfillment / Return Notes (Optional)
              </label>
              <textarea
                value={confirmModal.notes}
                onChange={(e) => setConfirmModal((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Item returned in good condition, verified all accessories."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, action: null, booking: null, notes: '', loading: false })}
                disabled={confirmModal.loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>

              <button
                type="button"
                disabled={confirmModal.loading}
                onClick={() => handleUpdateStatus(confirmModal.booking.id, confirmModal.action, confirmModal.notes)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: confirmModal.action === 'Completed' ? '#1e293b' : '#b91c1c',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: confirmModal.loading ? 'not-allowed' : 'pointer',
                }}
              >
                {confirmModal.loading
                  ? 'Updating...'
                  : confirmModal.action === 'Completed'
                  ? 'Confirm Completed'
                  : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── VERIFY DELIVERY OTP MODAL ────────────────────────────────────── */}
      {otpModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
          onClick={() => setOtpModal({ isOpen: false, booking: null, otp: '', loading: false, error: '' })}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🔑</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Verify Doorstep Delivery OTP
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 18px 0', lineHeight: '1.5' }}>
              Ask the customer for the 6-digit delivery OTP shown in their app or email. Once entered, the rental lease period starts from today.
            </p>

            {otpModal.error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {otpModal.error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                6-Digit Delivery OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpModal.otp}
                onChange={(e) => setOtpModal((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                placeholder="e.g. 849201"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '22px',
                  fontWeight: 800,
                  letterSpacing: '4px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  color: '#0f172a',
                  outline: 'none',
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setOtpModal({ isOpen: false, booking: null, otp: '', loading: false, error: '' })}
                disabled={otpModal.loading}
                style={{
                  padding: '9px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={otpModal.loading}
                onClick={handleVerifyOtp}
                style={{
                  padding: '9px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#18181b',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: otpModal.loading ? 'not-allowed' : 'pointer',
                }}
              >
                {otpModal.loading ? 'Verifying...' : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RECORD OFFLINE PAYMENT MODAL ─────────────────────────────────── */}
      {offlinePayModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
          onClick={() => setOfflinePayModal({ isOpen: false, booking: null, loading: false })}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>💵</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Record Offline Monthly Payment
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 18px 0', lineHeight: '1.5' }}>
              Confirm that you have received Month {(offlinePayModal.booking?.monthsPaidCount || 1) + 1} rental fee of{' '}
              <strong style={{ color: '#0f172a' }}>₹{offlinePayModal.booking?.monthlyRent?.toFixed(2)}</strong> directly from{' '}
              <strong>{offlinePayModal.booking?.customerName}</strong> via cash, UPI, or other offline method.
            </p>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                padding: '14px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Booking Reference:</span>
                <span style={{ fontWeight: 700 }}>{offlinePayModal.booking?.bookingReference}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Monthly Rent:</span>
                <span style={{ fontWeight: 700 }}>₹{offlinePayModal.booking?.monthlyRent?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Payment Cycle:</span>
                <span style={{ fontWeight: 700 }}>
                  Month {(offlinePayModal.booking?.monthsPaidCount || 1) + 1} of {offlinePayModal.booking?.rentalDurationMonths}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setOfflinePayModal({ isOpen: false, booking: null, loading: false })}
                disabled={offlinePayModal.loading}
                style={{
                  padding: '9px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={offlinePayModal.loading}
                onClick={handleRecordOfflinePayment}
                style={{
                  padding: '9px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: offlinePayModal.loading ? 'not-allowed' : 'pointer',
                }}
              >
                {offlinePayModal.loading ? 'Recording...' : 'Confirm Payment Received'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PHYSICAL RETURN & DEPOSIT RELEASE MODAL ───────────────────────── */}
      {returnInspectModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
          onClick={() => setReturnInspectModal({ isOpen: false, booking: null, notes: '', loading: false, error: '' })}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🛡</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Physical Inspection & Security Deposit Release
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              Verify that you have physically inspected the returned equipment. Confirming will automatically refund the security deposit of{' '}
              <strong style={{ color: '#0f172a' }}>₹{returnInspectModal.booking?.securityDeposit?.toFixed(2)}</strong> back to the customer's card via Stripe and restore 1 unit back to your available inventory.
            </p>

            {returnInspectModal.error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {returnInspectModal.error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Physical Inspection Notes
              </label>
              <textarea
                rows={3}
                value={returnInspectModal.notes}
                onChange={(e) => setReturnInspectModal((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Item physically inspected at pickup. Excellent condition, complete accessories."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setReturnInspectModal({ isOpen: false, booking: null, notes: '', loading: false, error: '' })}
                disabled={returnInspectModal.loading}
                style={{
                  padding: '9px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={returnInspectModal.loading}
                onClick={handleReturnAndReleaseDeposit}
                style={{
                  padding: '9px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#047857',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: returnInspectModal.loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {returnInspectModal.loading ? 'Releasing...' : '✓ Confirm & Release Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
