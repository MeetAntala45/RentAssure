import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../../../src/shared/api';

const AdminVendorsPage = ({ onSelectVendor = () => {} }) => {
  const [vendors, setVendors] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterTier, setFilterTier] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const statusParam = filterStatus === 'All' ? null : filterStatus;
      const res = await adminApi.getVendors(statusParam, search || null, 1, 100);
      if (res.data?.items) {
        setVendors(res.data.items);
      } else if (Array.isArray(res.data)) {
        setVendors(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVendors();
  };

  // Filter vendors by Tier locally if selected
  const filteredVendors = useMemo(() => {
    if (filterTier === 'All') return vendors;
    return vendors.filter((v) => (v.tier || 'Bronze').toLowerCase() === filterTier.toLowerCase());
  }, [vendors, filterTier]);

  // Aggregate scorecard metrics
  const scorecardStats = useMemo(() => {
    const total = vendors.length;
    const goldCount = vendors.filter((v) => (v.tier || '').toLowerCase() === 'gold').length;
    const silverCount = vendors.filter((v) => (v.tier || '').toLowerCase() === 'silver').length;
    const bronzeCount = vendors.filter((v) => !v.tier || (v.tier || '').toLowerCase() === 'bronze').length;

    const avgOnTime =
      total > 0
        ? (vendors.reduce((sum, v) => sum + (Number(v.onTimeDeliveryRate) || 98.0), 0) / total).toFixed(1)
        : '98.5';

    const avgDispute =
      total > 0
        ? (vendors.reduce((sum, v) => sum + (Number(v.disputeRate) || 0), 0) / total).toFixed(1)
        : '0.8';

    return { total, goldCount, silverCount, bronzeCount, avgOnTime, avgDispute };
  }, [vendors]);

  const getStatusBadge = (status) => {
    if (status === 'Approved' || status === 1) {
      return (
        <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
          ✔ Approved
        </span>
      );
    }
    if (status === 'PendingApproval' || status === 0) {
      return (
        <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
          ⏳ Pending Review
        </span>
      );
    }
    if (status === 'Rejected' || status === 2) {
      return (
        <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          ✖ Rejected
        </span>
      );
    }
    return <span className="ra-badge">{status}</span>;
  };

  const renderTierBadge = (tier, badge) => {
    const t = (tier || 'Bronze').toLowerCase();
    if (t === 'gold') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            color: '#92400e',
            border: '1.5px solid #f59e0b',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 800,
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)',
          }}
          title="Gold Tier Partner: Top SLA fulfillment and lowest dispute rate"
        >
          <span>🥇</span>
          <span>Gold Partner</span>
        </span>
      );
    }
    if (t === 'silver') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            color: '#334155',
            border: '1.5px solid #94a3b8',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 800,
            boxShadow: '0 2px 6px rgba(148, 163, 184, 0.15)',
          }}
          title="Silver Tier Partner: Reliable merchant with consistent delivery record"
        >
          <span>🥈</span>
          <span>Silver Partner</span>
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          color: '#9a3412',
          border: '1.5px solid #fdba74',
          padding: '3px 10px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 800,
        }}
        title="Bronze Tier Partner: New merchant partner or standard fulfillment probation"
      >
        <span>🥉</span>
        <span>Bronze Partner</span>
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ─── 1. SCORECARD METRICS HERO ─────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #033047 0%, #304C62 100%)',
          borderRadius: '18px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(3, 48, 71, 0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#cbd5e1' }}>
                Merchant Governance & Trust Framework
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Merchant Performance Scorecards & Partner Tiering
            </h2>
          </div>
          <span style={{ fontSize: '12px', background: 'rgba(255, 255, 255, 0.12)', padding: '5px 12px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            Real-Time SLA Engine Active
          </span>
        </div>

        {/* 5 KPI Metric Tiles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
          }}
        >
          {/* Gold */}
          <div
            onClick={() => setFilterTier(filterTier === 'gold' ? 'All' : 'gold')}
            style={{
              background: filterTier === 'gold' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: filterTier === 'gold' ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#fef3c7', fontWeight: 700 }}>🥇 Gold Partners</span>
              <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.3)', color: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                8% Fee
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#fbbf24' }}>
              {scorecardStats.goldCount} Stores
            </div>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>≥ 95% On-Time & ≤ 2% Disputes</span>
          </div>

          {/* Silver */}
          <div
            onClick={() => setFilterTier(filterTier === 'silver' ? 'All' : 'silver')}
            style={{
              background: filterTier === 'silver' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: filterTier === 'silver' ? '2px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 700 }}>🥈 Silver Partners</span>
              <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', padding: '2px 6px', borderRadius: '4px' }}>
                10% Fee
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#f1f5f9' }}>
              {scorecardStats.silverCount} Stores
            </div>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>≥ 90% On-Time & Standard SLA</span>
          </div>

          {/* Bronze */}
          <div
            onClick={() => setFilterTier(filterTier === 'bronze' ? 'All' : 'bronze')}
            style={{
              background: filterTier === 'bronze' ? 'rgba(217, 119, 6, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: filterTier === 'bronze' ? '2px solid #ea580c' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#ffedd5', fontWeight: 700 }}>🥉 Bronze Partners</span>
              <span style={{ fontSize: '10px', background: 'rgba(234, 88, 12, 0.3)', color: '#fed7aa', padding: '2px 6px', borderRadius: '4px' }}>
                Standard
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#fdba74' }}>
              {scorecardStats.bronzeCount} Stores
            </div>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>New or Probationary Status</span>
          </div>

          {/* Avg On-Time SLA */}
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '14px 16px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>Network On-Time SLA</span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#86efac' }}>
              {scorecardStats.avgOnTime}%
            </div>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Target ≥ 95.0% threshold</span>
          </div>

          {/* Avg Dispute Rate */}
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '14px 16px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>Avg Escrow Dispute Rate</span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#e0f2fe' }}>
              {scorecardStats.avgDispute}%
            </div>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Target ≤ 2.5% platform limit</span>
          </div>
        </div>
      </div>

      {/* ─── 2. SEARCH & DUAL FILTER CONTROLS ──────────────────────────────── */}
      <div className="ra-card" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
            {['All', 'PendingApproval', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                className={`ra-btn ${filterStatus === status ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
                onClick={() => setFilterStatus(status)}
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                {status === 'PendingApproval' ? 'Pending Approval' : status}
              </button>
            ))}
          </div>

          {/* Tier Quick Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Tier:</span>
            <button
              className={`ra-btn ${filterTier === 'All' ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
              onClick={() => setFilterTier('All')}
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              All Tiers
            </button>
            <button
              className={`ra-btn ${filterTier === 'gold' ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
              onClick={() => setFilterTier('gold')}
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              🥇 Gold
            </button>
            <button
              className={`ra-btn ${filterTier === 'silver' ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
              onClick={() => setFilterTier('silver')}
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              🥈 Silver
            </button>
            <button
              className={`ra-btn ${filterTier === 'bronze' ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
              onClick={() => setFilterTier('bronze')}
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              🥉 Bronze
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 240px', maxWidth: '340px' }}>
            <input
              type="text"
              className="ra-input"
              style={{ flex: 1, padding: '7px 12px', fontSize: '13px' }}
              placeholder="Search partner or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="ra-btn ra-btn-secondary ra-btn-sm" style={{ padding: '7px 14px', flexShrink: 0 }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ─── 3. PARTNERS & SCORECARD TABLE ─────────────────────────────────── */}
      <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="ra-table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  PARTNER / STORE
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  PARTNER TIER & SCORE
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  ON-TIME SLA
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  DISPUTE RATE
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  ACTIVE INVENTORY
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  LOCATION
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  COMMISSION BRACKET
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading partner scorecard data...
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No partners found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const onTime = Number(vendor.onTimeDeliveryRate) || 98.0;
                  const dispute = Number(vendor.disputeRate) || 0.0;
                  const score = Number(vendor.performanceScore) || 85.0;
                  const activeStock = vendor.activeInventoryCount !== undefined ? vendor.activeInventoryCount : vendor.totalItemsCount || 0;
                  const comm = vendor.commissionRateOverride !== null && vendor.commissionRateOverride !== undefined
                    ? `${Number(vendor.commissionRateOverride).toFixed(1)}% (Custom)`
                    : vendor.tier?.toLowerCase() === 'gold' ? '8.0% (Gold Pref)' : '12.0% (Standard)';

                  return (
                    <tr
                      key={vendor.id}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => onSelectVendor(vendor.id)}
                    >
                      {/* Store & Owner */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: 'var(--primary-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              border: '1px solid var(--border-light)',
                              flexShrink: 0,
                            }}
                          >
                            🏪
                          </div>
                          <div>
                            <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>
                              {vendor.storeName || 'Merchant Store'}
                            </strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Owner: {vendor.ownerName} • ID #{vendor.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tier & Score */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div>{renderTierBadge(vendor.tier, vendor.tierBadge)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '60px',
                                height: '5px',
                                background: '#e2e8f0',
                                borderRadius: '9999px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, score)}%`,
                                  height: '100%',
                                  background: score >= 85 ? '#f59e0b' : score >= 70 ? '#3b82f6' : '#94a3b8',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-main)' }}>
                              {score}/100
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* On-Time SLA */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: onTime >= 95 ? '#065f46' : '#b45309' }}>
                            {onTime}%
                          </span>
                          {onTime >= 95 ? (
                            <span style={{ fontSize: '10px', color: '#065f46', background: '#ecfdf5', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              ✓ Optimal
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#b45309', background: '#fffbeb', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              Watch
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dispute Rate */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: dispute <= 2.5 ? '#065f46' : '#b91c1c' }}>
                            {dispute}%
                          </span>
                          {dispute === 0 ? (
                            <span style={{ fontSize: '10px', color: '#065f46', background: '#ecfdf5', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              Zero
                            </span>
                          ) : dispute <= 2.5 ? (
                            <span style={{ fontSize: '10px', color: '#065f46', background: '#ecfdf5', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              Low
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#b91c1c', background: '#fef2f2', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              High
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Active Inventory */}
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                        📦 {activeStock} listings
                      </td>

                      {/* City */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-body)' }}>
                          📍 {vendor.city || 'Ahmedabad'}
                        </span>
                      </td>

                      {/* Commission Bracket */}
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: vendor.tier?.toLowerCase() === 'gold' ? '#fef3c7' : 'var(--primary-light)',
                            color: vendor.tier?.toLowerCase() === 'gold' ? '#92400e' : 'var(--primary)',
                            border: `1px solid ${vendor.tier?.toLowerCase() === 'gold' ? '#fde68a' : 'var(--color-light-blue-border)'}`,
                          }}
                        >
                          {comm}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="ra-btn ra-btn-secondary ra-btn-sm"
                          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVendor(vendor.id);
                          }}
                        >
                          View Scorecard →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminVendorsPage;
