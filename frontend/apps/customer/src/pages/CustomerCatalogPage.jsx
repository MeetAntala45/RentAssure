import React, { useState, useEffect, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { customerApi } from '../../../../src/shared/api';
import { useAuth } from '../../../../src/shared/AuthContext';
import StripeCardPaymentForm from '../components/StripeCardPaymentForm';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51UXcyvHQfESOezv6jhJX5Cdqg3c3FDCdBXkdGXB1iNOiFD935si4TkL0lla6NMEfaLtHNjSGzkJQgSHOF8jRd6IM00k5PTSn8w';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const FAQ_ITEMS = [
  {
    q: 'How does the held security deposit escrow work?',
    a: 'Your security deposit is never given directly to the merchant. Instead, RentAssure locks it in a regulated escrow account. Once your rental duration ends and the merchant completes the return pickup inspection, your full deposit is released automatically back to your payment account.',
  },
  {
    q: 'What if an appliance or furniture item breaks down?',
    a: 'All items rented through RentAssure include complimentary ongoing maintenance. If an issue occurs, simply submit a ticket or reach out to support, and the verified merchant will send a certified technician to repair or replace the item at zero cost.',
  },
  {
    q: 'Can I extend my rental subscription or upgrade my plan?',
    a: 'Yes! You can extend your subscription month-to-month or upgrade to longer commitments (e.g. 6 or 12 months) whenever merchants offer long-term discount savings.',
  },
  {
    q: 'How quickly is the item delivered after reserving?',
    a: 'Most items are scheduled for doorstep delivery and professional assembly within 24 to 48 hours of order confirmation across all supported cities.',
  },
];

