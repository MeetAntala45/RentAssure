import React, { useState, useEffect } from 'react';
import { customerApi } from '../../../../src/shared/api';

const CustomerCatalogPage = ({ selectedCity = 'All', onRequireAuth = () => {} }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState(3);
  const [rentSuccessMsg, setRentSuccessMsg] = useState('');

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCity !== 'All') params.city = selectedCity;
      if (selectedCategorySlug !== 'all') params.categorySlug = selectedCategorySlug;
      if (search) params.search = search;

      const res = await customerApi.getItems(params);
      if (res.data?.items) {
        setItems(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await customerApi.getCategories();
        if (res.data) setCategories(res.data);
      } catch {
        // fallback
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [selectedCity, selectedCategorySlug]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCatalog();
  };

  const calculateRent = (baseMonthly, months) => {
    if (months === 12) return Math.round(baseMonthly * 0.8);
    if (months === 6) return Math.round(baseMonthly * 0.9);
    return Math.round(baseMonthly);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2.5vw, 24px)' }}>
      {/* ─── HERO HEADER ─────────────────────────────────────────────────── */}
      <div
        className="ra-card"
        style={{
          marginBottom: '28px',
          background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
          color: '#ffffff',
          padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 36px)',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.15)',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            <span>✨</span> Authorized Merchant Inventory
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: '10px' }}>
            Flexible Rentals from Verified Local Stores
          </h1>
          <p style={{ fontSize: 'clamp(13px, 2vw, 15px)', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '20px' }}>
            Subscribe monthly to brand-name furniture, home appliances, and equipment. Free delivery & setup, zero long-term commitment.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="ra-input"
              style={{ background: '#ffffff', color: 'var(--text-main)', border: 'none', padding: '12px 18px', flex: '1 1 220px' }}
              placeholder="Search sofas, refrigerators, standing desks, cameras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="ra-btn"
              style={{ background: 'var(--primary)', color: '#ffffff', padding: '12px 24px', fontWeight: 700, flexShrink: 0 }}
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ─── CATEGORY FILTER PILLS ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
        <button
          className={`ra-btn ${selectedCategorySlug === 'all' ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
          onClick={() => setSelectedCategorySlug('all')}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`ra-btn ${selectedCategorySlug === cat.slug ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
            onClick={() => setSelectedCategorySlug(cat.slug)}
          >
            {cat.icon || '🏷️'} {cat.name}
          </button>
        ))}
      </div>

      {/* ─── PRODUCT CATALOG GRID ────────────────────────────────────────── */}
      {loading ? (
        <div className="ra-card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading verified rental listings...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="ra-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            No rental products found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Try adjusting your search keyword or selected city.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '24px',
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="ra-card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
              }}
              onClick={() => {
                setSelectedItem(item);
                setSelectedMonths(item.minimumRentalMonths || 3);
                setRentSuccessMsg('');
              }}
            >
              {/* Product Thumbnail */}
              <div
                style={{
                  height: '190px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: '#f1f5f9',
                  position: 'relative',
                  marginBottom: '14px',
                }}
              >
                <img
                  src={
                    item.images?.[0] ||
                    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=500&q=80'
                  }
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {item.categoryName}
                </span>
              </div>

              {/* Title & Merchant Details */}
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', lineHeight: 1.3 }}>
                {item.title}
              </h3>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Store: <strong>{item.vendorStoreName || 'Verified Merchant'}</strong> • {item.city}
              </div>

              {/* Price & Rent Button */}
              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                    ${item.monthlyRent}{' '}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      / mo
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                    Deposit: ${item.securityDeposit}
                  </div>
                </div>

                <button
                  className="ra-btn ra-btn-primary ra-btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(item);
                    setSelectedMonths(item.minimumRentalMonths || 3);
                    setRentSuccessMsg('');
                  }}
                >
                  Rent Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── ITEM RENTAL MODAL ───────────────────────────────────────────── */}
      {selectedItem && (
        <div className="ra-modal-backdrop">
          <div className="ra-modal-dialog" style={{ maxWidth: '640px' }}>
            <div className="ra-modal-header">
              <h3 className="ra-modal-title">{selectedItem.title}</h3>
              <button className="ra-modal-close" onClick={() => setSelectedItem(null)}>
                ✕
              </button>
            </div>

            <div className="ra-modal-body">
              {rentSuccessMsg ? (
                <div
                  style={{
                    background: 'var(--success-bg)',
                    color: 'var(--success-text)',
                    padding: '24px',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
                    Rental Order Reserved!
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
                    Your subscription order has been routed to <strong>{selectedItem.vendorStoreName}</strong>. The merchant will coordinate doorstep delivery and professional assembly.
                  </p>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="ra-btn ra-btn-primary"
                    style={{ marginTop: '16px' }}
                  >
                    Back to Catalog
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      height: '240px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      marginBottom: '18px',
                    }}
                  >
                    <img
                      src={
                        selectedItem.images?.[0] ||
                        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={selectedItem.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {selectedItem.description}
                  </p>

                  {/* Rental Tenure Pricing Tiers */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                      Choose Rental Tenure Plan
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '10px' }}>
                      {[3, 6, 12].map((m) => {
                        const rate = calculateRent(selectedItem.monthlyRent, m);
                        const isSelected = selectedMonths === m;
                        return (
                          <div
                            key={m}
                            onClick={() => setSelectedMonths(m)}
                            style={{
                              border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
                              background: isSelected ? 'var(--primary-light)' : '#ffffff',
                              borderRadius: 'var(--radius-md)',
                              padding: '12px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                              {m} Months
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>
                              ${rate} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ mo</span>
                            </div>
                            {m === 12 && (
                              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--success-text)', background: 'var(--success-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                                Save 20%
                              </span>
                            )}
                            {m === 6 && (
                              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--success-text)', background: 'var(--success-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                                Save 10%
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Monthly Rent:</span>
                      <strong style={{ color: 'var(--text-main)' }}>
                        ${calculateRent(selectedItem.monthlyRent, selectedMonths)} / mo
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Refundable Security Deposit:</span>
                      <strong style={{ color: 'var(--text-main)' }}>${selectedItem.securityDeposit}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Merchant Partner:</span>
                      <strong>{selectedItem.vendorStoreName} ({selectedItem.city})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Total Due Today:</span>
                      <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>
                        ${calculateRent(selectedItem.monthlyRent, selectedMonths) + selectedItem.securityDeposit}
                      </strong>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!rentSuccessMsg && (
              <div className="ra-modal-footer">
                <button className="ra-btn ra-btn-secondary" onClick={() => setSelectedItem(null)}>
                  Close
                </button>
                <button
                  className="ra-btn ra-btn-primary"
                  onClick={() => {
                    setRentSuccessMsg('Reserved successfully!');
                  }}
                >
                  Confirm & Subscribe (${calculateRent(selectedItem.monthlyRent, selectedMonths) + selectedItem.securityDeposit})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCatalogPage;
