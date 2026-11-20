import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../src/shared/api';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getBookings({ pageSize: 100 });
      if (res.isSuccess) {
        const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setBookings(items);
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

  const filteredBookings = bookings.filter((b) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (b.bookingReference || '').toLowerCase().includes(s) ||
      (b.customerName || '').toLowerCase().includes(s) ||
      (b.customerEmail || '').toLowerCase().includes(s) ||
      (b.vendorStoreName || '').toLowerCase().includes(s) ||
      (b.itemTitle || '').toLowerCase().includes(s);

    const statusStr = String(b.status || '').toLowerCase();
    const matchesStatus =
      statusFilter === 'All' || statusStr === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // KPI Metrics Calculation
  const totalBookingsCount = bookings.length;
  const activeRentalsCount = bookings.filter((b) => {
    const s = String(b.status || '').toLowerCase();
    return s === 'active' || s === 'reserved' || s === 'returnrequested';
  }).length;

  const totalEscrowHeld = bookings
    .filter((b) => String(b.depositStatus || '').toLowerCase() === 'held' || b.depositStatus === 1)
    .reduce((sum, b) => sum + (Number(b.securityDeposit) || 0), 0);

  const totalPlatformCut = bookings
    .filter((b) => String(b.status || '').toLowerCase() !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.platformCommissionAmount) || 0), 0);

  const getStatusBadge = (statusVal) => {
    const s = String(statusVal || '').toLowerCase();
    let bg = '#f4f4f5';
    let text = '#18181b';
    let label = statusVal || 'Unknown';

    if (s === 'active' || s === '3') {
      bg = '#f0fdf4';
      text = '#166534';
      label = 'Active';
    } else if (s === 'reserved' || s === '1') {
      bg = '#fefce8';
      text = '#854d0e';
      label = 'Reserved (OTP)';
    } else if (s === 'returnrequested' || s === '4') {
      bg = '#fff7ed';
      text = '#9a3412';
      label = 'Return Requested';
    } else if (s === 'completed' || s === '6') {
      bg = '#f0fdf4';
      text = '#15803d';
      label = 'Completed';
    } else if (s === 'cancelled' || s === '7') {
      bg = '#fef2f2';
      text = '#991b1b';
      label = 'Cancelled';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '9999px',
          background: bg,
          color: text,
          fontSize: '12px',
          fontWeight: 700,
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: text }} />
        {label}
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
            Booking & Rental Management
          </h1>
          <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>
            Supervise all customer equipment bookings, physical deliveries, billing cycles, and escrow deposits across merchants.
          </p>
        </div>

        <button
          onClick={fetchBookings}
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
          <span>{loading ? 'Refreshing...' : 'Refresh Bookings'}</span>
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
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL PLATFORM BOOKINGS</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
            {totalBookingsCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>All-time customer orders</div>
        </div>

        <div className="ra-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>ACTIVE LEASES ONGOING</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#166534', marginTop: '8px' }}>
            {activeRentalsCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Currently in customer possession</div>
        </div>

        <div className="ra-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0369a1' }}>SECURITY DEPOSIT IN ESCROW</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0369a1', marginTop: '8px' }}>
            ₹{totalEscrowHeld.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Safeguarded until return verified</div>
        </div>

        <div className="ra-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>ADMIN COMMISSION CUT</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#4f46e5', marginTop: '8px' }}>
            ₹{totalPlatformCut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Net platform revenue collected</div>
        </div>
      </div>

      {/* ─── FILTERS & SEARCH BAR ─────────────────────────────────────────── */}
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
          {['All', 'Reserved', 'Active', 'ReturnRequested', 'Completed', 'Cancelled'].map((st) => (
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
              {st === 'All' ? 'All Bookings' : st === 'ReturnRequested' ? 'Return Scheduled' : st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <input
            type="text"
            placeholder="Search by ref, customer, store, item..."
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
            Loading platform bookings...
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#b91c1c' }}>
            {error}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No bookings found matching current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>REF & BOOKING ID</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>CUSTOMER</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>MERCHANT / STORE</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>RENTAL ITEM & TENURE</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>MONTHLY RENT</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>SECURITY DEPOSIT</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>PLATFORM FEE</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569' }}>STATUS</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>#{b.id}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{b.bookingReference}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{b.customerName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{b.customerEmail}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.vendorStoreName}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.itemTitle}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {b.rentalDurationMonths} Months Tenure
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#1e293b' }}>
                      ₹{Number(b.monthlyRent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, color: '#0369a1' }}>
                        ₹{Number(b.securityDeposit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: b.stripeRefundId ? '#15803d' : '#64748b', marginTop: '2px' }}>
                        {b.stripeRefundId ? '✓ Refunded' : 'Held in Escrow'}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#4f46e5' }}>
                        ₹{Number(b.platformCommissionAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        ({b.commissionRateApplied || 15}%)
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>{getStatusBadge(b.status)}</td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="ra-btn ra-btn-secondary ra-btn-sm"
                        style={{ fontSize: '12px', padding: '6px 12px', fontWeight: 700 }}
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── FULL BOOKING INSPECTION MODAL ─────────────────────────────────── */}
      {selectedBooking && (
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
          onClick={() => setSelectedBooking(null)}
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
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Booking #{selectedBooking.id}
                  </h3>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', fontWeight: 700, color: '#475569' }}>
                    {selectedBooking.bookingReference}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Equipment Rental: <strong>{selectedBooking.itemTitle}</strong>
                </div>
              </div>

              <div>{getStatusBadge(selectedBooking.status)}</div>
            </div>

            {/* Profile Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                fontSize: '13px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CUSTOMER</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedBooking.customerName}</div>
                <div style={{ color: '#475569', fontSize: '12px' }}>{selectedBooking.customerEmail}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>MERCHANT / STORE</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedBooking.vendorStoreName}</div>
                <div style={{ color: '#475569', fontSize: '12px' }}>Vendor ID: #{selectedBooking.vendorId}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>DELIVERY ADDRESS</div>
                <div style={{ fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                  {selectedBooking.deliveryAddress || 'Not specified'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>DOORSTEP OTP STATUS</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  OTP: <code>{selectedBooking.deliveryOtp || 'N/A'}</code>
                </div>
                <div style={{ fontSize: '11px', color: selectedBooking.isDeliveryVerified ? '#15803d' : '#854d0e' }}>
                  {selectedBooking.isDeliveryVerified ? '✓ Verified on Delivery' : '⏳ Awaiting Doorstep Verification'}
                </div>
              </div>
            </div>

            {/* Financial & Escrow Overview */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                Financial & Escrow Settlement
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                }}
              >
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Monthly Rent</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>
                    ₹{Number(selectedBooking.monthlyRent || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#0369a1' }}>Security Deposit</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0369a1', marginTop: '4px' }}>
                    ₹{Number(selectedBooking.securityDeposit || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#4f46e5' }}>Admin Cut</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>
                    ₹{Number(selectedBooking.platformCommissionAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#166534' }}>Vendor Payout</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
                    ₹{Number(selectedBooking.vendorPayoutAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Online Stripe Details */}
            {selectedBooking.stripePaymentIntentId && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                  marginBottom: '20px',
                  fontSize: '12px',
                  color: '#166534',
                }}
              >
                <div>
                  <strong>Stripe Online Payment Intent:</strong> <code>{selectedBooking.stripePaymentIntentId}</code>
                </div>
                {selectedBooking.stripeRefundId && (
                  <div style={{ marginTop: '4px' }}>
                    <strong>Stripe Security Deposit Refund ID:</strong> <code>{selectedBooking.stripeRefundId}</code>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="ra-btn ra-btn-secondary"
                style={{ padding: '8px 20px', fontWeight: 700 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
