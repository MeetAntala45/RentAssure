import React, { useState, useEffect } from 'react';
import { vendorApi } from '../../../../src/shared/api';

const SAMPLE_IMAGE_PRESETS = [
  {
    name: 'Velvet Sofa',
    url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Standing Desk',
    url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Ergonomic Chair',
    url: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Solid Dining Table',
    url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'PS5 Console',
    url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: '4K Laser Projector',
    url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
  },
];

const RentalItemFormModal = ({
  isOpen,
  onClose,
  itemToEdit = null,
  onItemSaved = () => {},
}) => {
  const isEditMode = Boolean(itemToEdit);

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('RentAssure Premier');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState('Brand New');
  const [duration, setDuration] = useState(3);
  const [monthlyRent, setMonthlyRent] = useState(65);
  const [securityDeposit, setSecurityDeposit] = useState(195);
  const [city, setCity] = useState('Ahmedabad');
  const [area, setArea] = useState('Downtown');
  const [status, setStatus] = useState(1); // 1 = Available, 2 = Rented, 3 = UnderMaintenance, 4 = Inactive
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [includesDelivery, setIncludesDelivery] = useState(true);
  const [includesProtection, setIncludesProtection] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch categories on open
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await vendorApi.getCategories();
        if (res.data && res.data.length > 0) {
          setCategories(res.data);
          if (!isEditMode && !categoryId) {
            setCategoryId(res.data[0].id);
          }
        }
      } catch {
        setCategories([
          { id: 1, name: 'Living & Bedroom Furniture' },
          { id: 2, name: 'Home Appliances' },
          { id: 3, name: 'Office & Workspaces' },
          { id: 4, name: 'Electronics & Pro AV' },
          { id: 5, name: 'Fitness & Event Rentals' },
        ]);
        if (!isEditMode && !categoryId) setCategoryId(1);
      }
    };

    if (isOpen) {
      fetchCats();
    }
  }, [isOpen, isEditMode]);

  // Sync state with itemToEdit or default
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (itemToEdit) {
        setTitle(itemToEdit.title || '');
        setCategoryId(itemToEdit.categoryId || (categories[0]?.id || 1));
        setBrand(itemToEdit.brand || 'RentAssure Premier');
        setModel(itemToEdit.model || '');
        setCondition(itemToEdit.condition || 'Brand New');
        setDuration(itemToEdit.minimumRentalMonths || 3);
        setMonthlyRent(itemToEdit.monthlyRent || 45);
        setSecurityDeposit(itemToEdit.securityDeposit || Math.round((itemToEdit.monthlyRent || 45) * 3));
        setCity(itemToEdit.city || 'Ahmedabad');
        setArea(itemToEdit.area || 'Downtown Hub');
        setStatus(itemToEdit.status || 1);
        setDescription(itemToEdit.description || '');
        setImages(itemToEdit.images && itemToEdit.images.length > 0
          ? [...itemToEdit.images]
          : [SAMPLE_IMAGE_PRESETS[0].url]
        );
        setIncludesDelivery(true);
        setIncludesProtection(false);
      } else {
        // Defaults for new item
        setTitle('');
        setBrand('RentAssure Premier');
        setModel('Series-2026');
        setCondition('Brand New');
        setDuration(3);
        setMonthlyRent(75);
        setSecurityDeposit(225);
        setCity('Ahmedabad');
        setArea('Downtown');
        setStatus(1);
        setDescription('Certified professional-grade rental item, fully inspected, sanitized, and backed by RentAssure quality assurance.');
        setImages([
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        ]);
        setIncludesDelivery(true);
        setIncludesProtection(false);
      }
    }
  }, [isOpen, itemToEdit]);

  if (!isOpen) return null;

  // Live profit calculation
  const parsedRent = parseFloat(monthlyRent) || 0;
  const commissionRate = 0.12; // 12% platform fee
  const platformFee = Math.round(parsedRent * commissionRate * 100) / 100;
  const netVendorProfit = Math.max(0, Math.round((parsedRent - platformFee) * 100) / 100);

  const handleAddImage = (urlToAdd) => {
    const targetUrl = urlToAdd || newImageUrl.trim();
    if (targetUrl) {
      if (!images.includes(targetUrl)) {
        setImages([...images, targetUrl]);
      }
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  const handleMakePrimary = (index) => {
    if (index === 0) return;
    const item = images[index];
    const filtered = images.filter((_, idx) => idx !== index);
    setImages([item, ...filtered]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Product title is required.');
      return;
    }

    if (parsedRent <= 0) {
      setError('Monthly rent must be greater than ₹0.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        categoryId: parseInt(categoryId, 10),
        title: title.trim(),
        description: description.trim(),
        brand: brand?.trim() || 'RentAssure Premier',
        model: model?.trim() || '',
        condition: condition || 'Brand New',
        monthlyRent: parsedRent,
        securityDeposit: parseFloat(securityDeposit) || Math.round(parsedRent * 3),
        minimumRentalMonths: parseInt(duration, 10) || 1,
        city: city?.trim() || 'Ahmedabad',
        area: area?.trim() || 'Downtown',
        images: images.length > 0 ? images : [SAMPLE_IMAGE_PRESETS[0].url],
        status: parseInt(status, 10),
      };

      let res;
      if (isEditMode) {
        res = await vendorApi.updateItem(itemToEdit.id, payload);
      } else {
        res = await vendorApi.createItem(payload);
      }

      if (res && res.data) {
        onItemSaved(res.data, isEditMode);
        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        `Failed to ${isEditMode ? 'update' : 'create'} rental item. Please review fields and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ra-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ra-modal-dialog" style={{ maxWidth: '720px', width: '92%' }}>
        {/* Modal Header */}
        <div className="ra-modal-header" style={{ background: '#f8fafc' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="ra-modal-title" style={{ fontSize: '18px', fontWeight: 800 }}>
                {isEditMode ? `Edit Rental Product` : `Add New Rental Product`}
              </h3>
              {isEditMode && (
                <span
                  className="ra-badge"
                  style={{
                    fontSize: '11px',
                    background: '#f4f4f5',
                    color: '#18181b',
                    border: '1px solid #d4d4d8',
                  }}
                >
                  {status === 1 ? '● Available' : status === 2 ? '● Rented' : status === 3 ? '● Maintenance' : '● Inactive'}
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isEditMode
                ? `Update specifications, monthly pricing, pictures, and live availability.`
                : `List a new item from your store to earn recurring monthly rental revenue.`}
            </p>
          </div>
          <button className="ra-modal-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Modal Body */}
          <div className="ra-modal-body" style={{ padding: '20px 24px' }}>
            {error && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger-text)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ─── 1. CORE DETAILS: Name & Category ─── */}
            <div className="ra-row-responsive-unequal" style={{ marginBottom: '14px' }}>
              <div className="ra-form-group" style={{ margin: 0 }}>
                <label className="ra-label" style={{ fontWeight: 700, fontSize: '13px' }}>
                  Product Title / Name <span style={{ color: 'var(--danger-text)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="ra-input"
                  placeholder="e.g. Modena 3-Seater Velvet Sofa with Chaise"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="ra-form-group" style={{ margin: 0 }}>
                <label className="ra-label" style={{ fontWeight: 700, fontSize: '13px' }}>
                  Category <span style={{ color: 'var(--danger-text)' }}>*</span>
                </label>
                <select
                  className="ra-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ─── 2. BRAND, MODEL & CONDITION ─── */}
            <div className="ra-row-responsive-3" style={{ marginBottom: '16px' }}>
              <div className="ra-form-group" style={{ margin: 0 }}>
                <label className="ra-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  className="ra-input"
                  placeholder="e.g. West Elm, Herman Miller"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="ra-form-group" style={{ margin: 0 }}>
                <label className="ra-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                  Model / Variant
                </label>
                <input
                  type="text"
                  className="ra-input"
                  placeholder="e.g. Series 2026 / Size B"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>

              <div className="ra-form-group" style={{ margin: 0 }}>
                <label className="ra-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                  Condition
                </label>
                <select
                  className="ra-select"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="Brand New">Brand New</option>
                  <option value="Like New">Like New</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Gently Used">Gently Used</option>
                </select>
              </div>
            </div>

            {/* ─── 3. PRICING & PROFIT ESTIMATION CARD ─── */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💵</span> Rental Pricing & Take-Home Profit
                </div>
                <span className="ra-badge ra-badge-active" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  88% Vendor Take-Home
                </span>
              </div>

              <div className="ra-row-responsive-3" style={{ alignItems: 'flex-start' }}>
                <div className="ra-form-group" style={{ margin: 0 }}>
                  <label className="ra-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                    Monthly Rent (₹)*
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                    <input
                      type="number"
                      min="1"
                      required
                      className="ra-input"
                      style={{ paddingLeft: '28px' }}
                      value={monthlyRent}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMonthlyRent(val);
                        const num = parseFloat(val) || 0;
                        setSecurityDeposit(Math.round(num * 3));
                      }}
                    />
                  </div>
                </div>

                <div className="ra-form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="ra-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                      Security Deposit (₹)*
                    </label>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setSecurityDeposit(Math.round(parsedRent * 2))}
                        style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-light)', background: '#fff', cursor: 'pointer' }}
                      >
                        2x
                      </button>
                      <button
                        type="button"
                        onClick={() => setSecurityDeposit(Math.round(parsedRent * 3))}
                        style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-light)', background: '#fff', cursor: 'pointer' }}
                      >
                        3x
                      </button>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      required
                      className="ra-input"
                      style={{ paddingLeft: '28px' }}
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ra-form-group" style={{ margin: 0 }}>
                  <label className="ra-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                    Min. Tenure (mo)*
                  </label>
                  <select
                    className="ra-select"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                  </select>
                </div>
              </div>

              {/* Live Net Profit Banner */}
              <div
                style={{
                  marginTop: '12px',
                  background: 'var(--primary-subtle)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>💹</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                      Net Merchant Profit: <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 800 }}>₹{netVendorProfit.toFixed(2)} / month</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Customer pays ₹{parsedRent.toFixed(2)}/mo • 12% marketplace fee (₹{platformFee.toFixed(2)}) automatically deducted
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-body)' }}>
                    Security Deposit: ₹{parseFloat(securityDeposit) || 0} held in Escrow
                  </span>
                </div>
              </div>
            </div>

            {/* ─── 4. LOCATION & STATUS ─── */}
            <div className={isEditMode ? "ra-row-responsive-3" : "ra-row-responsive-2"} style={{ marginBottom: '16px' }}>
              <div className="ra-form-group" style={{ margin: 0 }}>
                <label className="ra-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                  Service City
                </label>
                <input
                  type="text"
                  className="ra-input"
                  placeholder="e.g. Ahmedabad"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="ra-form-group" style={{ margin: 0 }}>
                <label className="ra-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                  Area / Neighborhood
                </label>
                <input
                  type="text"
                  className="ra-input"
                  placeholder="e.g. Downtown / SOMA"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>

              {isEditMode && (
                <div className="ra-form-group" style={{ margin: 0 }}>
                  <label className="ra-label" style={{ fontWeight: 700, fontSize: '12px', color: 'var(--primary)' }}>
                    Listing Status
                  </label>
                  <select
                    className="ra-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="1">Available (Live for Rent)</option>
                    <option value="2">Rented (Active Subscription)</option>
                    <option value="3">Under Maintenance</option>
                    <option value="4">Inactive (Hidden)</option>
                  </select>
                </div>
              )}
            </div>

            {/* ─── 5. DESCRIPTION ─── */}
            <div className="ra-form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="ra-label" style={{ fontWeight: 700, fontSize: '13px' }}>
                  Product Description <span style={{ color: 'var(--danger-text)' }}>*</span>
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                  {description.length}/600 chars
                </span>
              </div>
              <textarea
                required
                maxLength={600}
                className="ra-textarea"
                rows={3}
                placeholder="Detail the materials, ergonomics, dimensions, accessories included, and rental care instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* ─── 6. PHOTO GALLERY & IMAGE MANAGEMENT ─── */}
            <div className="ra-form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="ra-label" style={{ fontWeight: 700, fontSize: '13px', margin: 0 }}>
                  Product Photos ({images.length})
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  First photo is the primary cover displayed to customers
                </span>
              </div>

              {/* Photo thumbnails row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      width: '74px',
                      height: '74px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: idx === 0 ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    }}
                  >
                    <img src={img} alt={`Item ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                    {idx === 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: 2,
                          background: 'var(--primary)',
                          color: '#fff',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 4px',
                          borderRadius: '4px',
                        }}
                      >
                        Cover
                      </span>
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        display: 'flex',
                        gap: '2px',
                      }}
                    >
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMakePrimary(idx)}
                          title="Set as Cover"
                          style={{
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            width: '18px',
                            height: '18px',
                            fontSize: '9px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ⭐
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        title="Remove Photo"
                        style={{
                          background: 'rgba(220,38,38,0.85)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add custom URL row */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="url"
                  className="ra-input"
                  style={{ flex: 1, height: '36px', fontSize: '13px' }}
                  placeholder="Paste direct image URL (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                />
                <button
                  type="button"
                  className="ra-btn ra-btn-secondary ra-btn-sm"
                  onClick={() => handleAddImage()}
                  disabled={!newImageUrl.trim()}
                >
                  + Add URL
                </button>
              </div>

              {/* Quick Preset Image Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 600 }}>Quick Presets:</span>
                {SAMPLE_IMAGE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddImage(preset.url)}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-light)',
                      background: '#f8fafc',
                      color: 'var(--text-body)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-body)'; }}
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── 7. SERVICE TOGGLES ─── */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
              <div className="ra-toggle-row">
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Delivery & Professional Setup Included
                </span>
                <label className="ra-switch">
                  <input
                    type="checkbox"
                    checked={includesDelivery}
                    onChange={(e) => setIncludesDelivery(e.target.checked)}
                  />
                  <span className="ra-slider" />
                </label>
              </div>

              <div className="ra-toggle-row">
                <span style={{ fontSize: '13px', color: 'var(--text-body)' }}>
                  Free Damage Protection Waiver Included
                </span>
                <label className="ra-switch">
                  <input
                    type="checkbox"
                    checked={includesProtection}
                    onChange={(e) => setIncludesProtection(e.target.checked)}
                  />
                  <span className="ra-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="ra-modal-footer">
            <button
              type="button"
              className="ra-btn ra-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="ra-btn ra-btn-primary"
              style={{ minWidth: '130px' }}
            >
              {loading ? (
                <span>Saving...</span>
              ) : isEditMode ? (
                <span>Save Changes</span>
              ) : (
                <span>Publish Listing</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalItemFormModal;
