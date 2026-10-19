import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../src/shared/api';
import {
  DonutCategoryChart,
  RevenueOverviewBarChart,
  TopCitiesSplineChart,
  TopPartnersList,
} from '../../../../src/shared/DashboardCharts';
import {
  IconServices,
  IconHandHeart,
  IconUserSingle,
  IconWrench,
  IconCurrency,
} from '../../../../src/shared/Icons';

const AdminDashboardPage = ({ onNavigateToVendors = () => {} }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminApi.getDashboard();
        if (res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatStatNumber = (val, fallback = '0') => {
    if (val === undefined || val === null) return fallback;
    const num = parseFloat(val);
    if (isNaN(num)) return String(val);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`.replace('.0M', 'M');
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`.replace('.0k', 'k');
    return num.toLocaleString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ─── PAGE TITLE & SUBTITLE ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px', margin: 0 }}>
            Platform Overview & Operations Console
          </p>
        </div>

        {stats?.pendingApprovalsCount > 0 && (
          <button
            onClick={onNavigateToVendors}
            className="ra-btn"
            style={{
              background: '#18181b',
              color: '#ffffff',
              fontWeight: 700,
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            Review Store Applications ({stats.pendingApprovalsCount}) →
          </button>
        )}
      </div>

      {/* ─── 4 TOP KPI CARDS FOR RENTASSURE ADMIN ─────────────────────── */}
      <div className="ra-kpi-grid">
        {/* Card 1: Active Subscriptions */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-info">
              <div className="ra-kpi-value">
                {stats?.activeRentalsCount !== undefined
                  ? stats.activeRentalsCount.toLocaleString()
                  : '0'}
              </div>
              <div className="ra-kpi-label">Active Subscriptions</div>
            </div>
            <div className="ra-kpi-icon-badge" style={{ background: '#18181b' }}>
              <IconServices width={24} height={24} stroke="#ffffff" />
            </div>
          </div>
          <div className="ra-kpi-bottom">
            <span className="ra-kpi-trend" style={{ background: '#f4f4f5', color: '#18181b', border: '1px solid #d4d4d8' }}>Live</span>
            <span className="ra-kpi-trend-subtext">Active Leases</span>
          </div>
        </div>

        {/* Card 2: Registered Renters */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-info">
              <div className="ra-kpi-value">
                {stats?.totalCustomersCount !== undefined
                  ? stats.totalCustomersCount.toLocaleString()
                  : '0'}
              </div>
              <div className="ra-kpi-label">Registered Renters</div>
            </div>
            <div className="ra-kpi-icon-badge" style={{ background: '#27272a' }}>
              <IconUserSingle width={24} height={24} stroke="#ffffff" />
            </div>
          </div>
          <div className="ra-kpi-bottom">
            <span className="ra-kpi-trend" style={{ background: '#f4f4f5', color: '#18181b', border: '1px solid #d4d4d8' }}>Platform</span>
            <span className="ra-kpi-trend-subtext">Customer Base</span>
          </div>
        </div>

        {/* Card 3: Verified Merchants */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-info">
              <div className="ra-kpi-value">
                {stats?.approvedVendorsCount !== undefined
                  ? stats.approvedVendorsCount.toLocaleString()
                  : '0'}
              </div>
              <div className="ra-kpi-label">Verified Merchants</div>
            </div>
            <div className="ra-kpi-icon-badge" style={{ background: '#3f3f46' }}>
              <IconWrench width={24} height={24} stroke="#ffffff" />
            </div>
          </div>
          <div className="ra-kpi-bottom">
            <span className="ra-kpi-trend" style={{ background: '#f4f4f5', color: '#18181b', border: '1px solid #d4d4d8' }}>
              {stats?.totalVendorsCount || 0} Total
            </span>
            <span className="ra-kpi-trend-subtext">Store Partners</span>
          </div>
        </div>

        {/* Card 4: Gross Platform Volume */}
        <div className="ra-kpi-card">
          <div className="ra-kpi-top">
            <div className="ra-kpi-info">
              <div className="ra-kpi-value">
                ${stats?.totalGrossVolume !== undefined ? Math.round(stats.totalGrossVolume).toLocaleString() : '0'}
              </div>
              <div className="ra-kpi-label">Gross Platform Volume</div>
            </div>
            <div className="ra-kpi-icon-badge" style={{ background: '#52525b' }}>
              <IconCurrency width={24} height={24} stroke="#ffffff" />
            </div>
          </div>
          <div className="ra-kpi-bottom">
            <span className="ra-kpi-trend" style={{ background: '#f4f4f5', color: '#18181b', border: '1px solid #d4d4d8' }}>
              ${stats?.platformCommissionEarned !== undefined ? Math.round(stats.platformCommissionEarned).toLocaleString() : '0'}
            </span>
            <span className="ra-kpi-trend-subtext">Marketplace Commission</span>
          </div>
        </div>
      </div>

      {/* ─── MIDDLE ROW: DONUT & REVENUE BAR CHART ───────────────────────── */}
      <div className="ra-charts-grid">
        <DonutCategoryChart
          data={stats?.categoryDistribution || []}
          title="Marketplace Category Share"
          subText="Items Listed"
        />

        <RevenueOverviewBarChart
          trends={stats?.monthlyTrends || []}
          title="Gross Rental Trends (Last 6 Months)"
        />
      </div>

      {/* ─── BOTTOM ROW: SPLINE LINE & TOP PARTNERS LIST ─────────────────── */}
      <div className="ra-charts-grid">
        <TopCitiesSplineChart
          cities={stats?.topCities || []}
          title="Rental Volume by Metro Area"
        />

        <TopPartnersList
          partners={stats?.topPartners || []}
          onViewAll={onNavigateToVendors}
        />
      </div>

      {/* ─── RECENT BOOKINGS & AUDIT OVERVIEW ────────────────────────────── */}
      {stats?.recentBookings && stats.recentBookings.length > 0 && (
        <div className="ra-card" style={{ marginTop: '24px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="ra-card-title">Recent Customer Rentals</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing latest {stats.recentBookings.length} bookings
            </span>
          </div>
          <div className="ra-table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>REFERENCE</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>CUSTOMER</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>STORE</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>ITEM</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>MONTHLY RENT</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                      {b.bookingReference}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {b.customerName}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-body)' }}>
                      {b.vendorStoreName}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-body)' }}>
                      {b.itemTitle}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                      ${b.monthlyRent}/mo
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`ra-badge ${b.status === 'Active' || b.status === 'Delivered' ? 'ra-badge-active' : 'ra-badge-pending'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
