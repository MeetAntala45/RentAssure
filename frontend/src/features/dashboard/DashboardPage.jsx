import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/context/AuthContext';
import itemService from '../items/services/itemService';
import bookingService from '../bookings/services/bookingService';
import vendorService from '../vendors/services/vendorService';
import './Marketplace.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active view tab: 'catalog', 'my_rentals', 'vendor_portal'
  const [activeTab, setActiveTab] = useState('catalog');

  // Catalog state
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState(['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar']);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCatSlug, setSelectedCatSlug] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tenureFilter, setTenureFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  // Rent / Details Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalTenure, setModalTenure] = useState(3);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('Ahmedabad');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // My Rentals & Vendor Data
  const [myBookings, setMyBookings] = useState([]);
  const [vendorMetrics, setVendorMetrics] = useState(null);
  const [vendorInventory, setVendorInventory] = useState([]);
  const [vendorBookings, setVendorBookings] = useState([]);

  // Vendor Action Modals
  const [newItemModal, setNewItemModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    title: '',
    categoryId: 1,
    monthlyRent: '',
    securityDeposit: '',
    minimumRentalMonths: 3,
    city: 'Ahmedabad',
    area: 'Downtown',
    condition: 'Brand New',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
  });

  // Return & Dispute Modals
  const [returnModalBooking, setReturnModalBooking] = useState(null);
  const [returnReason, setReturnReason] = useState('Relocating to another city');
  const [disputeModalBooking, setDisputeModalBooking] = useState(null);
  const [disputeReason, setDisputeReason] = useState(1);
  const [disputeDesc, setDisputeDesc] = useState('');

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return 'RA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Fetch catalog & categories
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const [catRes, citiesRes] = await Promise.all([
          itemService.getCategories(),
          itemService.getCities()
        ]);

        if (catRes.isSuccess && catRes.data) {
          setCategories(catRes.data);
        }
        if (citiesRes.isSuccess && citiesRes.data?.length) {
          setCities(citiesRes.data);
        }

        // Fetch items
        const itemRes = await itemService.getCatalogItems({ pageSize: 50 });
        if (itemRes.isSuccess && itemRes.data?.items) {
          setItems(itemRes.data.items);
        }
      } catch (err) {
        console.error('Failed to load marketplace catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  // Fetch bookings when switching to 'my_rentals'
  useEffect(() => {
    if (activeTab === 'my_rentals') {
      const fetchMyBookings = async () => {
        try {
          const res = await bookingService.getMyBookings();
          if (res.isSuccess && res.data) {
            setMyBookings(res.data);
          }
        } catch (err) {
          console.error('Failed to load my rentals:', err);
        }
      };
      fetchMyBookings();
    } else if (activeTab === 'vendor_portal') {
      const fetchVendorData = async () => {
        try {
          const [metRes, invRes, ordRes] = await Promise.all([
            vendorService.getDashboard(),
            vendorService.getInventory(),
            vendorService.getVendorBookings()
          ]);
          if (metRes.isSuccess) setVendorMetrics(metRes.data);
          if (invRes.isSuccess) setVendorInventory(invRes.data);
          if (ordRes.isSuccess) setVendorBookings(ordRes.data);
        } catch (err) {
          console.error('Failed to load vendor portal data:', err);
        }
      };
      fetchVendorData();
    }
  }, [activeTab]);

  // Filtered Items logic
  const filteredItems = items.filter((item) => {
    // City filter
    if (selectedCity !== 'All' && item.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    // Category filter
    if (selectedCatSlug !== 'all' && item.categorySlug !== selectedCatSlug) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        item.vendorStoreName.toLowerCase().includes(q);
      if (!match) return false;
    }
    // Tenure filter
    if (tenureFilter !== 'all' && item.minimumRentalMonths > parseInt(tenureFilter, 10)) {
      return false;
    }
    // Price filter
    if ((priceFilter === 'under500' || priceFilter === 'under50') && item.monthlyRent >= 500) return false;
    if ((priceFilter === '500to1500' || priceFilter === '50to100') && (item.monthlyRent < 500 || item.monthlyRent > 1500)) return false;
    if ((priceFilter === 'over1500' || priceFilter === 'over100') && item.monthlyRent <= 1500) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.monthlyRent - b.monthlyRent;
    if (sortBy === 'price_desc') return b.monthlyRent - a.monthlyRent;
    if (sortBy === 'popular') return b.totalRentalsCount - a.totalRentalsCount;
    return 0; // recommended / default
  });

  // Calculate dynamic rent based on tenure
  const calculateRent = (baseMonthly, tenure) => {
    if (tenure >= 12) return Math.round(baseMonthly * 0.80);
    if (tenure >= 6) return Math.round(baseMonthly * 0.90);
    return baseMonthly;
  };

  // Open Rent Modal
  const handleOpenRent = (item) => {
    setSelectedItem(item);
    setModalTenure(item.minimumRentalMonths || 3);
    setDeliveryCity(item.city || 'San Francisco');
  };

  // Submit Booking
  const handleConfirmRental = async () => {
    if (!selectedItem) return;
    setSubmittingBooking(true);
    try {
      const payload = {
        itemId: selectedItem.id,
        rentalDurationMonths: modalTenure,
        deliveryAddress: deliveryAddress.trim() || '450 Sutter St, Apt 8B',
        deliveryCity: deliveryCity || selectedItem.city,
      };

      const res = await bookingService.createBooking(payload);
      if (res.isSuccess) {
        showToast(`🎉 Rental subscription confirmed for "${selectedItem.title}"! Monthly escrow plan activated.`, 'success');
        setSelectedItem(null);
        // Refresh catalog and switch to My Rentals
        const itemRes = await itemService.getCatalogItems({ pageSize: 50 });
        if (itemRes.isSuccess && itemRes.data?.items) {
          setItems(itemRes.data.items);
        }
        setActiveTab('my_rentals');
      } else {
        showToast(res.message || 'Failed to place rental subscription.', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error creating rental booking.';
      showToast(msg, 'error');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Submit Return Request
  const handleSubmitReturn = async () => {
    if (!returnModalBooking) return;
    try {
      const res = await bookingService.requestReturn(returnModalBooking.id, {
        reason: returnReason,
        preferredPickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (res.isSuccess) {
        showToast(`Pickup scheduled for order #${returnModalBooking.bookingReference}. Vendor will contact for transit inspection.`, 'success');
        setReturnModalBooking(null);
        // Refresh bookings
        const bRes = await bookingService.getMyBookings();
        if (bRes.isSuccess) setMyBookings(bRes.data);
      } else {
        showToast(res.message || 'Failed to request return.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to request return.', 'error');
    }
  };

  // Submit Customer Dispute
  const handleSubmitDispute = async () => {
    if (!disputeModalBooking) return;
    try {
      const res = await bookingService.raiseDispute(disputeModalBooking.id, {
        reason: parseInt(disputeReason, 10),
        description: disputeDesc || 'Dispute regarding item condition or escrow deposit deduction.',
        claimedAmount: disputeModalBooking.securityDeposit,
      });
      if (res.isSuccess) {
        showToast(`Dispute ticket opened for ${disputeModalBooking.bookingReference}. Escrow payout held pending admin review.`, 'success');
        setDisputeModalBooking(null);
        setDisputeDesc('');
      } else {
        showToast(res.message || 'Failed to raise dispute.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to raise dispute.', 'error');
    }
  };

  // Vendor Creates New Item
  const handleVendorCreateItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: newItemForm.title.trim(),
        categoryId: parseInt(newItemForm.categoryId, 10),
        monthlyRent: parseFloat(newItemForm.monthlyRent),
        securityDeposit: parseFloat(newItemForm.securityDeposit || newItemForm.monthlyRent * 3),
        minimumRentalMonths: parseInt(newItemForm.minimumRentalMonths, 10),
        city: newItemForm.city,
        area: newItemForm.area,
        condition: newItemForm.condition,
        description: newItemForm.description,
        images: [newItemForm.imageUrl.trim()],
      };

      const res = await vendorService.createItem(payload);
      if (res.isSuccess) {
        showToast(`Item "${newItemForm.title}" listed in catalog successfully!`, 'success');
        setNewItemModal(false);
        // Refresh vendor inventory & catalog
        const invRes = await vendorService.getInventory();
        if (invRes.isSuccess) setVendorInventory(invRes.data);
        const itemRes = await itemService.getCatalogItems({ pageSize: 50 });
        if (itemRes.isSuccess && itemRes.data?.items) setItems(itemRes.data.items);
      } else {
        showToast(res.message || 'Failed to list item.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to list item.', 'error');
    }
  };

  // Vendor Updates Booking Status
  const handleUpdateOrderStatus = async (bookingId, newStatus) => {
    try {
      const res = await vendorService.updateOrderStatus(bookingId, {
        status: newStatus,
        vendorNotes: `Status updated to ${newStatus} by vendor.`,
      });
      if (res.isSuccess) {
        showToast(`Order status updated successfully!`, 'success');
        const ordRes = await vendorService.getVendorBookings();
        if (ordRes.isSuccess) setVendorBookings(ordRes.data);
      }
    } catch (err) {
      showToast('Failed to update order status.', 'error');
    }
  };

  const isAdmin = user?.role === 'Admin' || user?.Role === 'Admin';
  const isVendor = user?.role === 'Vendor' || user?.Role === 'Vendor' || isAdmin;

  return (
    <div className="marketplace-shell">
      {/* ─── Toast Notification ───────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: toast.type === 'error' ? '#fef2f2' : '#ecfdf5',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
          color: toast.type === 'error' ? '#b91c1c' : '#065f46',
          padding: '0.85rem 1.25rem',
          borderRadius: 10,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          fontWeight: 600,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── Top Navbar ───────────────────────────────────────────────── */}
      <header className="mp-navbar">
        <div className="mp-navbar__container">
          <Link to="/dashboard" className="mp-brand">
            <div className="mp-brand__logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="mp-brand__text">
              <span className="mp-brand__title">RentAssure</span>
              <span className="mp-brand__tagline">Multi-Vendor Rental Marketplace</span>
            </div>
          </Link>

          <div className="mp-nav__center">
            {/* City Selector */}
            <div className="mp-city-selector" title="Select your delivery metro area">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                <option value="All">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Global Search */}
            <div className="mp-search-bar">
              <svg className="mp-search-bar__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search furniture, smart appliances, OLED TVs, gym gear..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="mp-nav__right">
            {/* Quick Portal Switcher */}
            <div className="mp-portal-tabs">
              <button
                className={`mp-portal-tab ${activeTab === 'catalog' ? 'active' : ''}`}
                onClick={() => setActiveTab('catalog')}
              >
                <span>Browse Marketplace</span>
              </button>

              <button
                className={`mp-portal-tab ${activeTab === 'my_rentals' ? 'active' : ''}`}
                onClick={() => setActiveTab('my_rentals')}
              >
                <span>My Subscriptions</span>
                {myBookings.length > 0 && (
                  <span className="mp-badge">{myBookings.length}</span>
                )}
              </button>

              {isVendor && (
                <button
                  className={`mp-portal-tab ${activeTab === 'vendor_portal' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vendor_portal')}
                  style={{ color: activeTab === 'vendor_portal' ? '#2563eb' : '#059669' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span>Shop Portal</span>
                </button>
              )}
            </div>

            {/* Admin Console Direct Link */}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="mp-portal-tab"
                style={{
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Admin Console</span>
              </Link>
            )}

            {/* User Profile Pill */}
            <div className="mp-user-pill">
              <div className="mp-user-avatar">
                {getInitials(user?.fullName)}
              </div>
              <span className="mp-user-name">{user?.fullName?.split(' ')[0] || 'Account'}</span>
              <button onClick={logout} className="mp-btn-logout" title="Sign Out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Hero Section (Catalog Mode) ──────────────────────────────── */}
      {activeTab === 'catalog' && (
        <section className="mp-hero">
          <div className="mp-hero__container">
            <div>
              <h1 className="mp-hero__title">
                Rent Furniture, Appliances & Gear <span>Monthly</span>
              </h1>
              <p className="mp-hero__subtitle">
                Subscribe directly from verified local shop owners in {selectedCity === 'All' ? 'Gujarat' : selectedCity}. Enjoy free doorstep delivery, zero upfront buying cost, and 100% escrow-backed security deposits.
              </p>
              <div className="mp-hero__perks">
                <div className="mp-perk-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>100% Escrow Deposit Protection</span>
                </div>
                <div className="mp-perk-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Flexible 3, 6 & 12 Month Subscriptions</span>
                </div>
                <div className="mp-perk-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Direct From Local Independent Stores</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Main Content Canvas ──────────────────────────────────────── */}
      <main className="mp-main">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: CATALOG BROWSER & RENT FLOW                            */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'catalog' && (
          <div>
            {/* Category Filter Pills */}
            <div className="mp-categories-bar">
              <button
                className={`mp-cat-pill ${selectedCatSlug === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCatSlug('all')}
              >
                <span>All Categories</span>
                <span className="mp-cat-pill__badge">{items.length}</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`mp-cat-pill ${selectedCatSlug === cat.slug ? 'active' : ''}`}
                  onClick={() => setSelectedCatSlug(cat.slug)}
                >
                  <span>{cat.name}</span>
                  <span className="mp-cat-pill__badge">{cat.availableItemsCount || 0}</span>
                </button>
              ))}
            </div>

            {/* Sub-Filters Row */}
            <div className="mp-filters-row">
              <div className="mp-filters-left">
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Filter By:
                </span>

                {/* Tenure */}
                <button
                  className={`mp-filter-chip ${tenureFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTenureFilter('all')}
                >
                  Any Tenure
                </button>
                <button
                  className={`mp-filter-chip ${tenureFilter === '1' ? 'active' : ''}`}
                  onClick={() => setTenureFilter('1')}
                >
                  1+ Months
                </button>
                <button
                  className={`mp-filter-chip ${tenureFilter === '3' ? 'active' : ''}`}
                  onClick={() => setTenureFilter('3')}
                >
                  3+ Months
                </button>
                <button
                  className={`mp-filter-chip ${tenureFilter === '6' ? 'active' : ''}`}
                  onClick={() => setTenureFilter('6')}
                >
                  6+ Months
                </button>

                {/* Price */}
                <button
                  className={`mp-filter-chip ${priceFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPriceFilter('all')}
                >
                  All Prices
                </button>
                <button
                  className={`mp-filter-chip ${priceFilter === 'under500' ? 'active' : ''}`}
                  onClick={() => setPriceFilter('under500')}
                >
                  Under ₹500/mo
                </button>
                <button
                  className={`mp-filter-chip ${priceFilter === '500to1500' ? 'active' : ''}`}
                  onClick={() => setPriceFilter('500to1500')}
                >
                  ₹500 - ₹1,500/mo
                </button>
                <button
                  className={`mp-filter-chip ${priceFilter === 'over1500' ? 'active' : ''}`}
                  onClick={() => setPriceFilter('over1500')}
                >
                  ₹1,500+/mo
                </button>
              </div>

              {/* Sort By */}
              <div>
                <select
                  className="mp-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recommended">Featured / Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="popular">Most Subscribed</option>
                </select>
              </div>
            </div>

            {/* Catalog Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                <p>Loading catalog items from local verified stores...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="mp-empty-box">
                <div className="mp-empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="mp-empty-title">No rental items match your filters</h3>
                <p className="mp-empty-desc">Try clearing your filters or changing your city to see items from nearby partner shops.</p>
                <button
                  className="mp-filter-chip active"
                  onClick={() => { setSelectedCity('All'); setSelectedCatSlug('all'); setPriceFilter('all'); setTenureFilter('all'); setSearchQuery(''); }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="mp-grid">
                {filteredItems.map((item) => {
                  const img = item.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80';
                  return (
                    <div key={item.id} className="mp-card">
                      <div className="mp-card__media">
                        <img src={img} alt={item.title} loading="lazy" />
                        <div className="mp-card__badges">
                          <span className="mp-tag mp-tag--category">{item.categoryName}</span>
                          <span className="mp-tag mp-tag--condition">{item.condition}</span>
                        </div>
                      </div>

                      <div className="mp-card__body">
                        <div className="mp-vendor-line">
                          <span className="mp-vendor-name">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            </svg>
                            {item.vendorStoreName}
                          </span>
                          <span className="mp-vendor-rating">
                            ★ {item.vendorRating}
                          </span>
                        </div>

                        <h3 className="mp-card__title" title={item.title}>{item.title}</h3>

                        <div className="mp-card__location">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{item.city} • {item.area || 'Metro'}</span>
                        </div>

                        <div className="mp-card__pricing-box">
                          <div className="mp-pricing-main">
                            <div className="mp-rent-amount">
                              ₹{item.monthlyRent}<span> / mo</span>
                            </div>
                            <div className="mp-deposit-note">
                              ₹{item.securityDeposit} deposit
                            </div>
                          </div>
                          <div className="mp-pricing-footer">
                            <span>Min {item.minimumRentalMonths} months</span>
                            <span className="mp-discount-tag">Up to 20% off for 12 mos</span>
                          </div>
                        </div>

                        <div className="mp-card__actions">
                          <button
                            className="mp-btn-rent"
                            onClick={() => handleOpenRent(item)}
                          >
                            <span>Rent Monthly</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </button>
                          <button
                            className="mp-btn-detail"
                            onClick={() => handleOpenRent(item)}
                            title="View specifications & rental terms"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: MY SUBSCRIPTIONS & ACTIVE RENTALS                      */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'my_rentals' && (
          <div>
            <div className="mp-kpi-bar">
              <div className="mp-kpi-card">
                <div className="mp-kpi-card__label">Active Subscriptions</div>
                <div className="mp-kpi-card__value">
                  {myBookings.filter(b => b.status === 3 || b.status === 2).length} Units
                </div>
                <div className="mp-kpi-card__sub">● All delivered in good order</div>
              </div>

              <div className="mp-kpi-card">
                <div className="mp-kpi-card__label">Monthly Rental Outflow</div>
                <div className="mp-kpi-card__value">
                  ₹{myBookings.reduce((sum, b) => (b.status === 3 ? sum + b.monthlyRent : sum), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="mp-kpi-card__sub">Auto-renewing monthly</div>
              </div>

              <div className="mp-kpi-card">
                <div className="mp-kpi-card__label">Security Deposits in Escrow</div>
                <div className="mp-kpi-card__value">
                  ₹{myBookings.reduce((sum, b) => (b.depositStatus === 1 ? sum + b.securityDeposit : sum), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="mp-kpi-card__sub">🛡 Fully protected by RentAssure</div>
              </div>
            </div>

            <div className="mp-panel">
              <div className="mp-panel__header">
                <h2 className="mp-panel__title">Your Subscriptions & Leased Items</h2>
                <button
                  className="mp-btn-rent"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                  onClick={() => setActiveTab('catalog')}
                >
                  + Rent Another Item
                </button>
              </div>

              {myBookings.length === 0 ? (
                <div className="mp-empty-box">
                  <div className="mp-empty-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  </div>
                  <h3 className="mp-empty-title">You don't have any active rentals yet</h3>
                  <p className="mp-empty-desc">
                    Explore our catalog of premium furniture, kitchen appliances, and electronics from trusted local shops.
                  </p>
                  <button className="mp-btn-rent" onClick={() => setActiveTab('catalog')}>
                    Start Browsing Catalog
                  </button>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Item & Reference</th>
                        <th>Vendor Store</th>
                        <th>Tenure</th>
                        <th>Monthly Rent</th>
                        <th>Escrow Deposit</th>
                        <th>Subscription Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBookings.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {b.itemImageUrl ? (
                                <img
                                  src={b.itemImageUrl}
                                  alt={b.itemTitle}
                                  style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9' }} />
                              )}
                              <div>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.itemTitle}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Ref: {b.bookingReference}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#2563eb' }}>{b.vendorStoreName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.deliveryCity}</div>
                          </td>
                          <td>
                            <strong>{b.rentalDurationMonths} Months</strong>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Expires {new Date(b.endDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <strong>₹{b.monthlyRent.toFixed(2)}</strong>/mo
                          </td>
                          <td>
                            <span style={{ color: '#059669', fontWeight: 600 }}>
                              ₹{b.securityDeposit.toFixed(2)}
                            </span>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {b.depositStatus === 1 ? 'Held in Escrow' : b.depositStatus === 2 ? 'Refunded' : 'Adjusted'}
                            </div>
                          </td>
                          <td>
                            {b.status === 3 && (
                              <span className="badge-status badge-status--active">● Active Subscription</span>
                            )}
                            {b.status === 2 && (
                              <span className="badge-status badge-status--approved">● Delivered</span>
                            )}
                            {b.status === 4 && (
                              <span className="badge-status badge-status--return-requested">● Return Scheduled</span>
                            )}
                            {b.status === 6 && (
                              <span className="badge-status badge-status--completed">● Completed & Refunded</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              {(b.status === 3 || b.status === 2) && (
                                <button
                                  className="btn-admin btn-admin--secondary btn-admin--sm"
                                  onClick={() => setReturnModalBooking(b)}
                                  title="Schedule pickup & return item"
                                >
                                  Request Return
                                </button>
                              )}
                              <button
                                className="btn-admin btn-admin--secondary btn-admin--sm"
                                style={{ color: '#dc2626' }}
                                onClick={() => setDisputeModalBooking(b)}
                                title="File damage or deposit dispute"
                              >
                                Report Issue
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VIEW 3: VENDOR SHOP OWNER PORTAL                               */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'vendor_portal' && (
          <div>
            {/* Vendor KPIs */}
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card admin-kpi-card--blue">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-label">Active Rented Units</span>
                  <div className="admin-kpi-icon admin-kpi-icon--blue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                </div>
                <div className="admin-kpi-value">{vendorMetrics?.activeRentalsCount || 0} Units</div>
                <div className="admin-kpi-footer">
                  <span className="kpi-subtext">Total catalog: {vendorMetrics?.totalListings || 0} items</span>
                </div>
              </div>

              <div className="admin-kpi-card admin-kpi-card--emerald">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-label">Monthly Gross Revenue</span>
                  <div className="admin-kpi-icon admin-kpi-icon--emerald">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                </div>
                <div className="admin-kpi-value">₹{vendorMetrics?.monthlyGrossRent?.toFixed(2) || '0.00'}</div>
                <div className="admin-kpi-footer">
                  <span className="kpi-trend--up">Recurring monthly volume</span>
                </div>
              </div>

              <div className="admin-kpi-card admin-kpi-card--amber">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-label">Total Vendor Earnings</span>
                  <div className="admin-kpi-icon admin-kpi-icon--amber">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>
                <div className="admin-kpi-value">₹{vendorMetrics?.totalEarnings?.toFixed(2) || '0.00'}</div>
                <div className="admin-kpi-footer">
                  <span className="kpi-subtext">Stripe payouts active</span>
                </div>
              </div>

              <div className="admin-kpi-card admin-kpi-card--purple">
                <div className="admin-kpi-header">
                  <span className="admin-kpi-label">Platform Commission Paid</span>
                  <div className="admin-kpi-icon admin-kpi-icon--purple">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" />
                      <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                  </div>
                </div>
                <div className="admin-kpi-value">₹{vendorMetrics?.totalCommissionPaid?.toFixed(2) || '0.00'}</div>
                <div className="admin-kpi-footer">
                  <span className="kpi-subtext">Rate: {vendorMetrics?.commissionRate || 12}% flat</span>
                </div>
              </div>
            </div>

            {/* Inventory Management Table */}
            <div className="mp-panel">
              <div className="mp-panel__header">
                <div>
                  <h2 className="mp-panel__title">Your Listed Rental Inventory</h2>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Manage stock, pricing, and monthly minimum rental durations.
                  </p>
                </div>
                <button
                  className="mp-btn-rent"
                  onClick={() => setNewItemModal(true)}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  + List New Rental Item
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product Title</th>
                      <th>Category</th>
                      <th>Monthly Rent</th>
                      <th>Deposit</th>
                      <th>Min Tenure</th>
                      <th>City Hub</th>
                      <th>Status</th>
                      <th>Total Rentals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorInventory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {item.images?.[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f1f5f9' }} />
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.condition}</div>
                            </div>
                          </div>
                        </td>
                        <td>{item.categoryName}</td>
                        <td><strong>₹{item.monthlyRent}</strong>/mo</td>
                        <td>₹{item.securityDeposit}</td>
                        <td>{item.minimumRentalMonths} Mos</td>
                        <td>{item.city}</td>
                        <td>
                          {item.status === 1 ? (
                            <span className="badge-status badge-status--approved">● Available</span>
                          ) : (
                            <span className="badge-status badge-status--pending">● Subscribed</span>
                          )}
                        </td>
                        <td>{item.totalRentalsCount} times</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vendor Orders & Deliveries */}
            <div className="mp-panel">
              <div className="mp-panel__header">
                <div>
                  <h2 className="mp-panel__title">Customer Rental Orders & Logistics</h2>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Track pending dispatches, deliveries, and item returns.
                  </p>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order Ref</th>
                      <th>Renter</th>
                      <th>Item Rented</th>
                      <th>Monthly Payout</th>
                      <th>Delivery Location</th>
                      <th>Current Status</th>
                      <th>Order Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorBookings.map((b) => (
                      <tr key={b.id}>
                        <td><strong>{b.bookingReference}</strong></td>
                        <td>
                          <div>{b.customerName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{b.customerEmail}</div>
                        </td>
                        <td>{b.itemTitle}</td>
                        <td>
                          <span style={{ color: 'var(--primary, #033047)', fontWeight: 700 }}>
                            ₹{b.vendorPayoutAmount?.toFixed(2)}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}> (net)</span>
                        </td>
                        <td>
                          <div>{b.deliveryAddress}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{b.deliveryCity}</div>
                        </td>
                        <td>
                          {b.status === 1 && <span className="badge-status badge-status--pending">● Reserved</span>}
                          {b.status === 2 && <span className="badge-status badge-status--approved">● Delivered</span>}
                          {b.status === 3 && <span className="badge-status badge-status--active">● Active</span>}
                          {b.status === 4 && <span className="badge-status badge-status--return-requested">● Return Requested</span>}
                          {b.status === 6 && <span className="badge-status badge-status--completed">● Completed</span>}
                        </td>
                        <td>
                          {b.status === 1 && (
                            <button
                              className="btn-admin btn-admin--primary btn-admin--sm"
                              onClick={() => handleUpdateOrderStatus(b.id, 2)}
                            >
                              Mark Delivered
                            </button>
                          )}
                          {b.status === 4 && (
                            <button
                              className="btn-admin btn-admin--success btn-admin--sm"
                              onClick={() => handleUpdateOrderStatus(b.id, 6)}
                            >
                              Inspect & Close
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL: RENT ITEM & CHECKOUT ESCROW                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {selectedItem && (
        <div className="mp-modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <div>
                <h3>Rent "{selectedItem.title}"</h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Supplied by {selectedItem.vendorStoreName} • {selectedItem.city}
                </span>
              </div>
              <button className="mp-modal__close" onClick={() => setSelectedItem(null)}>✕</button>
            </div>

            <div className="mp-modal__body">
              {/* Photo & Specs */}
              <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <img
                  src={selectedItem.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80'}
                  alt={selectedItem.title}
                  style={{ width: 140, height: 110, borderRadius: 10, objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    {selectedItem.brand} {selectedItem.model ? `• ${selectedItem.model}` : ''}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>
                    {selectedItem.description}
                  </div>
                </div>
              </div>

              {/* Choose Tenure */}
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                Select Monthly Subscription Duration:
              </label>

              <div className="mp-tenure-picker">
                <div
                  className={`mp-tenure-option ${modalTenure === 3 ? 'selected' : ''}`}
                  onClick={() => setModalTenure(3)}
                >
                  <div className="mp-tenure-title">3 Months</div>
                  <div className="mp-tenure-price">₹{calculateRent(selectedItem.monthlyRent, 3)}<span>/mo</span></div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>Standard</div>
                </div>

                <div
                  className={`mp-tenure-option ${modalTenure === 6 ? 'selected' : ''}`}
                  onClick={() => setModalTenure(6)}
                >
                  <div className="mp-tenure-title">6 Months</div>
                  <div className="mp-tenure-price">₹{calculateRent(selectedItem.monthlyRent, 6)}<span>/mo</span></div>
                  <div className="mp-tenure-save">Save 10% monthly</div>
                </div>

                <div
                  className={`mp-tenure-option ${modalTenure === 12 ? 'selected' : ''}`}
                  onClick={() => setModalTenure(12)}
                >
                  <div className="mp-tenure-title">12 Months</div>
                  <div className="mp-tenure-price">₹{calculateRent(selectedItem.monthlyRent, 12)}<span>/mo</span></div>
                  <div className="mp-tenure-save">Save 20% monthly</div>
                </div>
              </div>

              {/* Escrow Guarantee Box */}
              <div className="mp-escrow-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div>
                  <h4>RentAssure Escrow Shield</h4>
                  <p>
                    Your refundable security deposit of <strong>₹{selectedItem.securityDeposit}</strong> is held safely in escrow and is NOT transferred to the vendor. It will be automatically returned to your original payment card when the subscription concludes.
                  </p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="mp-form-group">
                <label>Doorstep Delivery Address</label>
                <input
                  type="text"
                  className="mp-form-input"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. 742 Mission St, Apt 300"
                />
              </div>

              <div className="mp-form-group">
                <label>City Hub</label>
                <input
                  type="text"
                  className="mp-form-input"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                />
              </div>

              {/* Order Breakdown */}
              <div className="mp-order-summary">
                <div className="mp-summary-row">
                  <span>First Month Rental Rate ({modalTenure} mo commitment)</span>
                  <span><strong>₹{calculateRent(selectedItem.monthlyRent, modalTenure).toFixed(2)}</strong></span>
                </div>
                <div className="mp-summary-row">
                  <span>Refundable Security Deposit (Held in Escrow)</span>
                  <span><strong>₹{selectedItem.securityDeposit.toFixed(2)}</strong></span>
                </div>
                <div className="mp-summary-row">
                  <span>Doorstep Delivery & Assembly</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>FREE</span>
                </div>
                <div className="mp-summary-row mp-summary-row--total">
                  <span>Total Due Today</span>
                  <span>₹{(calculateRent(selectedItem.monthlyRent, modalTenure) + selectedItem.securityDeposit).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mp-modal__footer">
              <button className="btn-admin btn-admin--secondary" onClick={() => setSelectedItem(null)}>
                Cancel
              </button>
              <button
                className="btn-admin btn-admin--primary"
                onClick={handleConfirmRental}
                disabled={submittingBooking}
              >
                {submittingBooking ? 'Securing Escrow...' : 'Confirm Subscription & Lock Escrow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL: REQUEST RETURN / PICKUP                                 */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {returnModalBooking && (
        <div className="mp-modal-backdrop" onClick={() => setReturnModalBooking(null)}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <h3>Schedule Return Pickup</h3>
              <button className="mp-modal__close" onClick={() => setReturnModalBooking(null)}>✕</button>
            </div>
            <div className="mp-modal__body">
              <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1rem' }}>
                Item: <strong>{returnModalBooking.itemTitle}</strong> from <strong>{returnModalBooking.vendorStoreName}</strong>.
              </p>
              <div className="mp-form-group">
                <label>Reason for Ending Rental</label>
                <select
                  className="mp-form-input"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                >
                  <option value="Relocating to another city">Relocating to another city</option>
                  <option value="Rental period completed">Rental period completed</option>
                  <option value="Upgrading to newer model">Upgrading to newer model</option>
                  <option value="No longer needed">No longer needed</option>
                </select>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#059669' }}>
                ✓ The vendor's logistics team will inspect the item at pickup. Upon confirmation, your deposit of ${returnModalBooking.securityDeposit} will be unlocked.
              </p>
            </div>
            <div className="mp-modal__footer">
              <button className="btn-admin btn-admin--secondary" onClick={() => setReturnModalBooking(null)}>Cancel</button>
              <button className="btn-admin btn-admin--primary" onClick={handleSubmitReturn}>Submit Pickup Request</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL: REPORT DISPUTE                                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {disputeModalBooking && (
        <div className="mp-modal-backdrop" onClick={() => setDisputeModalBooking(null)}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <h3>File Trust & Safety Dispute</h3>
              <button className="mp-modal__close" onClick={() => setDisputeModalBooking(null)}>✕</button>
            </div>
            <div className="mp-modal__body">
              <div className="mp-form-group">
                <label>Dispute Category</label>
                <select
                  className="mp-form-input"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                >
                  <option value={1}>Damage Assessment Disagreement</option>
                  <option value={2}>Deposit Deduction Dispute</option>
                  <option value={3}>Delivery / Transit Failure</option>
                  <option value={5}>Item Condition Mismatch Upon Delivery</option>
                </select>
              </div>
              <div className="mp-form-group">
                <label>Detailed Description</label>
                <textarea
                  className="mp-form-input"
                  rows={4}
                  placeholder="Provide context, timeline, and description of the issue..."
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                />
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                All escrow disbursements are paused until RentAssure Platform Administrators review statements and photographic evidence.
              </p>
            </div>
            <div className="mp-modal__footer">
              <button className="btn-admin btn-admin--secondary" onClick={() => setDisputeModalBooking(null)}>Cancel</button>
              <button className="btn-admin btn-admin--danger" onClick={handleSubmitDispute}>File Dispute Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL: VENDOR LIST NEW ITEM                                    */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {newItemModal && (
        <div className="mp-modal-backdrop" onClick={() => setNewItemModal(false)}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <h3>List New Rental Item</h3>
              <button className="mp-modal__close" onClick={() => setNewItemModal(false)}>✕</button>
            </div>
            <form onSubmit={handleVendorCreateItem}>
              <div className="mp-modal__body">
                <div className="mp-form-group">
                  <label>Item Title</label>
                  <input
                    type="text"
                    required
                    className="mp-form-input"
                    placeholder="e.g. Solid Walnut 4-Seater Dining Set"
                    value={newItemForm.title}
                    onChange={(e) => setNewItemForm({ ...newItemForm, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="mp-form-group">
                    <label>Category</label>
                    <select
                      className="mp-form-input"
                      value={newItemForm.categoryId}
                      onChange={(e) => setNewItemForm({ ...newItemForm, categoryId: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mp-form-group">
                    <label>Condition</label>
                    <select
                      className="mp-form-input"
                      value={newItemForm.condition}
                      onChange={(e) => setNewItemForm({ ...newItemForm, condition: e.target.value })}
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="Like New">Like New</option>
                      <option value="Refurbished">Refurbished</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="mp-form-group">
                    <label>Monthly Rent (₹)</label>
                    <input
                      type="number"
                      required
                      className="mp-form-input"
                      placeholder="85"
                      value={newItemForm.monthlyRent}
                      onChange={(e) => setNewItemForm({ ...newItemForm, monthlyRent: e.target.value })}
                    />
                  </div>

                  <div className="mp-form-group">
                    <label>Deposit (₹)</label>
                    <input
                      type="number"
                      className="mp-form-input"
                      placeholder="300"
                      value={newItemForm.securityDeposit}
                      onChange={(e) => setNewItemForm({ ...newItemForm, securityDeposit: e.target.value })}
                    />
                  </div>

                  <div className="mp-form-group">
                    <label>Min Months</label>
                    <input
                      type="number"
                      className="mp-form-input"
                      value={newItemForm.minimumRentalMonths}
                      onChange={(e) => setNewItemForm({ ...newItemForm, minimumRentalMonths: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="mp-form-group">
                    <label>City Hub</label>
                    <input
                      type="text"
                      className="mp-form-input"
                      value={newItemForm.city}
                      onChange={(e) => setNewItemForm({ ...newItemForm, city: e.target.value })}
                    />
                  </div>
                  <div className="mp-form-group">
                    <label>Area / Neighborhood</label>
                    <input
                      type="text"
                      className="mp-form-input"
                      value={newItemForm.area}
                      onChange={(e) => setNewItemForm({ ...newItemForm, area: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mp-form-group">
                  <label>Photo URL</label>
                  <input
                    type="url"
                    className="mp-form-input"
                    value={newItemForm.imageUrl}
                    onChange={(e) => setNewItemForm({ ...newItemForm, imageUrl: e.target.value })}
                  />
                </div>

                <div className="mp-form-group">
                  <label>Description & Dimensions</label>
                  <textarea
                    className="mp-form-input"
                    rows={3}
                    placeholder="Provide details about condition, maintenance, materials, or assembly..."
                    value={newItemForm.description}
                    onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="mp-modal__footer">
                <button type="button" className="btn-admin btn-admin--secondary" onClick={() => setNewItemModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin btn-admin--primary">
                  Publish to Marketplace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
