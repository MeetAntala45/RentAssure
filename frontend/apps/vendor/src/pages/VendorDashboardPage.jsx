import React, { useState, useEffect } from 'react';
import { vendorApi } from '../../../../src/shared/api';
import {
  RevenueOverviewBarChart,
} from '../../../../src/shared/DashboardCharts';
import {
  IconCurrency,
  IconTrendingUp,
  IconDiamond,
  IconServices,
  IconShield,
  IconDashboard,
  IconTruck,
} from '../../../../src/shared/Icons';
import RentalItemFormModal from '../components/RentalItemFormModal';

const VendorDashboardPage = ({
  onNavigateToInventory = () => {},
  onNavigateToBookings = () => {},
  onNavigateToEarnings = () => {},
}) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, itemToEdit: null });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getDashboard();
      if (res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load vendor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleOpenAddModal = () => {
    setModalConfig({ isOpen: true, itemToEdit: null });
  };

  const handleOpenEditModal = (item) => {
    setModalConfig({ isOpen: true, itemToEdit: item });
  };

  const handleItemSaved = () => {
    fetchDashboard();
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ─── 1. PAGE HEADER: STORE BRAND & ACTIONS ────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#033047',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {metrics?.storeName || 'Merchant Store'}
          </h1>
          {metrics?.ownerName && (
            <p style={{ fontSize: '13.5px', color: '#5C677D', marginTop: '3px', margin: 0, fontWeight: 600 }}>
              {metrics.ownerName}
            </p>
          )}
        </div>

        <div>
          <button
            onClick={fetchDashboard}
            title="Refresh Data"
            className="ra-btn"
            style={{
              background: '#ffffff',
              color: '#033047',
              border: '1px solid #D9D9D9',
              padding: '9px 14px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{loading ? '...' : '⟳'}</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── 2. 5-METRIC KPI GRID IN REFERENCE CARD STYLE ─────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        {/* KPI 1: Net Profit (Take-Home) */}
        <div
          className="ra-kpi-card"
          onClick={onNavigateToEarnings}
          style={{ cursor: 'pointer' }}
          title="Click to view Payouts & Earnings"
        >
          <div className="ra-kpi-top">
            <div className="ra-kpi-info">
              <div className="ra-kpi-value">
                {metrics ? formatCurrency(metrics.totalEarnings) : '₹0.00'}
              </div>
              <div className="ra-kpi-label">Total Store Net Profit ↗</div>
            </div>
            <div className="ra-kpi-icon-badge" style={{ background: '#033047', boxShadow: '0 4px 12px rgba(3, 48, 71, 0.22)' }}>
              <IconCurrency width={24} height={24} stroke="#ffffff" />
            </div>
          </div>
          <div className="ra-kpi-bottom">
            <span className="ra-kpi-trend" style={{ background: '#e8f1f5', color: '#033047', border: '1px solid #bfd4e4' }}>
              +{metrics?.profitMargin || 88}% Margin
            </span>
            <span className="ra-kpi-trend-subtext">Take-Home Disbursed</span>
          </div>
        </div>

        {/* KPI 2: Gross Rental Turnover */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-info">
              <div className="ra-kpi-value">
                {metrics ? formatCurrency(metrics.totalGrossRevenue) : '₹0.00'}
              </div>
              <div className="ra-kpi-label">Gross Rental Turnover</div>
            </div>
            <div className="ra-kpi-icon-badge" style={{ background: '#304C62', boxShadow: '0 4px 12px rgba(48, 76, 98, 0.22)' }}>
              <IconTrendingUp width={24} height={24} stroke="#ffffff" />
            </div>
          </div>
          <div className="ra-kpi-bottom">
            <span className="ra-kpi-trend" style={{ background: '#e8f1f5', color: '#304C62', border: '1px solid #bfd4e4' }}>
              Billed Volume
            </span>
            <span className="ra-kpi-trend-subtext">Customer Payments</span>
          </div>
        </div>

        {/* KPI 3: Monthly Net Recurring Profit */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-info">
              <div className="ra-kpi-value">
                {metrics ? formatCurrency(metrics.monthlyNetProfit) : '₹0.00'}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#5C677D' }}>/mo</span>
              </div>
              <div className="ra-kpi-label">Monthly Net Recurring Profit</div>
            </div>
            <div className="ra-kpi-icon-badge" style={{ background: '#5C677D', boxShadow: '0 4px 12px rgba(92, 103, 125, 0.22)' }}>
              <IconDiamond width={24} height={24} stroke="#ffffff" />
            </div>
          </div>
          <div className="ra-kpi-bottom">
            <span className="ra-kpi-trend" style={{ background: '#e8f1f5', color: '#5C677D', border: '1px solid #bfd4e4' }}>
              Recurring
            </span>
            <span className="ra-kpi-trend-subtext">Active Monthly Run-Rate</span>
          </div>
        </div>

        {/* KPI 4: Active Subscriptions */}
        <div
          className="ra-kpi-card"
          onClick={onNavigateToBookings}
          style={{ cursor: 'pointer' }}
          title="Click to view Booking Management"
        >
          <div className="ra-kpi-top">
            <div className="ra-kpi-info">
              <div className="ra-kpi-value">
                {metrics?.activeRentalsCount || 0}
              </div>
              <div className="ra-kpi-label">Active Subscriptions ↗</div>
            </div>
            <div className="ra-kpi-icon-badge" style={{ background: '#466882', boxShadow: '0 4px 12px rgba(70, 104, 130, 0.22)' }}>
              <IconServices width={24} height={24} stroke="#ffffff" />
            </div>
          </div>
          <div className="ra-kpi-bottom">
            <span className="ra-kpi-trend" style={{ background: '#e8f1f5', color: '#304C62', border: '1px solid #bfd4e4' }}>
              {metrics?.pendingDeliveriesCount || 0} Pending
            </span>
            <span className="ra-kpi-trend-subtext">Awaiting Delivery</span>
          </div>
        </div>

        {/* KPI 5: Escrow Deposits Held */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-info">
              <div className="ra-kpi-value">
                {metrics ? formatCurrency(metrics.escrowDepositsHeld) : '₹0.00'}
              </div>
              <div className="ra-kpi-label">Customer Security Escrow</div>
            </div>
            <div className="ra-kpi-icon-badge" style={{ background: '#033047', boxShadow: '0 4px 12px rgba(3, 48, 71, 0.22)' }}>
              <IconShield width={24} height={24} stroke="#ffffff" />
            </div>
          </div>
          <div className="ra-kpi-bottom">
            <span className="ra-kpi-trend" style={{ background: '#e8f1f5', color: '#033047', border: '1px solid #bfd4e4' }}>
              Secured
            </span>
            <span className="ra-kpi-trend-subtext">Damage Protection Held</span>
          </div>
        </div>
      </div>

      {/* ─── 3. TOP PROFITABLE INVENTORY ITEMS LEADERBOARD ──────────────── */}
      <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="ra-card-title" style={{ margin: 0 }}>
                Top Profitable Rental Inventory
              </h3>
              <span className="ra-badge ra-badge-active" style={{ fontSize: '11px' }}>
                Profit Leaderboard
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px', margin: 0 }}>
              Products ranked by net profit generated for your merchant store.
            </p>
          </div>

          <button
            onClick={onNavigateToInventory}
            className="ra-btn ra-btn-secondary ra-btn-sm"
            style={{ fontWeight: 700 }}
          >
            View All ({metrics?.totalListings || 0}) Items →
          </button>
        </div>

        <div className="ra-table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>RANK & ITEM</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>CATEGORY</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>MONTHLY RENT</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>RENTALS</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>GROSS REVENUE</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>NET STORE PROFIT</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {!metrics?.topProfitableItems || metrics.topProfitableItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    No rental inventory items listed yet. Click "+ Add Rental Product" to publish your first item!
                  </td>
                </tr>
              ) : (
                metrics.topProfitableItems.map((item, idx) => (
                  <tr key={item.itemId || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, width: '22px', textAlign: 'center', flexShrink: 0 }}>
                          {medals[idx] || `${idx + 1}.`}
                        </span>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#f1f5f9',
                            flexShrink: 0,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18181b', fontWeight: 700 }}>
                              📦
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                            {item.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-body)' }}>
                      <span className="ra-badge" style={{ background: '#e8f1f5', color: '#033047', border: '1px solid var(--border-light)' }}>
                        {item.categoryName}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                      ₹{item.monthlyRent}/mo
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.totalBookingsCount}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                      ₹{Math.round(item.totalGrossRevenue).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 800, color: '#033047' }}>
                      +₹{Math.round(item.totalNetProfit).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="ra-btn ra-btn-secondary ra-btn-sm"
                        style={{ fontWeight: 700 }}
                      >
                        Edit Item
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 4. RECENT STORE BOOKINGS TABLE ───────────────────────────────── */}
      {metrics?.recentBookings && metrics.recentBookings.length > 0 && (
        <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 className="ra-card-title">Recent Customer Bookings</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                Latest customer reservations for your store inventory.
              </p>
            </div>
            <span className="ra-badge ra-badge-verified">
              {metrics.recentBookings.length} Latest Orders
            </span>
          </div>

          <div className="ra-table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>BOOKING REF</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>CUSTOMER</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>RENTAL ITEM</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>MONTHLY RENT</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>EST. NET PROFIT</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>ORDER STATUS</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentBookings.map((b) => {
                  const mRent = parseFloat(b.monthlyRent) || 0;
                  const mProfit = Math.round(mRent * 0.88 * 100) / 100;

                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: '#18181b' }}>
                        {b.bookingReference}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                        {b.customerName}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#334155' }}>
                        {b.itemTitle}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        ₹{mRent}/mo
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: '#033047' }}>
                        +₹{mProfit}/mo
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          className={`ra-badge ${
                            b.status === 'Active' || b.status === 'Delivered' || b.status === 6 || b.status === 3
                              ? 'ra-badge-active'
                              : 'ra-badge-pending'
                          }`}
                        >
                          ● {b.status === 6 ? 'Delivered' : b.status === 3 ? 'Active' : String(b.status)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        {b.item && (
                          <button
                            onClick={() => handleOpenEditModal(b.item)}
                            className="ra-btn ra-btn-secondary ra-btn-sm"
                            style={{ fontWeight: 700 }}
                          >
                            Edit Item
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 5. STORE REVENUE TRENDS & ORDER LOGISTICS ─────────────────── */}
      <div className="ra-charts-grid">
        <RevenueOverviewBarChart
          trends={metrics?.monthlyTrends || []}
          title="Store Net Profit & Revenue Overview"
          defaultMetric="profit"
          showProfitOption={true}
        />

        {/* Order Logistics Card in Reference Style */}
        <div className="ra-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="ra-card-header">
            <h3 className="ra-card-title">Order Logistics & Escrow Overview</h3>
            <button
              onClick={onNavigateToInventory}
              style={{
                background: 'none',
                border: 'none',
                color: '#18181b',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Catalog Details →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18181b' }}>
                  <IconTruck width={20} height={20} stroke="#18181b" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                    Pending Dispatches
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Orders waiting for delivery
                  </div>
                </div>
              </div>
              <span className="ra-badge" style={{ background: '#f4f4f5', color: '#18181b', border: '1px solid #e4e4e7' }}>
                {metrics?.pendingDeliveriesCount || 0} Orders
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#27272a' }}>
                  <IconServices width={20} height={20} stroke="#27272a" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                    Pending Pickups & Returns
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Ended subscriptions ready for return
                  </div>
                </div>
              </div>
              <span className="ra-badge" style={{ background: '#f4f4f5', color: '#27272a', border: '1px solid #e4e4e7' }}>
                {metrics?.pendingReturnsCount || 0} Returns
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3f3f46' }}>
                  <IconShield width={20} height={20} stroke="#3f3f46" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#033047' }}>
                    Active Escrow Deposits
                  </div>
                  <div style={{ fontSize: '12px', color: '#5C677D' }}>
                    Held for potential item damages
                  </div>
                </div>
              </div>
              <span className="ra-badge" style={{ background: '#e8f1f5', color: '#033047', border: '1px solid #bfd4e4' }}>
                {metrics ? formatCurrency(metrics.escrowDepositsHeld) : '₹0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6. STORE FINANCIAL SPLIT & TAKE-HOME HEALTH (AT BOTTOM) ─────── */}
      <div className="ra-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 className="ra-card-title" style={{ margin: 0 }}>
              Store Financial Split & Take-Home Health
            </h3>
            <p style={{ fontSize: '13px', color: '#5C677D', marginTop: '3px', margin: 0 }}>
              RentAssure transparent financial model: 88% net vendor payout with automatic 12% marketplace processing.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="ra-badge ra-badge-active" style={{ fontSize: '12px' }}>
              Merchant Share: 88.0%
            </span>
            <span className="ra-badge" style={{ background: '#e8f1f5', color: '#304C62', border: '1px solid #bfd4e4', fontSize: '12px' }}>
              Fee: 12.0%
            </span>
          </div>
        </div>

        {/* 4-Column Breakdown Stats Grid (Progress bar removed as requested) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #D9D9D9',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#5C677D' }}>Merchant Net Take-Home</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#033047', marginTop: '2px' }}>
              {metrics ? formatCurrency(metrics.totalEarnings) : '₹0.00'}
            </div>
            <div style={{ fontSize: '11px', color: '#5C677D', marginTop: '2px' }}>Disbursed directly to store</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#5C677D' }}>Marketplace Fees Paid</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#304C62', marginTop: '2px' }}>
              {metrics ? formatCurrency(metrics.totalCommissionPaid) : '₹0.00'}
            </div>
            <div style={{ fontSize: '11px', color: '#5C677D', marginTop: '2px' }}>Covers payment & fraud protection</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#5C677D' }}>Customer Security Escrow</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#466882', marginTop: '2px' }}>
              {metrics ? formatCurrency(metrics.escrowDepositsHeld) : '₹0.00'}
            </div>
            <div style={{ fontSize: '11px', color: '#5C677D', marginTop: '2px' }}>Refundable on inspection</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#5C677D' }}>Current Recurring Rent</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#033047', marginTop: '2px' }}>
              {metrics ? formatCurrency(metrics.monthlyGrossRent) : '₹0.00'}/mo
            </div>
            <div style={{ fontSize: '11px', color: '#5C677D', marginTop: '2px' }}>Active monthly subscriptions</div>
          </div>
        </div>
      </div>

      {/* ─── 8. DUAL-MODE MODAL (ADD / EDIT) ──────────────────────────────── */}
      <RentalItemFormModal
        isOpen={modalConfig.isOpen}
        itemToEdit={modalConfig.itemToEdit}
        onClose={() => setModalConfig({ isOpen: false, itemToEdit: null })}
        onItemSaved={handleItemSaved}
      />
    </div>
  );
};

export default VendorDashboardPage;
