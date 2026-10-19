import React, { useState, useEffect, useMemo } from 'react';
import { vendorApi } from '../../../../src/shared/api';
import RentalItemFormModal from '../components/RentalItemFormModal';

const STATUS_MAP = {
  1: { label: 'Available', badgeClass: 'ra-badge-active', color: '#18181b', bg: '#f4f4f5' },
  2: { label: 'Rented', badgeClass: 'ra-badge-verified', color: '#27272a', bg: '#f4f4f5' },
  3: { label: 'Under Maintenance', badgeClass: 'ra-badge-pending', color: '#52525b', bg: '#f4f4f5' },
  4: { label: 'Inactive', badgeClass: 'ra-badge-rejected', color: '#71717a', bg: '#f4f4f5' },
};

const VendorInventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [modalConfig, setModalConfig] = useState({ isOpen: false, itemToEdit: null });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getInventory();
      if (res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    const total = items.length;
    const available = items.filter((i) => i.status === 1).length;
    const rented = items.filter((i) => i.status === 2).length;
    const maintenance = items.filter((i) => i.status === 3 || i.status === 4).length;
    const totalMonthlyValue = items.reduce((acc, curr) => acc + (parseFloat(curr.monthlyRent) || 0), 0);
    const estimatedMonthlyNetProfit = Math.round(totalMonthlyValue * 0.88 * 100) / 100;

    return { total, available, rented, maintenance, totalMonthlyValue, estimatedMonthlyNetProfit };
  }, [items]);

  // Unique Categories for Filter
  const categoriesList = useMemo(() => {
    const cats = new Set(items.map((i) => i.categoryName).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const brandMatch = item.brand?.toLowerCase().includes(query);
        const categoryMatch = item.categoryName?.toLowerCase().includes(query);
        const cityMatch = item.city?.toLowerCase().includes(query);
        if (!titleMatch && !brandMatch && !categoryMatch && !cityMatch) return false;
      }

      // Category
      if (selectedCategory !== 'All' && item.categoryName !== selectedCategory) {
        return false;
      }

      // Status
      if (selectedStatus !== 'All') {
        const numStatus = parseInt(selectedStatus, 10);
        if (item.status !== numStatus) return false;
      }

      return true;
    });
  }, [items, searchTerm, selectedCategory, selectedStatus]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to remove '${title}' from active catalog listings?`)) return;
    try {
      await vendorApi.deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete listing.');
    }
  };

  const handleOpenAddModal = () => {
    setModalConfig({ isOpen: true, itemToEdit: null });
  };

  const handleOpenEditModal = (item) => {
    setModalConfig({ isOpen: true, itemToEdit: item });
  };

  const handleItemSaved = (savedItem, isEdit) => {
    if (isEdit) {
      setItems((prev) => prev.map((i) => (i.id === savedItem.id ? savedItem : i)));
    } else {
      setItems((prev) => [savedItem, ...prev]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ─── 1. PAGE HEADER & QUICK ACTION ──────────────────────────────── */}
      <div
        className="ra-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
              Rental Inventory Catalog
            </h2>
            <span className="ra-badge ra-badge-verified">
              {items.length} Total Listings
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage rental items, monthly prices, security deposits, and upload photos. Real-time updates sync to Customer Catalog (Port 5173).
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="ra-btn ra-btn-primary"
          style={{ boxShadow: '0 4px 12px var(--primary-shadow)' }}
        >
          <span style={{ fontSize: '16px' }}>+</span> Add Rental Product
        </button>
      </div>

      {/* ─── 2. INVENTORY SUMMARY STRIP ──────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
        }}
      >
        <div className="ra-card" style={{ padding: '16px', borderLeft: '4px solid #18181b' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>All Catalog Listings</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#18181b', marginTop: '4px' }}>
            {summary.total}
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
            {categoriesList.length - 1} Active Categories
          </div>
        </div>

        <div className="ra-card" style={{ padding: '16px', borderLeft: '4px solid #27272a' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Live & Available</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#27272a', marginTop: '4px' }}>
            {summary.available}
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
            Ready for customer bookings
          </div>
        </div>

        <div className="ra-card" style={{ padding: '16px', borderLeft: '4px solid #3f3f46' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Currently Rented</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#3f3f46', marginTop: '4px' }}>
            {summary.rented}
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
            Generating recurring rent
          </div>
        </div>

        <div className="ra-card" style={{ padding: '16px', borderLeft: '4px solid #52525b' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Under Service / Inactive</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#52525b', marginTop: '4px' }}>
            {summary.maintenance}
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
            Maintenance or hidden
          </div>
        </div>

        <div className="ra-card" style={{ padding: '16px', borderLeft: '4px solid #71717a' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Catalog Monthly Potential</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#18181b', marginTop: '4px' }}>
            ${summary.totalMonthlyValue.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
            Est. Net Profit: ${summary.estimatedMonthlyNetProfit.toLocaleString()} / mo
          </div>
        </div>
      </div>

      {/* ─── 3. SEARCH & FILTER CONTROLS ─────────────────────────────────── */}
      <div
        className="ra-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px', minWidth: '220px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
                fontSize: '14px',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by product name, brand, model, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ra-input"
              style={{ paddingLeft: '34px', height: '38px', fontSize: '13px' }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Category:</span>
            <select
              className="ra-select"
              style={{ height: '38px', fontSize: '13px', width: 'auto', minWidth: '150px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categoriesList.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="ra-select"
              style={{ height: '38px', fontSize: '13px', width: 'auto', minWidth: '140px' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="1">Available</option>
              <option value="2">Rented</option>
              <option value="3">Under Maintenance</option>
              <option value="4">Inactive</option>
            </select>
          </div>

          {(searchTerm || selectedCategory !== 'All' || selectedStatus !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedStatus('All');
              }}
              className="ra-btn ra-btn-secondary ra-btn-sm"
              style={{ height: '38px' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ─── 4. ITEMS TABLE (HIGH-DENSITY & RESPONSIVE) ───────────────────── */}
      <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="ra-table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  PRODUCT ITEM
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  CATEGORY
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  MONTHLY RENT (NET)
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  SECURITY DEPOSIT
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  MIN. TENURE
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  STATUS
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading rental inventory...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📦</div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                      {items.length === 0 ? 'No rental products added yet' : 'No items match your filters'}
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', maxWidth: '400px', margin: '0 auto 16px' }}>
                      {items.length === 0
                        ? 'Add furniture, electronics, or appliances from your physical store to start earning monthly rent.'
                        : 'Try searching with a different keyword or resetting your category and status filters.'}
                    </p>
                    {items.length === 0 ? (
                      <button onClick={handleOpenAddModal} className="ra-btn ra-btn-primary ra-btn-sm">
                        + Add Your First Rental Item
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory('All');
                          setSelectedStatus('All');
                        }}
                        className="ra-btn ra-btn-secondary ra-btn-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const statusInfo = STATUS_MAP[item.status] || STATUS_MAP[1];
                  const rent = parseFloat(item.monthlyRent) || 0;
                  const netProfit = Math.round(rent * 0.88 * 100) / 100;
                  const thumb = item.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=140&q=80';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fcfdfe'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Product Thumbnail & Details */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              position: 'relative',
                              width: '56px',
                              height: '56px',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                              background: '#f1f5f9',
                              flexShrink: 0,
                              border: '1px solid var(--border-light)',
                            }}
                          >
                            <img
                              src={thumb}
                              alt={item.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {item.images?.length > 1 && (
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: 2,
                                  right: 2,
                                  background: 'rgba(0,0,0,0.65)',
                                  color: '#fff',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  padding: '1px 3px',
                                  borderRadius: '3px',
                                }}
                              >
                                {item.images.length}📸
                              </span>
                            )}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: 'var(--text-main)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '280px',
                              }}
                              title={item.title}
                            >
                              {item.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              <span>{item.brand || 'RentAssure'}</span>
                              {item.model ? ` • ${item.model}` : ''}
                              {item.city ? ` • 📍 ${item.city}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-body)' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            background: '#f1f5f9',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--text-body)',
                          }}
                        >
                          {item.categoryName || 'General'}
                        </span>
                      </td>

                      {/* Monthly Rent & Net Profit */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                          ${rent.toFixed(2)}
                          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}> / mo</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#18181b', fontWeight: 700, marginTop: '1px' }}>
                          Net Profit: ${netProfit.toFixed(2)}
                        </div>
                      </td>

                      {/* Security Deposit */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-body)' }}>
                          ${item.securityDeposit}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                          Escrow Deposit
                        </div>
                      </td>

                      {/* Min. Tenure */}
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-body)' }}>
                        {item.minimumRentalMonths || 3} months
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          className="ra-badge"
                          style={{
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.color}33`,
                            fontSize: '11px',
                          }}
                        >
                          ● {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="ra-btn ra-btn-secondary ra-btn-sm"
                            style={{
                              borderColor: 'var(--primary-light)',
                              color: 'var(--primary)',
                              fontWeight: 700,
                            }}
                            title="Edit Item Details, Pricing & Photos"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            className="ra-btn ra-btn-secondary ra-btn-sm"
                            style={{ color: 'var(--danger-text)' }}
                            title="Delete or Deactivate Listing"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 5. DUAL-MODE MODAL (ADD / EDIT) ──────────────────────────────── */}
      <RentalItemFormModal
        isOpen={modalConfig.isOpen}
        itemToEdit={modalConfig.itemToEdit}
        onClose={() => setModalConfig({ isOpen: false, itemToEdit: null })}
        onItemSaved={handleItemSaved}
      />
    </div>
  );
};

export default VendorInventoryPage;
