import React, { useState, useEffect } from 'react';
import { vendorApi } from '../../../../src/shared/api';

export default function VendorEarningsPage({ onNavigateToBookings }) {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [minAmountFilter, setMinAmountFilter] = useState('');
  const [maxAmountFilter, setMaxAmountFilter] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Pagination states (matching reference Image 1)
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 3-dot menu tracking
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Detail Modal for selected payout
  const [selectedPayout, setSelectedPayout] = useState(null);

  const fetchEarnings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vendorApi.getEarnings();
      if (res.isSuccess && res.data) {
        setEarningsData(res.data);
      } else {
        setEarningsData(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load earnings ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  // Close 3-dot menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.ra-earnings-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const getPayoutBadge = (statusStr) => {
    const status = (statusStr || '').toLowerCase();
    let dotColor = '#22c55e';
    let textColor = '#15803d';
    let label = statusStr || 'Unknown';

    if (status.includes('settled') || status.includes('released')) {
      dotColor = '#22c55e';
      textColor = '#15803d';
      label = 'Settled & Released';
    } else if (status.includes('escrow') || status.includes('held')) {
      dotColor = '#3b82f6';
      textColor = '#1d4ed8';
      label = 'Held in Escrow';
    } else if (status.includes('cancelled') || status.includes('void')) {
      dotColor = '#94a3b8';
      textColor = '#475569';
      label = 'Cancelled / Void';
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

  const allPayouts = earningsData?.payouts || [];

  // Filter logic
  const filteredPayouts = allPayouts.filter((item) => {
    const matchesSearch =
      (item.bookingReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.itemTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Settled' && item.payoutStatus.toLowerCase().includes('settled')) ||
      (statusFilter === 'Escrow' && item.payoutStatus.toLowerCase().includes('escrow')) ||
      (statusFilter === 'Cancelled' && item.payoutStatus.toLowerCase().includes('cancelled'));

    const min = parseFloat(minAmountFilter);
    const max = parseFloat(maxAmountFilter);
    const matchesMin = isNaN(min) || item.netPayout >= min;
    const matchesMax = isNaN(max) || item.netPayout <= max;

    return matchesSearch && matchesStatus && matchesMin && matchesMax;
  });

  // Pagination logic
  const totalItems = filteredPayouts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = filteredPayouts.slice(startIndex, endIndex);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px', fontFamily: 'inherit' }}>
      {/* ─── HEADER BAR ──────────────────────────────────────────────────────── */}
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: '0 0 4px 0' }}>
            Payouts & Earnings
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Real-time financial breakdown, escrow disbursements, and transaction payout ledger.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={fetchEarnings}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#1e293b',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* ─── ERROR STATE ────────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* ─── 4 SUMMARY CARDS (Grey Monochromatic Theme) ─────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* Card 1: Total Net Earnings */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Total Net Earnings</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#15803d',
                background: '#dcfce7',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              Settled
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
            ₹{earningsData ? earningsData.totalNetEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Disbursed to merchant account ({earningsData?.completedBookingsCount || 0} completed rentals)
          </div>
        </div>

        {/* Card 2: Pending Escrow Payouts */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Pending Escrow Payouts</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#1d4ed8',
                background: '#dbeafe',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              In Escrow
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
            ₹{earningsData ? earningsData.pendingEscrowPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Releases upon completion ({earningsData?.activeBookingsCount || 0} ongoing rentals)
          </div>
        </div>

        {/* Card 3: Escrow Deposits Held */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Escrow Deposits Held</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#475569',
                background: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              Protection
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
            ₹{earningsData ? earningsData.escrowDepositsHeld.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Safeguarded customer security deposits
          </div>
        </div>

        {/* Card 4: Platform Facilitation Cut */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Platform Commission Paid</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {earningsData?.commissionRate || 10}% Fee
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#475569', marginTop: '10px' }}>
            ₹{earningsData ? earningsData.totalCommissionPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Automated marketplace matching & dispute escrow
          </div>
        </div>
      </div>

      {/* ─── TABLE FILTER & SEARCH CONTROLS ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Status Quick Pills */}
          {[
            { id: 'All', label: 'All Payouts' },
            { id: 'Settled', label: 'Settled & Released' },
            { id: 'Escrow', label: 'Held in Escrow' },
            { id: 'Cancelled', label: 'Cancelled / Void' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                border: statusFilter === tab.id ? '1px solid #1e293b' : '1px solid #e2e8f0',
                background: statusFilter === tab.id ? '#1e293b' : '#ffffff',
                color: statusFilter === tab.id ? '#ffffff' : '#475569',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by reference, customer, item..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              color: '#1e293b',
              width: '260px',
              outline: 'none',
              background: '#ffffff',
            }}
          />

          {/* Slide Drawer Trigger (Matching Image 1) */}
          <button
            onClick={() => setShowFilterDrawer(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: minAmountFilter || maxAmountFilter ? '#e2e8f0' : '#ffffff',
              color: '#1e293b',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>⚡</span> Filter
            {(minAmountFilter || maxAmountFilter) && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  display: 'inline-block',
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* ─── PAYOUT SETTLEMENT LEDGER TABLE (Matches Image 1 Layout) ────────── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading settlement ledger...
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
              No settlement transactions found
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {searchQuery || statusFilter !== 'All' || minAmountFilter || maxAmountFilter
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'Payout transactions will appear here as bookings are placed.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b', width: '110px' }}>
                    Reference <span style={{ fontSize: '10px', color: '#94a3b8' }}>⇅</span>
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Customer <span style={{ fontSize: '10px', color: '#94a3b8' }}>⇅</span>
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Rental Item
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Gross Rent <span style={{ fontSize: '10px', color: '#94a3b8' }}>⇅</span>
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Fee ({earningsData?.commissionRate || 10}%)
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Net Payout <span style={{ fontSize: '10px', color: '#94a3b8' }}>⇅</span>
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Payout Status
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b' }}>
                    Date <span style={{ fontSize: '10px', color: '#94a3b8' }}>⇅</span>
                  </th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, color: '#64748b', textAlign: 'center', width: '60px' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => {
                  const dateStr = item.date
                    ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—';

                  return (
                    <tr
                      key={item.bookingId}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                      onClick={() => setSelectedPayout(item)}
                    >
                      <td style={{ padding: '16px 18px', fontWeight: 700, color: '#1e293b' }}>
                        {item.bookingReference}
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.customerName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{item.customerEmail}</div>
                      </td>

                      <td style={{ padding: '16px 18px', color: '#334155', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.itemTitle}
                      </td>

                      <td style={{ padding: '16px 18px', color: '#334155' }}>
                        ₹{item.grossRent.toFixed(2)}
                      </td>

                      <td style={{ padding: '16px 18px', color: '#64748b' }}>
                        -₹{item.platformFee.toFixed(2)}
                      </td>

                      <td style={{ padding: '16px 18px', fontWeight: 800, color: '#0f172a' }}>
                        ₹{item.netPayout.toFixed(2)}
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        {getPayoutBadge(item.payoutStatus)}
                      </td>

                      <td style={{ padding: '16px 18px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

                      <td
                        style={{ padding: '16px 18px', textAlign: 'center', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="ra-earnings-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === item.bookingId ? null : item.bookingId)}
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

                          {activeMenuId === item.bookingId && (
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
                                minWidth: '180px',
                                padding: '6px 0',
                                textAlign: 'left',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setSelectedPayout(item);
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
                                <span>🧾</span> View Breakdown
                              </button>

                              {onNavigateToBookings && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onNavigateToBookings(item.bookingId);
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
                                  <span>📅</span> View Booking
                                </button>
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
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                Filter Payouts
              </h2>
              <button
                onClick={() => setShowFilterDrawer(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Content Form Controls */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Payout Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#1e293b',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Settled">Settled & Released</option>
                  <option value="Escrow">Held in Escrow</option>
                  <option value="Cancelled">Cancelled / Void</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Min Net Payout (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={minAmountFilter}
                  onChange={(e) => setMinAmountFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#1e293b',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Max Net Payout (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={maxAmountFilter}
                  onChange={(e) => setMaxAmountFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#1e293b',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Footer Buttons (Matches Image 3) */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setStatusFilter('All');
                  setMinAmountFilter('');
                  setMaxAmountFilter('');
                  setShowFilterDrawer(false);
                  setCurrentPage(1);
                }}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setShowFilterDrawer(false);
                }}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#1e293b',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PAYOUT BREAKDOWN MODAL ────────────────────────────────────────── */}
      {selectedPayout && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedPayout(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  Settlement Breakdown
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Reference: {selectedPayout.bookingReference}
                </span>
              </div>
              <button
                onClick={() => setSelectedPayout(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '2px' }}>
                  Rental Item
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  {selectedPayout.itemTitle}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  Customer: <strong>{selectedPayout.customerName}</strong> ({selectedPayout.customerEmail})
                </div>
              </div>

              {/* Breakdown Ledger Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>Gross Rental Volume</span>
                  <span style={{ fontWeight: 600 }}>₹{selectedPayout.grossRent.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>Refundable Security Deposit (Escrow)</span>
                  <span style={{ fontWeight: 600 }}>₹{selectedPayout.securityDeposit.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                  <span>Platform Commission ({earningsData?.commissionRate || 10}%)</span>
                  <span style={{ fontWeight: 600 }}>-₹{selectedPayout.platformFee.toFixed(2)}</span>
                </div>

                <div
                  style={{
                    borderTop: '2px dashed #e2e8f0',
                    paddingTop: '12px',
                    marginTop: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Net Vendor Payout
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    ₹{selectedPayout.netPayout.toFixed(2)}
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  padding: '12px',
                  borderRadius: '8px',
                  background:
                    selectedPayout.payoutStatus.toLowerCase().includes('settled')
                      ? '#f0fdf4'
                      : '#f8fafc',
                  border:
                    selectedPayout.payoutStatus.toLowerCase().includes('settled')
                      ? '1px solid #bbf7d0'
                      : '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '13px', color: '#334155' }}>Settlement State:</span>
                {getPayoutBadge(selectedPayout.payoutStatus)}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setSelectedPayout(null)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#1e293b',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