const CustomerCatalogPage = ({
  selectedCity = 'All',
  onRequireAuth = () => {},
  onOpenMyRentals = () => {},
  onSelectItem = null,
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [loading, setLoading] = useState(true);

  // Selected Item Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState(3);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [preferredStartDate, setPreferredStartDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('escrow_online');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [rentSuccessMsg, setRentSuccessMsg] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Active FAQ accordion state
  const [openFaq, setOpenFaq] = useState(0);

  const fetchCatalog = async (overrideParams = {}) => {
    setLoading(true);
    try {
      const activeSearch = overrideParams.search !== undefined ? overrideParams.search : search;
      const activeCity = overrideParams.city !== undefined ? overrideParams.city : selectedCity;
      const activeCat = overrideParams.categorySlug !== undefined ? overrideParams.categorySlug : selectedCategorySlug;

      const params = {};
      if (activeCity && activeCity !== 'All') params.city = activeCity;
      if (activeCat && activeCat !== 'all') params.categorySlug = activeCat;
      if (activeSearch && activeSearch.trim()) params.search = activeSearch.trim();

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

  useEffect(() => {
    if (user?.phoneNumber && !deliveryPhone) {
      setDeliveryPhone(user.phoneNumber);
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCatalog({ search });
  };

  const calculateRent = (baseMonthly, months, item = null) => {
    const itm = item || selectedItem;
    if (!itm) return Math.round(baseMonthly);
    const d12 = Number(itm.discount12MonthsPercent) || 0;
    const d6 = Number(itm.discount6MonthsPercent) || 0;
    if (months >= 12 && d12 > 0) return Math.round(baseMonthly * (1 - d12 / 100));
    if (months >= 6 && d6 > 0) return Math.round(baseMonthly * (1 - d6 / 100));
    return Math.round(baseMonthly);
  };

  const handleOpenItem = (item) => {
    if (onSelectItem) {
      onSelectItem(item);
      return;
    }
    setSelectedItem(item);
    const minM = item.minimumRentalMonths || 1;
    const initialMonths = [3, 6, 12].find((m) => m >= minM) || minM;
    setSelectedMonths(initialMonths);
    setDeliveryCity(item.city || (selectedCity !== 'All' ? selectedCity : 'Ahmedabad'));
    setDeliveryAddress(user?.address || 'Flat 402, Shivalik Heights, SG Highway');
    setDeliveryPhone(user?.phoneNumber || '9876543210');
    setDeliveryPincode('380054');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setPreferredStartDate(tomorrow);
    setPaymentMethod('escrow_online');
    setDeliveryNotes('');
    setBookingError('');
    setRentSuccessMsg(null);
  };

  // Sort logic
  const sortedItems = useMemo(() => {
    const list = [...items];
    if (sortBy === 'price_asc') {
      return list.sort((a, b) => a.monthlyRent - b.monthlyRent);
    }
    if (sortBy === 'price_desc') {
      return list.sort((a, b) => b.monthlyRent - a.monthlyRent);
    }
    if (sortBy === 'tenure_asc') {
      return list.sort((a, b) => (a.minimumRentalMonths || 1) - (b.minimumRentalMonths || 1));
    }
    return list; // recommended / default
  }, [items, sortBy]);

  const handleConfirmRent = async (stripePaymentIntentId = null) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!deliveryAddress.trim()) {
      setBookingError('Please enter your street / flat delivery address.');
      return;
    }
    if (!deliveryPhone.trim() || deliveryPhone.trim().replace(/\D/g, '').length < 8) {
      setBookingError('Please provide a valid contact phone number (at least 8-10 digits) for delivery confirmation.');
      return;
    }
    if (selectedItem.status === 2 || selectedItem.status === 'Rented') {
      setBookingError('This item is currently rented out by another customer. Please choose an available item.');
      return;
    }
    if (selectedItem.status === 3 || selectedItem.status === 'Maintenance') {
      setBookingError('This item is currently undergoing maintenance and cannot be reserved.');
      return;
    }

    setSubmittingBooking(true);
    setBookingError('');
    try {
      const fullAddressParts = [deliveryAddress.trim()];
      if (deliveryPincode.trim()) fullAddressParts.push(`PIN: ${deliveryPincode.trim()}`);
      if (deliveryNotes.trim()) fullAddressParts.push(`Note: ${deliveryNotes.trim()}`);
      fullAddressParts.push(`Contact: ${deliveryPhone.trim()}`);
      const fullAddress = fullAddressParts.join(' | ');

      const res = await customerApi.createBooking({
        itemId: selectedItem.id,
        rentalDurationMonths: selectedMonths,
        deliveryAddress: fullAddress,
        deliveryCity: deliveryCity.trim() || selectedItem.city || 'Ahmedabad',
        startDate: preferredStartDate ? new Date(preferredStartDate).toISOString() : new Date().toISOString(),
        stripePaymentIntentId: stripePaymentIntentId || null,
      });
      if (res.isSuccess || res.IsSuccess) {
        const bookingData = res.data || res.Data;
        setRentSuccessMsg({
          reference: bookingData?.bookingReference || `RA-BK-${bookingData?.id || 'CONFIRMED'}`,
          deposit: Number(selectedItem.securityDeposit) || 0,
          monthlyRent: calculateRent(selectedItem.monthlyRent, selectedMonths, selectedItem),
          months: selectedMonths,
          vendorName: selectedItem.vendorStoreName,
          vendorCity: selectedItem.city,
          deliveryAddress: deliveryAddress.trim(),
          deliveryCity: deliveryCity.trim() || selectedItem.city,
          deliveryPhone: deliveryPhone.trim(),
          startDate: preferredStartDate || new Date().toISOString().split('T')[0],
          isPaidOnline: Boolean(stripePaymentIntentId),
          stripePaymentIntentId: stripePaymentIntentId,
          paymentMethod: stripePaymentIntentId
            ? 'Stripe Online Card Escrow (Paid)'
            : paymentMethod === 'escrow_online'
            ? 'Escrow Shield Online (UPI/Cards)'
            : 'Pay on Delivery (Doorstep Escrow)',
        });
        fetchCatalog();
      } else {
        setBookingError(res.message || res.Message || 'Failed to complete subscription booking.');
      }
    } catch (err) {
      setBookingError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        'Booking reservation failed. Please review your details and try again.'
      );
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleCopyRef = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: 'clamp(16px, 3vw, 36px) clamp(14px, 2.5vw, 28px)' }}>
      {/* ─── 1. MODERN HERO SECTION ───────────────────────────────────────── */}
      <section className="ra-customer-hero-section">
        <div className="ra-hero-bg-shapes">
          <div className="ra-hero-shape-1" />
          <div className="ra-hero-shape-2" />
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="ra-hero-trust-chip">
            <span>🛡️</span>
            <span>100% Escrow-Protected Local Rental Network</span>
          </div>

          <h1 className="ra-hero-title-main">
            Rent Smart. Live Flexible in <span>{selectedCity === 'All' ? 'Your City' : selectedCity}</span>.
          </h1>

          <p className="ra-hero-desc-main">
            Furnish your home, upgrade your workstation, or rent premium gear directly from verified merchant stores. Your security deposit is held safely in escrow and refunded automatically upon return.
          </p>

          {/* Unified Floating Search Bar */}
          <form onSubmit={handleSearch} className="ra-search-bar-modern">
            <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search designer sofas, double-door fridges, standing desks, cameras, party speakers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ra-search-bar-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); fetchCatalog({ search: '' }); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', padding: '4px' }}
                title="Clear search"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="ra-btn ra-btn-primary"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '10px 22px',
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(3, 48, 71, 0.25)',
              }}
            >
              Search Listings
            </button>
          </form>

          {/* Quick Search Tag Suggestions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '16px', fontSize: '12px' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Popular:</span>
            {['Sofa Sets', 'Refrigerators', 'Ergonomic Chair', 'Washing Machine', 'Smart TV'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => { setSearch(tag); fetchCatalog({ search: tag }); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* 4 Hero Pillars of Trust */}
          <div className="ra-hero-pillars-grid">
            <div className="ra-hero-pillar-item">
              <div className="ra-pillar-icon-box">🛡️</div>
              <div>
                <div className="ra-pillar-title">Protected Escrow</div>
                <div className="ra-pillar-desc">Security deposits securely locked in escrow</div>
              </div>
            </div>

            <div className="ra-hero-pillar-item">
              <div className="ra-pillar-icon-box">🚚</div>
              <div>
                <div className="ra-pillar-title">Doorstep Setup</div>
                <div className="ra-pillar-desc">Free delivery & installation by merchants</div>
              </div>
            </div>

            <div className="ra-hero-pillar-item">
              <div className="ra-pillar-icon-box">🛠️</div>
              <div>
                <div className="ra-pillar-title">Free Maintenance</div>
                <div className="ra-pillar-desc">Zero repair bills for the entire rental tenure</div>
              </div>
            </div>

            <div className="ra-hero-pillar-item">
              <div className="ra-pillar-icon-box">🔄</div>
              <div>
                <div className="ra-pillar-title">Flexible Plans</div>
                <div className="ra-pillar-desc">Save up to 20% on 6 & 12 month subscriptions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. CATEGORY PILL SELECTOR ───────────────────────────────────── */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Browse by Category
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing verified inventory in <strong>{selectedCity === 'All' ? 'All Cities' : selectedCity}</strong>
          </span>
        </div>

        <div className="ra-category-carousel">
          <button
            type="button"
            className={`ra-category-pill-card ${selectedCategorySlug === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategorySlug('all')}
          >
            <span>✨</span>
            <span>All Categories</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`ra-category-pill-card ${selectedCategorySlug === cat.slug ? 'active' : ''}`}
              onClick={() => setSelectedCategorySlug(cat.slug)}
            >
              <span>{cat.icon || '🏷️'}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── 3. CATALOG CONTROLS BAR ─────────────────────────────────────── */}
      <section id="catalog-section" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            padding: '12px 18px',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{sortedItems.length}</span>
            <span style={{ color: 'var(--text-muted)' }}>available rental items</span>
            {selectedCategorySlug !== 'all' && (
              <span
                style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {categories.find((c) => c.slug === selectedCategorySlug)?.name || selectedCategorySlug}
              </span>
            )}
            {search && (
              <span
                style={{
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Keyword: "{search}"
              </span>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                background: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-main)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="recommended">Recommended & Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="tenure_asc">Shortest Tenure First</option>
            </select>
          </div>
        </div>
      </section>

      {/* ─── 4. PRODUCT CARDS GRID ───────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', borderRadius: '18px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', animation: 'raPulseSubtle 1.5s infinite' }}>⏳</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            Loading Verified Listings...
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Fetching merchant listings and pricing in {selectedCity}
          </p>
        </div>
      ) : sortedItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', borderRadius: '18px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            No Rental Items Found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px auto' }}>
            We couldn't find any products matching your filters in <strong>{selectedCity}</strong>. Try choosing "All Cities" or clearing your search term.
          </p>
          <button
            type="button"
            onClick={() => { setSearch(''); setSelectedCategorySlug('all'); }}
            className="ra-btn ra-btn-primary ra-btn-sm"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {sortedItems.map((item) => {
            const isRented = item.status === 2 || item.status === 'Rented';
            const isMaintenance = item.status === 3 || item.status === 'Maintenance';
            const isAvailable = !isRented && !isMaintenance;
            const depositNum = Number(item.securityDeposit) || 0;
            const rentNum = Number(item.monthlyRent) || 0;

            return (
              <div
                key={item.id}
                className="ra-product-card-modern"
                onClick={() => handleOpenItem(item)}
              >
                {/* Product Thumbnail */}
                <div className="ra-product-thumb-container">
                  <img
                    src={
                      item.images?.[0] ||
                      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={item.title}
                    loading="lazy"
                  />
                  <span className="ra-badge-overlay-top-left">
                    {item.categoryName}
                  </span>
                  <span className="ra-badge-overlay-top-right">
                    📍 {item.city}
                  </span>

                  {/* Stock Status Badge */}
                  {isRented ? (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        background: 'rgba(146, 64, 14, 0.92)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        backdropFilter: 'blur(6px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    >
                      ● Currently Rented
                    </span>
                  ) : isMaintenance ? (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        background: 'rgba(70, 104, 130, 0.92)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      ● Maintenance
                    </span>
                  ) : (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        background: 'rgba(6, 95, 70, 0.92)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        backdropFilter: 'blur(6px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    >
                      ● In Stock
                    </span>
                  )}
                </div>

                {/* Merchant Details */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🏪</span>
                    <span style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.vendorStoreName || 'Verified Merchant'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success-text)', background: 'var(--success-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                    ★ 4.9 Verified
                  </span>
                </div>

                {/* Item Title */}
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.35, minHeight: '44px' }}>
                  {item.title}
                </h3>

                {/* Badges snippet */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--primary-subtle)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    Min {item.minimumRentalMonths || 1} {item.minimumRentalMonths === 1 ? 'Mo' : 'Mos'}
                  </span>
                  {(item.discount12MonthsPercent > 0 || item.discount6MonthsPercent > 0) && (
                    <span style={{ fontSize: '11px', color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                      Up to {Math.max(item.discount12MonthsPercent || 0, item.discount6MonthsPercent || 0)}% Off
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--primary-subtle)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    Free Setup
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--primary-subtle)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    🛡️ Escrow
                  </span>
                </div>

                {/* Price & Rent CTA */}
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
                    <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{rentNum.toLocaleString('en-IN')}{' '}
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        / mo
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                      Deposit: ₹{depositNum.toLocaleString('en-IN')} (Refundable)
                    </div>
                  </div>

                  <button
                    type="button"
                    className={isRented ? "ra-btn ra-btn-secondary ra-btn-sm" : "ra-btn ra-btn-primary ra-btn-sm"}
                    style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px', fontWeight: 700 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenItem(item);
                    }}
                  >
                    {isRented ? 'View Status' : 'Rent Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 5. HOW RENTASSURE WORKS SECTION ──────────────────────────────── */}
      <section id="how-it-works" className="ra-how-it-works-wrap">
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>
            Seamless 3-Step Journey
          </span>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', margin: '6px 0 12px 0' }}>
            How RentAssure Protects Your Rental
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            Renting shouldn't involve deposit friction or broken appliance headaches. We built the most trustworthy peer-to-merchant rental infrastructure.
          </p>
        </div>

        <div className="ra-steps-grid">
          <div className="ra-step-item">
            <div className="ra-step-number-badge">1</div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Select Item & Duration
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Browse curated listings from verified local stores. Choose flexible tenures with merchant-exclusive duration discounts.
            </p>
          </div>

          <div className="ra-step-item">
            <div className="ra-step-number-badge">2</div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Protected Escrow Deposit
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Your security deposit is locked in automated platform escrow. The merchant cannot touch it, ensuring full refund safety upon return.
            </p>
          </div>

          <div className="ra-step-item">
            <div className="ra-step-number-badge">3</div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Doorstep Setup & Free Service
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              The local merchant delivers and installs your items. Enjoy free routine servicing. When you finish, schedule pickup and receive your full deposit back.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 6. WHY RENTASSURE TRUST SECTION ──────────────────────────────── */}
      <section id="escrow-assurance" className="ra-trust-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>
              Built for Consumer Security
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', margin: '6px 0 10px 0' }}>
              Why Renters Choose RentAssure
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '620px', margin: 0, lineHeight: 1.6 }}>
              Traditional offline rentals frequently lead to lost deposits and unresponsive landlords. RentAssure introduces bank-grade escrow technology to rental commerce.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'center', background: 'var(--primary-light)', padding: '12px 18px', borderRadius: '12px' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>100%</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Deposit Protection</div>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--primary-light)', padding: '12px 18px', borderRadius: '12px' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>24-48h</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Average Delivery</div>
            </div>
          </div>
        </div>

        <div className="ra-trust-cards-grid">
          <div className="ra-trust-card">
            <span style={{ fontSize: '28px' }}>🔒</span>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Guaranteed Escrow Refund
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Your deposit is kept in a neutral escrow account and automatically refunded after tenancy return inspection without deductions.
            </p>
          </div>

          <div className="ra-trust-card">
            <span style={{ fontSize: '28px' }}>🏪</span>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Vetted Store Partners
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Only licensed, verified local businesses with physical stores can list inventory on the RentAssure platform.
            </p>
          </div>

          <div className="ra-trust-card">
            <span style={{ fontSize: '28px' }}>🛠️</span>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Zero-Cost Repairs
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Any mechanical or electrical breakdown during your rental is repaired or replaced for free by authorized technicians.
            </p>
          </div>

          <div className="ra-trust-card">
            <span style={{ fontSize: '28px' }}>⚖️</span>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Fair Dispute Arbitration
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              If any disagreement arises over item condition, our platform admin team provides objective evidence review and fair resolution.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 7. FAQ ACCORDION SECTION ─────────────────────────────────────── */}
      <section style={{ maxWidth: '840px', margin: '48px auto 60px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            Everything you need to know about subscribing, deposit escrow, and delivery.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: '14px',
                  background: '#ffffff',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  style={{
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: isOpen ? 'var(--primary)' : 'var(--text-main)',
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: '18px', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease', color: 'var(--text-muted)' }}>
                    +
                  </span>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 20px 20px 20px', fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.6, borderTop: '1px solid var(--primary-light)' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 8. PRODUCTION RENTAL SUBSCRIPTION MODAL ───────────────────────── */}
      {selectedItem && (() => {
        const depositNum = Number(selectedItem.securityDeposit) || 0;
        const baseMonthlyNum = Number(selectedItem.monthlyRent) || 0;
        const monthlyRentNum = calculateRent(baseMonthlyNum, selectedMonths, selectedItem);
        const totalDueToday = monthlyRentNum + depositNum;
        const monthlySavings = Math.max(0, baseMonthlyNum - monthlyRentNum);
        const totalTenureSavings = monthlySavings * selectedMonths;
        const isItemUnavailable = selectedItem.status === 2 || selectedItem.status === 'Rented' || selectedItem.status === 3 || selectedItem.status === 'Maintenance';

        return (
          <div className="ra-modal-backdrop" onClick={() => { setSelectedItem(null); setBookingError(''); setRentSuccessMsg(null); }}>
            <div
              className="ra-modal-dialog"
              style={{ maxWidth: '820px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="ra-modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', background: 'linear-gradient(180deg, #ffffff 0%, var(--primary-subtle) 100%)' }}>
                <div>
                  <h3 className="ra-modal-title" style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                    {rentSuccessMsg ? '🎉 Reservation Confirmed' : selectedItem.title}
                  </h3>
                  {!rentSuccessMsg && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Category: <strong>{selectedItem.categoryName}</strong> • Verified Merchant: <strong>{selectedItem.vendorStoreName}</strong> ({selectedItem.city})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="ra-modal-close"
                  onClick={() => {
                    setSelectedItem(null);
                    setRentSuccessMsg(null);
                    setBookingError('');
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="ra-modal-body" style={{ padding: '24px' }}>
                {rentSuccessMsg ? (
                  /* ─── SUCCESS CELEBRATION VIEW ──────────────────────────────── */
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
                    <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Rental Order Reserved Successfully!
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
                      Your reservation has been routed to <strong>{rentSuccessMsg.vendorName}</strong>. The merchant will coordinate delivery and technician assembly.
                    </p>

                    {/* Booking Reference Pill */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: '#ffffff',
                        border: '1.5px solid var(--primary)',
                        borderRadius: '12px',
                        padding: '10px 20px',
                        marginBottom: '20px',
                        boxShadow: '0 4px 14px rgba(3, 48, 71, 0.08)',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Booking Reference
                        </span>
                        <strong style={{ fontSize: '18px', color: 'var(--primary)', letterSpacing: '0.5px' }}>
                          {rentSuccessMsg.reference}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyRef(rentSuccessMsg.reference)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                          background: copiedRef ? 'var(--success-bg)' : 'var(--primary-light)',
                          color: copiedRef ? 'var(--success-text)' : 'var(--primary)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {copiedRef ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>

                    {/* Order Fulfillment Step Tracker */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '10px',
                        padding: '14px 16px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid var(--border-light)',
                        marginBottom: '20px',
                        textAlign: 'left',
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ color: '#065f46', fontWeight: 700 }}>
                        <span style={{ display: 'block', fontSize: '14px' }}>✅ Step 1</span>
                        <span>Reserved in Escrow</span>
                      </div>
                      <div style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        <span style={{ display: 'block', fontSize: '14px' }}>📦 Step 2</span>
                        <span>Store Preparation</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                        <span style={{ display: 'block', fontSize: '14px' }}>🚚 Step 3</span>
                        <span>Doorstep Assembly</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                        <span style={{ display: 'block', fontSize: '14px' }}>🛡️ Step 4</span>
                        <span>Escrow Protected</span>
                      </div>
                    </div>

                    {/* Summary Details */}
                    <div
                      style={{
                        maxWidth: '560px',
                        margin: '0 auto 24px auto',
                        background: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: '14px',
                        padding: '18px 22px',
                        fontSize: '13px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Rental Tenure:</span>
                        <strong>{rentSuccessMsg.months} Months Plan</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Monthly Rent:</span>
                        <strong>₹{rentSuccessMsg.monthlyRent?.toLocaleString('en-IN')} / month</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Refundable Escrow Deposit:</span>
                        <strong style={{ color: 'var(--success-text)' }}>₹{rentSuccessMsg.deposit?.toLocaleString('en-IN')} (Held in Escrow)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Initial Charge:</span>
                        <strong style={{ color: 'var(--primary)', fontSize: '15px' }}>
                          ₹{(rentSuccessMsg.monthlyRent + rentSuccessMsg.deposit).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Scheduled Delivery:</span>
                        <strong>{rentSuccessMsg.startDate} (24-48 hrs)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Delivery Address:</span>
                        <strong style={{ maxWidth: '280px', textAlign: 'right' }}>
                          {rentSuccessMsg.deliveryAddress}, {rentSuccessMsg.deliveryCity}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
                        <strong>{rentSuccessMsg.paymentMethod}</strong>
                      </div>
                      {rentSuccessMsg.stripePaymentIntentId && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Stripe Charge Ref:</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                            ✓ {rentSuccessMsg.stripePaymentIntentId}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItem(null);
                          setRentSuccessMsg(null);
                        }}
                        className="ra-btn ra-btn-secondary"
                      >
                        Done & Return to Catalog
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItem(null);
                          setRentSuccessMsg(null);
                          onOpenMyRentals();
                        }}
                        className="ra-btn ra-btn-primary"
                        style={{ padding: '10px 22px', fontWeight: 800 }}
                      >
                        📦 View in My Rentals
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ─── SUBSCRIPTION CHECKOUT FORM ────────────────────────────── */
                  <div>
                    {/* Item Unavailable Warning */}
                    {isItemUnavailable && (
                      <div
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          color: '#92400e',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          fontSize: '13px',
                          fontWeight: 700,
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>⚠️</span>
                        <span>
                          {selectedItem.status === 2 || selectedItem.status === 'Rented'
                            ? 'This product is currently rented out by another customer. Reservations are temporarily unavailable.'
                            : 'This product is currently undergoing routine maintenance and inspection.'}
                        </span>
                      </div>
                    )}

                    {/* Authenticated Customer Context Banner */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        background: user ? '#f0fdf4' : '#f8fafc',
                        borderRadius: '10px',
                        border: `1px solid ${user ? '#bbf7d0' : 'var(--border-light)'}`,
                        marginBottom: '18px',
                        fontSize: '12px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{user ? '👤' : '🔒'}</span>
                        <span>
                          {user ? (
                            <>
                              Reserving as <strong>{user.fullName}</strong> ({user.email})
                            </>
                          ) : (
                            <>
                              Browsing as <strong>Guest</strong>. You can configure your order now and sign in before final reservation.
                            </>
                          )}
                        </span>
                      </div>
                      {!user && (
                        <button
                          type="button"
                          onClick={onRequireAuth}
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--primary)',
                            background: 'var(--primary)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          Sign In / Register
                        </button>
                      )}
                    </div>

                    {/* Product & Merchant Credentials Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '18px' }}>
                      {/* Product Thumbnail */}
                      <div style={{ height: '200px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', position: 'relative' }}>
                        <img
                          src={
                            selectedItem.images?.[0] ||
                            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'
                          }
                          alt={selectedItem.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '10px',
                            background: selectedItem.status === 2 ? '#b45309' : '#047857',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {selectedItem.status === 2 ? '● Currently Rented' : '● Available Now'}
                        </span>
                      </div>

                      {/* Merchant Trust Box */}
                      <div
                        style={{
                          padding: '16px',
                          background: 'var(--primary-subtle)',
                          borderRadius: '12px',
                          border: '1px solid var(--color-light-blue-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                              🏪 {selectedItem.vendorStoreName || 'Authorized Merchant'}
                            </strong>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                              ★ 4.9 Verified
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            📍 Located in {selectedItem.city} • Physical Storefront
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', color: 'var(--text-body)' }}>
                            <div>✓ Doorstep delivery & professional installation included</div>
                            <div>✓ Complimentary maintenance & zero repair charges</div>
                            <div>✓ Condition: <strong>{selectedItem.condition || 'Brand New'}</strong></div>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: '10px',
                            padding: '8px 10px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>🛡️</span>
                          <span>100% Security Deposit Protected in Escrow Protocol</span>
                        </div>
                      </div>
                    </div>

                    {bookingError && (
                      <div
                        style={{
                          background: 'var(--danger-bg)',
                          color: 'var(--danger-text)',
                          border: '1px solid var(--danger-border)',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          fontSize: '13px',
                          fontWeight: 600,
                          marginBottom: '16px',
                        }}
                      >
                        {bookingError}
                      </div>
                    )}

                    {/* Step 1: Rental Duration Selection */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                          Step 1: Select Rental Tenure
                        </span>
                        {(() => {
                          const maxD = Math.max(selectedItem.discount12MonthsPercent || 0, selectedItem.discount6MonthsPercent || 0);
                          return maxD > 0 ? (
                            <span style={{ fontSize: '12px', color: '#065f46', fontWeight: 700 }}>
                              Up to {maxD}% duration savings configured by merchant
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                              Standard monthly pricing
                            </span>
                          );
                        })()}
                      </div>

                      {(() => {
                        const minM = selectedItem.minimumRentalMonths || 1;
                        const standardOptions = [1, 3, 6, 12];
                        let validOptions = standardOptions.filter((m) => m >= minM);
                        if (validOptions.length === 0 || !validOptions.includes(minM)) {
                          validOptions = [minM, ...validOptions];
                        }
                        const d6 = Number(selectedItem.discount6MonthsPercent) || 0;
                        const d12 = Number(selectedItem.discount12MonthsPercent) || 0;

                        return (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: `repeat(auto-fit, minmax(130px, 1fr))`,
                              gap: '10px',
                              margin: '10px 0',
                            }}
                          >
                            {validOptions.map((m) => {
                              const rate = calculateRent(selectedItem.monthlyRent, m, selectedItem);
                              const isSelected = selectedMonths === m;
                              const savingsTotal = Math.max(0, (baseMonthlyNum - rate) * m);

                              return (
                                <div
                                  key={m}
                                  onClick={() => setSelectedMonths(m)}
                                  className={`ra-tenure-card-interactive ${isSelected ? 'selected' : ''}`}
                                  style={{ padding: '12px 10px' }}
                                >
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                                    {m} {m === 1 ? 'Month' : 'Months'}
                                  </div>
                                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>
                                    ₹{rate.toLocaleString('en-IN')}{' '}
                                    <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>
                                      / mo
                                    </span>
                                  </div>
                                  {m >= 12 && d12 > 0 ? (
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 6px', borderRadius: '4px' }}>
                                      Save {d12}% (₹{savingsTotal.toLocaleString('en-IN')})
                                    </span>
                                  ) : m >= 6 && m < 12 && d6 > 0 ? (
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 6px', borderRadius: '4px' }}>
                                      Save {d6}% (₹{savingsTotal.toLocaleString('en-IN')})
                                    </span>
                                  ) : m === minM ? (
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>
                                      Min Tenure
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Step 2: Delivery & Contact Information */}
                    <div style={{ marginBottom: '20px' }}>
                      <span style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                        Step 2: Delivery Destination & Contact Details
                      </span>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                            Delivery Street Address (House / Flat, Society, Area) <span style={{ color: 'var(--danger-text)' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="e.g. 402 Galaxy Heights, Near Central Park"
                            className="ra-input"
                            style={{ width: '100%' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                              City
                            </label>
                            <input
                              type="text"
                              value={deliveryCity}
                              onChange={(e) => setDeliveryCity(e.target.value)}
                              placeholder="e.g. Ahmedabad"
                              className="ra-input"
                              style={{ width: '100%' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                              PIN / Postal Code
                            </label>
                            <input
                              type="text"
                              maxLength={6}
                              value={deliveryPincode}
                              onChange={(e) => setDeliveryPincode(e.target.value.replace(/\D/g, ''))}
                              placeholder="e.g. 380054"
                              className="ra-input"
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                              Contact Phone Number <span style={{ color: 'var(--danger-text)' }}>*</span>
                            </label>
                            <input
                              type="tel"
                              value={deliveryPhone}
                              onChange={(e) => setDeliveryPhone(e.target.value)}
                              placeholder="e.g. 9876543210"
                              className="ra-input"
                              style={{ width: '100%' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                              Preferred Delivery Date
                            </label>
                            <input
                              type="date"
                              value={preferredStartDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setPreferredStartDate(e.target.value)}
                              className="ra-input"
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                            Special Delivery / Gate Instructions (Optional)
                          </label>
                          <input
                            type="text"
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            placeholder="e.g. Call before arrival, 2nd floor with service lift"
                            className="ra-input"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Escrow Payment Mode */}
                    <div style={{ marginBottom: '20px' }}>
                      <span style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                        Step 3: Escrow Payment Mode
                      </span>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                        <label
                          style={{
                            border: paymentMethod === 'escrow_online' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                            background: paymentMethod === 'escrow_online' ? 'var(--primary-subtle)' : '#ffffff',
                            borderRadius: '10px',
                            padding: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                          }}
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            checked={paymentMethod === 'escrow_online'}
                            onChange={() => setPaymentMethod('escrow_online')}
                            style={{ marginTop: '3px', accentColor: 'var(--primary)' }}
                          />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                              💳 Escrow Shield Online Pay (Recommended)
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Instant lock via UPI, Cards, NetBanking. Funds held in regulated escrow.
                            </div>
                          </div>
                        </label>

                        <label
                          style={{
                            border: paymentMethod === 'escrow_delivery' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                            background: paymentMethod === 'escrow_delivery' ? 'var(--primary-subtle)' : '#ffffff',
                            borderRadius: '10px',
                            padding: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                          }}
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            checked={paymentMethod === 'escrow_delivery'}
                            onChange={() => setPaymentMethod('escrow_delivery')}
                            style={{ marginTop: '3px', accentColor: 'var(--primary)' }}
                          />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                              📲 Pay on Delivery (Doorstep Escrow)
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Verify product with merchant technician, then scan escrow UPI QR.
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Online Card Checkout Section with Stripe */}
                      {paymentMethod === 'escrow_online' && (
                        <div style={{ marginTop: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                          {!user ? (
                            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 12px 0' }}>
                                Please sign in to authorize card payment and lock your escrow deposit.
                              </p>
                              <button
                                type="button"
                                onClick={onRequireAuth}
                                className="ra-btn ra-btn-primary"
                                style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 700 }}
                              >
                                Sign In to Pay with Card
                              </button>
                            </div>
                          ) : (
                            <Elements stripe={stripePromise}>
                              <StripeCardPaymentForm
                                user={user}
                                item={selectedItem}
                                rentalMonths={selectedMonths}
                                totalDueToday={totalDueToday}
                                securityDeposit={depositNum}
                                monthlyRent={monthlyRentNum}
                                deliveryAddress={deliveryAddress.trim() || 'Flat 402, Shivalik Heights, SG Highway'}
                                deliveryCity={deliveryCity.trim() || selectedItem.city || 'Ahmedabad'}
                                deliveryPhone={deliveryPhone.trim() || '9876543210'}
                                isSubmitting={submittingBooking}
                                isItemUnavailable={isItemUnavailable}
                                onPaymentSuccess={async (paymentIntentId) => {
                                  await handleConfirmRent(paymentIntentId);
                                }}
                                onCancel={() => setPaymentMethod('escrow_delivery')}
                              />
                            </Elements>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Step 4: Transparent Escrow Cost Breakdown Table */}
                    <div
                      style={{
                        background: 'var(--primary-subtle)',
                        border: '1px solid var(--color-light-blue-border)',
                        borderRadius: '14px',
                        padding: '18px 20px',
                        fontSize: '13px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Monthly Subscription ({selectedMonths} Months Plan):
                        </span>
                        <strong style={{ color: 'var(--text-main)' }}>
                          ₹{monthlyRentNum.toLocaleString('en-IN')} / month
                        </strong>
                      </div>

                      {totalTenureSavings > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#065f46' }}>
                          <span>Duration Discount Savings:</span>
                          <strong>-₹{totalTenureSavings.toLocaleString('en-IN')} total savings</strong>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Refundable Security Deposit <span style={{ fontSize: '11px', color: 'var(--primary)' }}>(🛡️ Held in Escrow)</span>:
                        </span>
                        <strong style={{ color: 'var(--text-main)' }}>₹{depositNum.toLocaleString('en-IN')}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Doorstep Delivery & Professional Assembly:</span>
                        <strong style={{ color: 'var(--success-text)' }}>FREE (₹0)</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                        <div>
                          <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '15px' }}>Total Due Today:</span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Includes 1st month rent + 100% refundable escrow deposit
                          </div>
                        </div>
                        <strong style={{ fontSize: '20px', color: 'var(--primary)', fontWeight: 800 }}>
                          ₹{totalDueToday.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              {!rentSuccessMsg && (
                <div className="ra-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="ra-btn ra-btn-secondary"
                    onClick={() => {
                      setSelectedItem(null);
                      setBookingError('');
                    }}
                    disabled={submittingBooking}
                  >
                    Cancel
                  </button>

                  {/* If user selected online pay, the Stripe form inside Step 3 has its own dedicated card submission buttons */}
                  {paymentMethod === 'escrow_online' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#0369a1', fontWeight: 600 }}>
                      <span>💳 Use 1-Click Pay or enter card details in Step 3 above</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="ra-btn ra-btn-primary"
                      onClick={() => handleConfirmRent(null)}
                      disabled={submittingBooking || isItemUnavailable}
                      style={{
                        padding: '10px 28px',
                        fontWeight: 800,
                        borderRadius: '10px',
                        boxShadow: '0 4px 14px rgba(3, 48, 71, 0.22)',
                      }}
                    >
                      {isItemUnavailable
                        ? 'Currently Rented Out'
                        : submittingBooking
                        ? 'Securing Escrow Reservation...'
                        : !user
                        ? `Sign In to Reserve (₹${totalDueToday.toLocaleString('en-IN')})`
                        : `Confirm & Reserve (Doorstep Escrow: ₹${totalDueToday.toLocaleString('en-IN')})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CustomerCatalogPage;
