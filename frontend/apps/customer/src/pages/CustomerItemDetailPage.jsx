import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { customerApi } from '../../../../src/shared/api';

export default function CustomerItemDetailPage({
  item: propItem,
  onBack,
  onProceedToCheckout,
  onRequireAuth,
  user,
}) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [fetchedItem, setFetchedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const item = propItem || location.state?.item || fetchedItem;

  // Fallback fetch if opened via direct URL or reload
  useEffect(() => {
    const targetId = params.id;
    if (!propItem && !location.state?.item && targetId) {
      setLoading(true);
      customerApi.getItemById(targetId)
        .then((res) => {
          if (res?.data) {
            setFetchedItem(res.data);
          } else {
            setError('Item not found.');
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load item details.');
        })
        .finally(() => setLoading(false));
    }
  }, [params.id, propItem, location.state]);

  const [selectedMonths, setSelectedMonths] = useState(
    item?.minimumRentalMonths ? Math.max(item.minimumRentalMonths, 3) : 3
  );

  useEffect(() => {
    if (item?.minimumRentalMonths) {
      setSelectedMonths((prev) => Math.max(item.minimumRentalMonths, prev || 3));
    }
  }, [item]);

  const maxAvailable = Math.max(1, item?.availableQuantity ?? 1);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const images = Array.isArray(item?.images) && item.images.length > 0
    ? item.images
    : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80'];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="ra-page-container" style={{ margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Loading rental item details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="ra-page-container" style={{ margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>{error || 'No item selected.'}</p>
        <button onClick={handleBack} className="ra-btn ra-btn-primary" style={{ marginTop: '16px' }}>
          ← Back to Catalog
        </button>
      </div>
    );
  }

  // Calculate pricing based on selected tenure
  const baseRent = Number(item.monthlyRent) || 0;
  const unitDeposit = Number(item.securityDeposit) || (baseRent * 3);
  const d6 = Number(item.discount6MonthsPercent) || 0;
  const d12 = Number(item.discount12MonthsPercent) || 0;

  let activeMonthlyRent = baseRent;
  let activeDiscountPercent = 0;

  if (selectedMonths >= 12 && d12 > 0) {
    activeDiscountPercent = d12;
    activeMonthlyRent = Math.round(baseRent * (1 - d12 / 100));
  } else if (selectedMonths >= 6 && d6 > 0) {
    activeDiscountPercent = d6;
    activeMonthlyRent = Math.round(baseRent * (1 - d6 / 100));
  }

  const isAvailable = (item.availableQuantity ?? 1) > 0 && item.status !== 'Rented';

  const handleQuantityChange = (delta) => {
    setSelectedQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxAvailable) return maxAvailable;
      return next;
    });
  };

  const totalMonthlyRent = activeMonthlyRent * selectedQuantity;
  const totalDeposit = unitDeposit * selectedQuantity;
  const initialTotal = totalMonthlyRent + totalDeposit;

  const handleCheckoutClick = () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (onProceedToCheckout) {
      onProceedToCheckout(selectedMonths, selectedQuantity, item);
    } else {
      navigate(`/checkout/${item.id}?months=${selectedMonths}&quantity=${selectedQuantity}`, {
        state: { item, selectedMonths, selectedQuantity },
      });
    }
  };

  return (
    <div className="ra-page-container" style={{ padding: '24px 20px 80px 20px' }}>
      {/* ─── Breadcrumb Navigation ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--text-main)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>←</span> Back to Catalog
        </button>
        <span>/</span>
        <span>{item.categoryName || 'Rental Products'}</span>
        <span>/</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.title}</span>
      </div>

      {/* ─── Main Two-Column Layout (Fluid & Responsive) ─── */}
      <div className="ra-detail-grid">
        {/* ─── LEFT: Images & Specifications ─── */}
        <div>
          {/* Main Showcase Image */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
              aspectRatio: '16 / 10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={images[activeImageIndex]}
              alt={item.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 0.2s ease',
              }}
            />
            {/* Stock pill */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                padding: '6px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                background: isAvailable ? 'rgba(240, 253, 244, 0.95)' : 'rgba(254, 242, 242, 0.95)',
                color: isAvailable ? '#166534' : '#991b1b',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{isAvailable ? '●' : '✕'}</span>
              <span>{isAvailable ? `${item.availableQuantity ?? 1} Units Available` : 'Currently Rented'}</span>
            </div>
          </div>

          {/* Thumbnails row */}
          {images.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '14px',
                overflowX: 'auto',
                paddingBottom: '4px',
              }}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: '76px',
                    height: '60px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: 'none',
                    boxShadow: activeImageIndex === idx ? '0 0 0 2px #18181b' : 'none',
                    padding: 0,
                    background: '#f4f4f5',
                    cursor: 'pointer',
                    flexShrink: 0,
                    opacity: activeImageIndex === idx ? 1 : 0.65,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}

          {/* Specifications Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              marginTop: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 14px 0' }}>
              Item Details & Condition
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              {item.description || 'Quality-inspected rental item maintained in clean, ready-to-deliver condition.'}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(0,0,0,0.04)',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Brand
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {item.brand || 'Verified Standard'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Model / Variant
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {item.model || 'Standard Edition'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Condition
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {item.condition || 'Brand New'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Store Location
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  📍 {item.vendorCity || item.city || 'Local Store Hub'}
                </span>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px 24px',
              marginTop: '16px',
              boxShadow: 'var(--shadow-sm)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '22px' }}>🚚</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Free Doorstep Delivery</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹0 Delivery fee on all tenures</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '22px' }}>🛡️</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>100% Held Escrow Deposit</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Refunded via Stripe upon return</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '22px' }}>🔑</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>OTP Verified Delivery</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tenure starts from delivery day</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Pricing & Tenure Checkout Box ─── */}
        <div className="ra-detail-sticky-pane">
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* Title & Merchant */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                {item.categoryName || 'Product'}
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                {item.title}
              </h1>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Store:</span>
                <strong style={{ color: 'var(--text-main)' }}>{item.vendorStoreName || 'Certified Merchant'}</strong>
                <span>•</span>
                <span>★ 4.9</span>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '16px 0' }} />

            {/* Monthly Price Highlight */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)' }}>
                ₹{activeMonthlyRent.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ month</span>
              {activeDiscountPercent > 0 && (
                <span
                  style={{
                    background: '#f0fdf4',
                    color: '#166534',
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  Save {activeDiscountPercent}%
                </span>
              )}
            </div>

            {/* Tenure Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Select Rental Tenure
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {/* 3 Months */}
                <button
                  type="button"
                  onClick={() => setSelectedMonths(3)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: selectedMonths === 3 ? '#18181b' : '#f4f4f5',
                    color: selectedMonths === 3 ? '#ffffff' : 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    3 Mos
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                    Standard
                  </div>
                </button>

                {/* 6 Months */}
                <button
                  type="button"
                  onClick={() => setSelectedMonths(6)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: selectedMonths === 6 ? '#18181b' : '#f4f4f5',
                    color: selectedMonths === 6 ? '#ffffff' : 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    6 Mos
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                    {d6 > 0 ? `-${d6}% Off` : 'Flexible'}
                  </div>
                </button>

                {/* 12 Months */}
                <button
                  type="button"
                  onClick={() => setSelectedMonths(12)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: selectedMonths === 12 ? '#18181b' : '#f4f4f5',
                    color: selectedMonths === 12 ? '#ffffff' : 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    12 Mos
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                    {d12 > 0 ? `-${d12}% Value` : 'Long Term'}
                  </div>
                </button>
              </div>
            </div>

            {/* Rental Quantity Selector (Capped at item.availableQuantity) */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Rental Quantity
                </label>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {item.availableQuantity ?? 1} unit(s) available in stock
                </span>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '10px',
                  background: '#f4f4f5',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={selectedQuantity <= 1 || !isAvailable}
                  style={{
                    width: '42px',
                    height: '40px',
                    border: 'none',
                    background: selectedQuantity <= 1 ? '#e4e4e7' : '#f4f4f5',
                    color: selectedQuantity <= 1 ? 'var(--text-light)' : 'var(--text-main)',
                    fontSize: '18px',
                    fontWeight: 700,
                    cursor: selectedQuantity <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease',
                  }}
                  title="Decrease quantity"
                >
                  −
                </button>

                <div
                  style={{
                    minWidth: '54px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    padding: '0 12px',
                    lineHeight: '40px',
                    userSelect: 'none',
                  }}
                >
                  {selectedQuantity}
                </div>

                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={selectedQuantity >= maxAvailable || !isAvailable}
                  style={{
                    width: '42px',
                    height: '40px',
                    border: 'none',
                    background: selectedQuantity >= maxAvailable ? '#e4e4e7' : '#f4f4f5',
                    color: selectedQuantity >= maxAvailable ? 'var(--text-light)' : 'var(--text-main)',
                    fontSize: '18px',
                    fontWeight: 700,
                    cursor: selectedQuantity >= maxAvailable ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease',
                  }}
                  title="Increase quantity (capped at available quantity)"
                >
                  +
                </button>
              </div>

              {selectedQuantity >= maxAvailable && maxAvailable > 1 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Maximum available stock reached ({maxAvailable} units).
                </div>
              )}
            </div>

            {/* Price Breakdown Details */}
            <div
              style={{
                background: '#f8f8f9',
                borderRadius: '12px',
                padding: '18px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-body)', marginBottom: '8px' }}>
                <span>Month 1 Rent ({selectedMonths} mo × {selectedQuantity} {selectedQuantity === 1 ? 'unit' : 'units'})</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{totalMonthlyRent.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-body)', marginBottom: '8px' }}>
                <span>Refundable Deposit ({selectedQuantity} {selectedQuantity === 1 ? 'unit' : 'units'})</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{totalDeposit.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>Doorstep Delivery & Assembly</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>FREE (₹0)</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                <span>Due Today at Checkout</span>
                <span>₹{initialTotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                Subsequent rent is billed monthly starting strictly from your verified doorstep delivery date.
              </div>
            </div>

            {/* Proceed to Checkout Button */}
            <button
              type="button"
              disabled={!isAvailable}
              onClick={handleCheckoutClick}
              className="ra-btn ra-btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '10px',
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                opacity: isAvailable ? 1 : 0.6,
                letterSpacing: '0.2px',
              }}
            >
              {isAvailable ? `Proceed to Checkout (${selectedQuantity} ${selectedQuantity === 1 ? 'unit' : 'units'}) →` : 'Currently Out of Stock'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
              🔒 Protected by RentAssure Held Escrow Guarantee
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
