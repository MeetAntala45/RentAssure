import React, { useState } from 'react';

export default function CustomerItemDetailPage({
  item,
  onBack,
  onProceedToCheckout,
  onRequireAuth,
  user,
}) {
  if (!item) {
    return (
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>No item selected.</p>
        <button onClick={onBack} className="ra-btn ra-btn-primary" style={{ marginTop: '16px' }}>
          ← Back to Catalog
        </button>
      </div>
    );
  }

  const [selectedMonths, setSelectedMonths] = useState(
    Math.max(item.minimumRentalMonths || 1, 3)
  );

  const images = Array.isArray(item.images) && item.images.length > 0
    ? item.images
    : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80'];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Calculate pricing based on selected tenure
  const baseRent = Number(item.monthlyRent) || 0;
  const deposit = Number(item.securityDeposit) || (baseRent * 3);
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

  const initialTotal = activeMonthlyRent + deposit;
  const isAvailable = (item.availableQuantity ?? 1) > 0 && item.status !== 'Rented';

  const handleCheckoutClick = () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    onProceedToCheckout(selectedMonths);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* ─── Breadcrumb Navigation ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--primary)',
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

      {/* ─── Main Two-Column Layout ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(360px, 1fr)',
          gap: '36px',
          alignItems: 'start',
        }}
        className="ra-detail-grid"
      >
        {/* ─── LEFT: Images & Specifications ─── */}
        <div>
          {/* Main Showcase Image */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
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
                border: `1px solid ${isAvailable ? '#bbf7d0' : '#fecaca'}`,
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
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: activeImageIndex === idx ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    padding: 0,
                    background: '#ffffff',
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
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              marginTop: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px 0' }}>
              Item Details & Condition
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              {item.description || 'Quality-inspected rental item maintained in clean, ready-to-deliver condition.'}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-light)',
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
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '20px 24px',
              marginTop: '16px',
              boxShadow: 'var(--shadow-sm)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>🚚</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Free Doorstep Delivery</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹0 Delivery fee on all tenures</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>100% Held Escrow Deposit</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Refunded via Stripe upon return</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>🔑</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>OTP Verified Delivery</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tenure starts from delivery day</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Pricing & Tenure Checkout Box ─── */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '28px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* Title & Merchant */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
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

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '16px 0' }} />

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
                    border: '1px solid #bbf7d0',
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
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                Select Rental Tenure
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {/* 3 Months */}
                <button
                  type="button"
                  onClick={() => setSelectedMonths(3)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: selectedMonths === 3 ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    background: selectedMonths === 3 ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700, color: selectedMonths === 3 ? 'var(--primary)' : 'var(--text-main)' }}>
                    3 Mos
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Standard
                  </div>
                </button>

                {/* 6 Months */}
                <button
                  type="button"
                  onClick={() => setSelectedMonths(6)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: selectedMonths === 6 ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    background: selectedMonths === 6 ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700, color: selectedMonths === 6 ? 'var(--primary)' : 'var(--text-main)' }}>
                    6 Mos
                  </div>
                  <div style={{ fontSize: '11px', color: d6 > 0 ? '#166534' : 'var(--text-muted)', marginTop: '2px', fontWeight: d6 > 0 ? 700 : 500 }}>
                    {d6 > 0 ? `-${d6}% Off` : 'Flexible'}
                  </div>
                </button>

                {/* 12 Months */}
                <button
                  type="button"
                  onClick={() => setSelectedMonths(12)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: selectedMonths === 12 ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    background: selectedMonths === 12 ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700, color: selectedMonths === 12 ? 'var(--primary)' : 'var(--text-main)' }}>
                    12 Mos
                  </div>
                  <div style={{ fontSize: '11px', color: d12 > 0 ? '#166534' : 'var(--text-muted)', marginTop: '2px', fontWeight: d12 > 0 ? 700 : 500 }}>
                    {d12 > 0 ? `-${d12}% Best Value` : 'Long Term'}
                  </div>
                </button>
              </div>
            </div>

            {/* Price Breakdown Details */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-body)', marginBottom: '8px' }}>
                <span>1st Month Rent ({selectedMonths} mo tenure)</span>
                <span>₹{activeMonthlyRent.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-body)', marginBottom: '8px' }}>
                <span>Refundable Security Deposit</span>
                <span>₹{deposit.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#166534', fontWeight: 600, marginBottom: '8px' }}>
                <span>Doorstep Delivery & Assembly</span>
                <span>FREE (₹0)</span>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-light)', margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                <span>Due Today at Checkout</span>
                <span>₹{initialTotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Includes Month 1 rent + 100% refundable security deposit. Subsequent rent is due monthly from verified delivery date.
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
                fontSize: '15px',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                opacity: isAvailable ? 1 : 0.6,
              }}
            >
              {isAvailable ? 'Proceed to Checkout →' : 'Currently Out of Stock'}
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
