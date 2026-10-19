import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { useAdminToast } from '../context/AdminToastContext';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { showToast } = useAdminToast();

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getBookings({
        status: statusFilter ? Number(statusFilter) : undefined,
        search: searchTerm,
        page: 1,
        pageSize: 50,
      });

      if (res.isSuccess && res.data) {
        setBookings(res.data.items || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'Failed to retrieve bookings ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleOpenDetail = async (id) => {
    try {
      const res = await adminService.getBookingById(id);
      if (res.isSuccess && res.data) {
        setSelectedBooking(res.data);
        setIsModalOpen(true);
      }
    } catch {
      showToast('error', 'Error', 'Failed to fetch booking details.');
    }
  };

  const getStatusBadge = (status) => {
    // 1: Reserved, 2: Delivered, 3: Active, 4: ReturnRequested, 5: PickedUp, 6: Completed, 7: Cancelled
    switch (status) {
      case 1:
        return <span className="badge-status badge-status--pending"><span className="badge-status__dot" />Reserved</span>;
      case 2:
        return <span className="badge-status badge-status--approved"><span className="badge-status__dot" />Delivered</span>;
      case 3:
        return <span className="badge-status badge-status--active"><span className="badge-status__dot" />Active Rental</span>;
      case 4:
        return <span className="badge-status badge-status--return-requested"><span className="badge-status__dot" />Return Requested</span>;
      case 5:
        return <span className="badge-status badge-status--resolved"><span className="badge-status__dot" />Picked Up</span>;
      case 6:
        return <span className="badge-status badge-status--completed"><span className="badge-status__dot" />Completed</span>;
      case 7:
        return <span className="badge-status badge-status--cancelled"><span className="badge-status__dot" />Cancelled</span>;
      default:
        return <span>N/A</span>;
    }
  };

  const getDepositBadge = (depStatus) => {
    // 1: Held, 2: Refunded, 3: PartiallyRefunded, 4: Deducted
    switch (depStatus) {
      case 1:
        return <span style={{ color: '#fbbf24', fontWeight: 600 }}>🔒 In Escrow (Held)</span>;
      case 2:
        return <span style={{ color: '#34d399', fontWeight: 600 }}>✓ 100% Refunded</span>;
      case 3:
        return <span style={{ color: '#60a5fa', fontWeight: 600 }}>⚖️ Partial Split</span>;
      case 4:
        return <span style={{ color: '#f87171', fontWeight: 600 }}>✕ Deducted / Paid</span>;
      default:
        return <span>Held</span>;
    }
  };

  return (
    <div>
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1>Marketplace Leases & Escrow Custody</h1>
          <p>
            Monitor live customer subscriptions, automated recurring rent charges, escrow deposit custody, and Stripe Connect splits.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button onClick={fetchBookings} className="btn-admin btn-admin--secondary btn-admin--sm">
            Refresh Leases
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
            <span>All Leases</span>
            <span className="admin-tab-count">{totalCount}</span>
          </button>
          <button
            onClick={() => setStatusFilter('3')}
            className={`admin-tab ${statusFilter === '3' ? 'active' : ''}`}
          >
            <span>Active Rentals</span>
          </button>
          <button
            onClick={() => setStatusFilter('4')}
            className={`admin-tab ${statusFilter === '4' ? 'active' : ''}`}
          >
            <span>Return Requested</span>
          </button>
          <button
            onClick={() => setStatusFilter('6')}
            className={`admin-tab ${statusFilter === '6' ? 'active' : ''}`}
          >
            <span>Completed</span>
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
              placeholder="Search reference, renter, store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
            />
          </div>
          <button onClick={fetchBookings} className="btn-admin btn-admin--secondary btn-admin--sm">
            Filter
          </button>
        </div>
      </div>

      {/* ─── Bookings Table ─────────────────────────────────────────── */}
      <div className="admin-card">
        <div className="admin-card__body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
              Loading leases & escrow ledger...
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
              No rental bookings found matching criteria.
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Lease Ref</th>
                    <th>Rented Item</th>
                    <th>Customer & Delivery City</th>
                    <th>Vendor Shop</th>
                    <th>Monthly Rate</th>
                    <th>Deposit Status</th>
                    <th>Commission Split</th>
                    <th>Lease State</th>
                    <th style={{ textAlign: 'right' }}>Ledger</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong style={{ color: '#ffffff', fontSize: '0.88rem' }}>
                          {b.BookingReference}
                        </strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {b.RentalDurationMonths}-month term
                        </div>
                      </td>

                      <td>
                        <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 500 }}>
                          {b.ItemTitle}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.82rem' }}>
                          <span style={{ color: '#ffffff', fontWeight: 500 }}>{b.CustomerName}</span>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{b.DeliveryCity}</div>
                        </div>
                      </td>

                      <td>
                        <span style={{ color: 'var(--admin-accent-blue)', fontSize: '0.85rem', fontWeight: 600 }}>
                          {b.VendorStoreName}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <strong style={{ color: 'var(--admin-text-primary)' }}>₹{b.MonthlyRent.toFixed(2)}</strong>/mo
                          <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)' }}>
                            Dep: ₹{b.SecurityDeposit.toFixed(2)}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          {getDepositBadge(b.DepositStatus)}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          <div style={{ color: '#033047', fontWeight: 600 }}>
                            Fee: ₹{b.PlatformCommissionAmount.toFixed(2)} ({b.CommissionRateApplied}%)
                          </div>
                          <div style={{ color: 'var(--admin-text-secondary)', fontSize: '0.72rem' }}>
                            Vendor: ₹{b.VendorPayoutAmount.toFixed(2)}
                          </div>
                        </div>
                      </td>

                      <td>{getStatusBadge(b.Status)}</td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenDetail(b.id)}
                          className="btn-admin btn-admin--secondary btn-admin--sm"
                        >
                          View Ledger
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

      {/* ─── Booking Ledger Breakdown Modal ─────────────────────────── */}
      {isModalOpen && selectedBooking && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <h3>Lease Agreement Ledger: {selectedBooking.BookingReference}</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Created on {new Date(selectedBooking.CreatedAt).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="admin-modal__close">✕</button>
            </div>

            <div className="admin-modal__body">
              {/* Item Info */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)', borderRadius: 8, marginBottom: '1.25rem' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.95rem', display: 'block' }}>{selectedBooking.ItemTitle}</strong>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <span>Customer: <strong style={{ color: '#f8fafc' }}>{selectedBooking.CustomerName}</strong></span>
                  <span>Vendor: <strong style={{ color: '#60a5fa' }}>{selectedBooking.VendorStoreName}</strong></span>
                </div>
              </div>

              {/* Financial Split Grid */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--admin-accent-blue)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Marketplace Split Transaction Breakdown
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.85rem', background: 'var(--primary-subtle, #f0f5f9)', border: '1px solid var(--admin-border)', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)', display: 'block' }}>Total Paid by Renter</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text-primary)' }}>₹{selectedBooking.TotalAmountPaid.toFixed(2)}</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-secondary)' }}>Includes deposit + first month</span>
                </div>

                <div style={{ padding: '0.85rem', background: 'var(--primary-subtle, #f0f5f9)', border: '1px solid var(--admin-border)', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)', display: 'block' }}>Security Deposit in Escrow</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text-primary)' }}>₹{selectedBooking.SecurityDeposit.toFixed(2)}</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--admin-accent-blue)' }}>Status: {getDepositBadge(selectedBooking.DepositStatus)}</span>
                </div>

                <div style={{ padding: '0.85rem', background: 'var(--primary-subtle, #f0f5f9)', border: '1px solid var(--admin-border)', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)', display: 'block' }}>Platform Commission Retained</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-accent-blue)' }}>₹{selectedBooking.PlatformCommissionAmount.toFixed(2)}</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-secondary)' }}>Rate: {selectedBooking.CommissionRateApplied}%</span>
                </div>

                <div style={{ padding: '0.85rem', background: 'var(--primary-subtle, #f0f5f9)', border: '1px solid var(--admin-border)', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)', display: 'block' }}>Vendor Net Payout</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text-primary)' }}>₹{selectedBooking.VendorPayoutAmount.toFixed(2)}</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-secondary)' }}>Disbursed via Direct Bank / Payout</span>
                </div>
              </div>

              {/* Lease Dates */}
              <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-primary)', padding: '0.75rem', background: '#ffffff', borderRadius: 8, border: '1px solid var(--admin-border)' }}>
                <div>Lease Start Date: <strong>{new Date(selectedBooking.StartDate).toLocaleDateString()}</strong></div>
                <div>Lease Scheduled End: <strong>{new Date(selectedBooking.EndDate).toLocaleDateString()}</strong></div>
                <div>Delivery City: <strong>{selectedBooking.DeliveryCity}</strong></div>
              </div>
            </div>

            <div className="admin-modal__footer">
              <button onClick={() => setIsModalOpen(false)} className="btn-admin btn-admin--primary">
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
