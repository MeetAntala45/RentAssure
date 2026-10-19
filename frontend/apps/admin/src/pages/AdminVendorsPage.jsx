import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../src/shared/api';

const AdminVendorsPage = ({ onSelectVendor = () => {} }) => {
  const [vendors, setVendors] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const statusParam = filterStatus === 'All' ? null : filterStatus;
      const res = await adminApi.getVendors(statusParam, search || null);
      if (res.data?.items) {
        setVendors(res.data.items);
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

  const getStatusBadge = (status) => {
    if (status === 'Approved') return <span className="ra-badge ra-badge-active">✔ Approved</span>;
    if (status === 'PendingApproval') return <span className="ra-badge ra-badge-pending">⏳ Pending Verification</span>;
    if (status === 'Rejected') return <span className="ra-badge ra-badge-rejected">✖ Rejected</span>;
    return <span className="ra-badge">{status}</span>;
  };

  return (
    <div>
      {/* Search & Filter Header */}
      <div className="ra-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', 'PendingApproval', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                className={`ra-btn ${filterStatus === status ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'PendingApproval' ? 'Pending Approval' : status}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 240px', maxWidth: '360px', width: '100%' }}>
            <input
              type="text"
              className="ra-input"
              style={{ flex: 1, minWidth: '150px', padding: '8px 14px' }}
              placeholder="Search partner by name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="ra-btn ra-btn-secondary ra-btn-sm" style={{ flexShrink: 0 }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Vendors Table Card */}
      <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="ra-table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>ID</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>SERVICE PARTNER / STORE</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>OWNER</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>LOCATION</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading service partners...
                </td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No partners found matching the selected filter.
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onClick={() => onSelectVendor(vendor.id)}
                >
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    #{vendor.id}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {vendor.storeName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {vendor.supportEmail || vendor.userEmail || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-body)' }}>
                    {vendor.ownerName}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-body)' }}>
                    {vendor.city}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {getStatusBadge(vendor.status)}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button
                      className="ra-btn ra-btn-secondary ra-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVendor(vendor.id);
                      }}
                    >
                      View Details →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default AdminVendorsPage;
