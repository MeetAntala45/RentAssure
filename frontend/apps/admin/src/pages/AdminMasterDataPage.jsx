import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../../../src/shared/api';

const PRESET_ICONS = [
  { icon: '🛋️', label: 'Furniture' },
  { icon: '❄️', label: 'Appliances' },
  { icon: '📺', label: 'AV & TV' },
  { icon: '💻', label: 'Computers' },
  { icon: '📷', label: 'Cameras' },
  { icon: '🚴', label: 'Fitness' },
  { icon: '🎉', label: 'Events' },
  { icon: '🛠️', label: 'Tools' },
  { icon: '🎮', label: 'Gaming' },
  { icon: '🪑', label: 'Office' },
  { icon: '🧺', label: 'Laundry' },
  { icon: '🏷️', label: 'General' },
];

const DISPUTE_MATRIX = [
  {
    code: '1',
    name: 'Damage Assessment',
    description: 'Merchant claims product damage occurred during customer rental tenure.',
    sla: '48 Hours',
    evidence: 'Pre-dispatch handover photos vs. Return pickup inspection report',
    escrowAction: 'Deposit frozen in escrow until repair quote is validated or settled.',
  },
  {
    code: '2',
    name: 'Deposit Deduction Dispute',
    description: 'Customer contests proposed security deposit deductions made by merchant.',
    sla: '24 Hours',
    evidence: 'Item condition checklists, fair wear-and-tear assessment guideline',
    escrowAction: 'Arbitrator inspects claims; releases undisputed balance immediately.',
  },
  {
    code: '3',
    name: 'Delivery Failure / Delay',
    description: 'Merchant failed to deliver or delayed doorstep setup beyond agreed date.',
    sla: '12 Hours',
    evidence: 'Scheduled delivery date and time-stamped delivery attempt logs',
    escrowAction: 'Full upfront charge and deposit refunded if merchant cannot fulfill.',
  },
  {
    code: '4',
    name: 'Late Return & Logistics Delay',
    description: 'Disagreement regarding pickup scheduling or delayed item retrieval.',
    sla: '24 Hours',
    evidence: 'Customer return request timestamp and merchant dispatch notes',
    escrowAction: 'Rent pro-rated daily until confirmed merchant pickup.',
  },
  {
    code: '5',
    name: 'Item Condition Mismatch',
    description: 'Delivered item does not match listing photos, specs, or promised grade.',
    sla: '24 Hours',
    evidence: 'Store listing photographs, customer unboxing photo & complaint ticket',
    escrowAction: 'Free replacement mandated within 24 hours or full refund with zero penalty.',
  },
];

const STANDARD_CITIES = [
  { name: 'Ahmedabad', state: 'Gujarat', tier: 'Tier 1 Metro', hubStatus: 'Active Fulfillment Hub', sla: '24-48 Hours', popular: true },
  { name: 'Surat', state: 'Gujarat', tier: 'Tier 1 Metro', hubStatus: 'Active Fulfillment Hub', sla: '24-48 Hours', popular: true },
  { name: 'Vadodara', state: 'Gujarat', tier: 'Tier 2 Hub', hubStatus: 'Active Fulfillment Hub', sla: '24-48 Hours', popular: true },
  { name: 'Rajkot', state: 'Gujarat', tier: 'Tier 2 Hub', hubStatus: 'Active Fulfillment Hub', sla: '24-48 Hours', popular: true },
  { name: 'Gandhinagar', state: 'Gujarat', tier: 'Capital Region', hubStatus: 'Active Fulfillment Hub', sla: '24-48 Hours', popular: true },
  { name: 'Bhavnagar', state: 'Gujarat', tier: 'Tier 2 Regional', hubStatus: 'Express Delivery Hub', sla: '48 Hours', popular: false },
  { name: 'Jamnagar', state: 'Gujarat', tier: 'Tier 2 Regional', hubStatus: 'Express Delivery Hub', sla: '48 Hours', popular: false },
  { name: 'Anand', state: 'Gujarat', tier: 'Educational Corridor', hubStatus: 'Active Fulfillment Hub', sla: '24-48 Hours', popular: false },
];

const renderIcon = (icon) => {
  if (!icon) return '🏷️';
  if (icon.startsWith('bi-') || icon.startsWith('bi ')) {
    const map = {
      'bi-house-heart': '🛋️',
      'bi-plug': '❄️',
      'bi-display': '📺',
      'bi-bicycle': '🚴',
      'bi-camera': '📷',
      'bi-laptop': '💻',
      'bi-tools': '🛠️',
    };
    return map[icon] || '🏷️';
  }
  return icon;
};

const AdminMasterDataPage = () => {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'settings' | 'cities' | 'disputes'

  // Categories state
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catSearch, setCatSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('🏷️');
  const [catDescription, setCatDescription] = useState('');
  const [catCommissionRate, setCatCommissionRate] = useState(10.0);
  const [catIsActive, setCatIsActive] = useState(true);
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catError, setCatError] = useState('');

  // Delete Category confirmation
  const [deletingCatId, setDeletingCatId] = useState(null);

  // Settings State
  const [settings, setSettings] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsGroupFilter, setSettingsGroupFilter] = useState('All');
  const [editingSetting, setEditingSetting] = useState(null);
  const [newSettingVal, setNewSettingVal] = useState('');
  const [settingSubmitting, setSettingSubmitting] = useState(false);
  const [settingError, setSettingError] = useState('');

  // Cities State
  const [liveCities, setLiveCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  // Global Alert Message
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // ─── FETCH CATEGORIES ───────────────────────────────────────────────────────
  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const res = await adminApi.getCategories();
      if (res.data && Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  };

  // ─── FETCH SETTINGS ────────────────────────────────────────────────────────
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await adminApi.getSettings();
      if (res.data && Array.isArray(res.data)) {
        setSettings(res.data);
      } else {
        setSettings([]);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setSettings([]);
    } finally {
      setSettingsLoading(false);
    }
  };

  // ─── FETCH CITIES ──────────────────────────────────────────────────────────
  const fetchCities = async () => {
    setCitiesLoading(true);
    try {
      const res = await adminApi.getCities();
      if (res.data && Array.isArray(res.data)) {
        setLiveCities(res.data);
      }
    } catch {
      // fallback
    } finally {
      setCitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'settings' && settings.length === 0) {
      fetchSettings();
    }
    if (activeTab === 'cities' && liveCities.length === 0) {
      fetchCities();
    }
  }, [activeTab]);

  // ─── CATEGORY HANDLERS ─────────────────────────────────────────────────────
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatIcon('🏷️');
    setCatDescription('');
    setCatCommissionRate(10.0);
    setCatIsActive(true);
    setCatError('');
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name || '');
    setCatSlug(cat.slug || '');
    setCatIcon(renderIcon(cat.icon) || '🏷️');
    setCatDescription(cat.description || '');
    setCatCommissionRate(cat.commissionRate !== undefined ? cat.commissionRate : 10.0);
    setCatIsActive(cat.isActive !== undefined ? cat.isActive : true);
    setCatError('');
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      setCatError('Category name is required.');
      return;
    }

    setCatSubmitting(true);
    setCatError('');

    const payload = {
      name: catName.trim(),
      description: catDescription.trim() || `${catName.trim()} rentals and equipment`,
      icon: catIcon.trim() || '🏷️',
      commissionRate: Number(catCommissionRate) || 10.0,
      isActive: Boolean(catIsActive),
    };

    try {
      if (editingCategory) {
        const res = await adminApi.updateCategory(editingCategory.id, payload);
        if (res.isSuccess || res.IsSuccess) {
          showToast(`Category "${catName}" updated successfully!`);
          setShowCategoryModal(false);
          fetchCategories();
        } else {
          setCatError(res.message || res.Message || 'Failed to update category.');
        }
      } else {
        const res = await adminApi.createCategory(payload);
        if (res.isSuccess || res.IsSuccess) {
          showToast(`New category "${catName}" created successfully!`);
          setShowCategoryModal(false);
          fetchCategories();
        } else {
          setCatError(res.message || res.Message || 'Failed to create category.');
        }
      }
    } catch (err) {
      setCatError(err.response?.data?.message || 'Operation failed. Please review your inputs.');
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleToggleCategoryStatus = async (cat) => {
    try {
      const res = await adminApi.toggleCategoryStatus(cat.id);
      if (res.isSuccess || res.IsSuccess) {
        showToast(`Category "${cat.name}" is now ${!cat.isActive ? 'Active' : 'Inactive'}.`);
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
        );
      } else {
        showToast(res.message || 'Failed to toggle category status.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle status.', 'error');
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingCatId(cat.id);
    try {
      const res = await adminApi.deleteCategory(cat.id);
      if (res.isSuccess || res.IsSuccess) {
        showToast(`Category "${cat.name}" deleted successfully.`);
        fetchCategories();
      } else {
        showToast(res.message || res.Message || 'Failed to delete category.', 'error');
      }
    } catch (err) {
      showToast(
        err.response?.data?.message ||
        `Cannot delete "${cat.name}" because it has active rental items. Deactivate it instead.`,
        'error'
      );
    } finally {
      setDeletingCatId(null);
    }
  };

  // ─── SETTINGS HANDLERS ─────────────────────────────────────────────────────
  const handleOpenEditSetting = (setting) => {
    setEditingSetting(setting);
    setNewSettingVal(setting.settingValue);
    setSettingError('');
  };

  const handleSaveSetting = async (e) => {
    e.preventDefault();
    if (!newSettingVal.trim()) {
      setSettingError('Setting value cannot be empty.');
      return;
    }

    setSettingSubmitting(true);
    setSettingError('');

    try {
      const res = await adminApi.updateSetting(editingSetting.settingKey, newSettingVal.trim());
      if (res.isSuccess || res.IsSuccess) {
        showToast(`Setting "${editingSetting.settingKey}" updated to "${newSettingVal.trim()}"!`);
        setSettings((prev) =>
          prev.map((s) =>
            s.settingKey === editingSetting.settingKey ? { ...s, settingValue: newSettingVal.trim() } : s
          )
        );
        setEditingSetting(null);
      } else {
        setSettingError(res.message || res.Message || 'Failed to update setting.');
      }
    } catch (err) {
      setSettingError(err.response?.data?.message || 'Failed to save setting.');
    } finally {
      setSettingSubmitting(false);
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        !catSearch ||
        c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
        (c.slug && c.slug.toLowerCase().includes(catSearch.toLowerCase()));
      const matchesFilter =
        catFilter === 'all' ||
        (catFilter === 'active' && c.isActive) ||
        (catFilter === 'inactive' && !c.isActive);
      return matchesSearch && matchesFilter;
    });
  }, [categories, catSearch, catFilter]);

  // Filtered settings
  const filteredSettings = useMemo(() => {
    if (settingsGroupFilter === 'All') return settings;
    return settings.filter((s) => s.group?.toLowerCase() === settingsGroupFilter.toLowerCase());
  }, [settings, settingsGroupFilter]);

  // Combined cities list
  const combinedCities = useMemo(() => {
    const list = [...STANDARD_CITIES];
    liveCities.forEach((city) => {
      if (!list.some((c) => c.name.toLowerCase() === city.toLowerCase())) {
        list.push({
          name: city,
          state: 'Network Hub',
          tier: 'Regional Hub',
          hubStatus: 'Active Fulfillment Hub',
          sla: '24-48 Hours',
          popular: false,
        });
      }
    });
    if (!citySearch) return list;
    return list.filter((c) => c.name.toLowerCase().includes(citySearch.toLowerCase()));
  }, [liveCities, citySearch]);

  const activeCategoriesCount = categories.filter((c) => c.isActive).length;
  const avgCommission =
    categories.length > 0
      ? (categories.reduce((acc, c) => acc + (Number(c.commissionRate) || 0), 0) / categories.length).toFixed(1)
      : '12.0';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: toastMsg.type === 'error' ? '#b91c1c' : '#033047',
            color: '#ffffff',
            padding: '12px 22px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            fontSize: '13px',
            fontWeight: 700,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'raSlideInUp 0.25s ease',
          }}
        >
          <span>{toastMsg.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ─── 1. TOP HEADER & KPI METRICS ───────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #033047 0%, #304C62 100%)',
          borderRadius: '18px',
          padding: '28px 32px',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(3, 48, 71, 0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '20px' }}>🏛️</span>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#cbd5e1' }}>
                System Administration
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
              Master Data & Platform Governance
            </h1>
            <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
              Configure rental service types, default commission brackets, regulated escrow release terms, and operational city hubs across the marketplace.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenAddCategory}
              className="ra-btn ra-btn-primary"
              style={{
                background: '#ffffff',
                color: 'var(--primary)',
                fontWeight: 800,
                borderRadius: '10px',
                padding: '10px 20px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              + Add Service Category
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px 16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>Service Categories</span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
              {categories.length} <span style={{ fontSize: '12px', fontWeight: 500, color: '#86efac' }}>({activeCategoriesCount} Active)</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px 16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>Avg Commission Bracket</span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
              {avgCommission}% <span style={{ fontSize: '11px', fontWeight: 500, color: '#cbd5e1' }}>Per Subscription</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px 16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>Active City Hubs</span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
              {combinedCities.length} Cities <span style={{ fontSize: '11px', fontWeight: 500, color: '#86efac' }}>(100% Hub Ready)</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px 16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>Escrow Release Protocol</span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: '#fde047' }}>
              48h Inspection <span style={{ fontSize: '11px', fontWeight: 500, color: '#ffffff' }}>/ 7d SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. MASTER DATA TABS ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: '#ffffff',
          padding: '6px',
          borderRadius: '14px',
          border: '1px solid var(--border-light)',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          style={{
            flex: '1 1 180px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'categories' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'categories' ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>🏷️</span>
          <span>Rental Categories ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            flex: '1 1 180px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'settings' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'settings' ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>⚙️</span>
          <span>Financial & Escrow Policies</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cities')}
          style={{
            flex: '1 1 180px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'cities' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'cities' ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>📍</span>
          <span>Serviceable City Hubs ({combinedCities.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('disputes')}
          style={{
            flex: '1 1 180px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'disputes' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'disputes' ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>⚖️</span>
          <span>Dispute & Return Matrix</span>
        </button>
      </div>

      {/* ─── TAB 1: RENTAL CATEGORIES ──────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Controls Bar */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
              <button
                type="button"
                className={`ra-btn ${catFilter === 'all' ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
                onClick={() => setCatFilter('all')}
              >
                All ({categories.length})
              </button>
              <button
                type="button"
                className={`ra-btn ${catFilter === 'active' ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
                onClick={() => setCatFilter('active')}
              >
                Active ({activeCategoriesCount})
              </button>
              <button
                type="button"
                className={`ra-btn ${catFilter === 'inactive' ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
                onClick={() => setCatFilter('inactive')}
              >
                Inactive ({categories.length - activeCategoriesCount})
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder="Search categories by name..."
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                className="ra-input"
                style={{ width: '240px', padding: '7px 12px', fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={handleOpenAddCategory}
                className="ra-btn ra-btn-primary ra-btn-sm"
                style={{ padding: '7px 16px', fontWeight: 800 }}
              >
                + Add Category
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="ra-table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    CATEGORY & ICON
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    SLUG
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    DESCRIPTION
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    DEFAULT COMMISSION
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ACTIVE LISTINGS
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
                {catLoading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading service categories...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No categories found. Click "+ Add Category" to register a new service line.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr
                      key={cat.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              fontSize: '22px',
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: 'var(--primary-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--border-light)',
                            }}
                          >
                            {renderIcon(cat.icon)}
                          </span>
                          <div>
                            <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>
                              {cat.name}
                            </strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: #{cat.id}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <code
                          style={{
                            background: '#f1f5f9',
                            color: '#0f172a',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                        </code>
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '240px' }}>
                        {cat.description || '—'}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: 'var(--primary)',
                            background: 'var(--primary-light)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-light-blue-border)',
                          }}
                        >
                          {cat.commissionRate !== undefined ? Number(cat.commissionRate).toFixed(1) : '10.0'}%
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-body)' }}>
                        📦 {cat.itemCount || 0} items
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        {cat.isActive ? (
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: '#ecfdf5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            ● Active
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#f1f5f9',
                              color: '#64748b',
                              border: '1px solid #cbd5e1',
                            }}
                          >
                            ○ Inactive
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditCategory(cat)}
                            className="ra-btn ra-btn-secondary ra-btn-sm"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            title="Edit Category"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleCategoryStatus(cat)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: '1px solid var(--border-light)',
                              background: '#ffffff',
                              color: cat.isActive ? '#b45309' : '#065f46',
                              cursor: 'pointer',
                            }}
                            title={cat.isActive ? 'Deactivate Category' : 'Activate Category'}
                          >
                            {cat.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            disabled={deletingCatId === cat.id}
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#b91c1c',
                              cursor: 'pointer',
                            }}
                            title="Delete category"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: FINANCIAL & ESCROW POLICIES ─────────────────────────────── */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header & Group Filter */}
          <div
            className="ra-card"
            style={{
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                Regulated Escrow & Platform Policy Parameters
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Changes to these variables update system transaction logic and audit logs in real-time.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Financial', 'Operations', 'General'].map((grp) => (
                <button
                  key={grp}
                  type="button"
                  className={`ra-btn ${settingsGroupFilter === grp ? 'ra-btn-primary' : 'ra-btn-secondary'} ra-btn-sm`}
                  onClick={() => setSettingsGroupFilter(grp)}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Grid */}
          {settingsLoading ? (
            <div className="ra-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading platform parameters...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              {filteredSettings.map((setting) => (
                <div
                  key={setting.id || setting.settingKey}
                  className="ra-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    padding: '20px',
                    border: '1px solid var(--border-light)',
                    borderRadius: '16px',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          background: 'var(--primary-subtle)',
                          color: 'var(--primary)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {setting.group || 'Policy'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Updated: {new Date(setting.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                      {setting.settingKey}
                    </h4>

                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                      {setting.description || 'Configured system setting.'}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Active Value:</span>
                      <strong style={{ fontSize: '18px', color: 'var(--primary)' }}>
                        {setting.settingValue}
                        {setting.settingKey.includes('Rate') && '%'}
                        {setting.settingKey.includes('Days') && ' Days'}
                        {setting.settingKey.includes('Hours') && ' Hours'}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditSetting(setting)}
                      className="ra-btn ra-btn-secondary ra-btn-sm"
                      style={{ padding: '6px 14px', fontWeight: 700 }}
                    >
                      ✏️ Edit Policy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: SERVICEABLE CITIES & HUBS ──────────────────────────────── */}
      {activeTab === 'cities' && (
        <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              background: '#f8fafc',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                Regional Operational Hubs & Service Coverage
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Cities currently receiving peer-to-merchant door-to-door delivery and return pickup logistics.
              </span>
            </div>

            <input
              type="text"
              placeholder="Search city hub..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="ra-input"
              style={{ width: '220px', padding: '7px 12px', fontSize: '13px' }}
            />
          </div>

          <div className="ra-table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    CITY HUB
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    REGION
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    METRO TIER
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    FULFILLMENT GUARANTEE
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    OPERATIONAL STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {combinedCities.map((city) => (
                  <tr
                    key={city.name}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>📍</span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{city.name}</strong>
                        {city.popular && (
                          <span style={{ fontSize: '10px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Major Metro
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {city.state}
                    </td>

                    <td style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--text-body)' }}>
                      {city.tier}
                    </td>

                    <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                      🚚 {city.sla} Doorstep Setup
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: '#ecfdf5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        ● {city.hubStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: DISPUTE & RETURN RESOLUTION MATRIX ────────────────────── */}
      {activeTab === 'disputes' && (
        <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', background: '#f8fafc' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
              Arbitration Standards & Dispute Resolution Matrix
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Official RentAssure SLA protocols and evidence requirements for resolving customer-merchant escrow disputes.
            </p>
          </div>

          <div className="ra-table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    DISPUTE CATEGORY
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    DESCRIPTION & SCOPE
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ARBITRATION SLA
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    REQUIRED EVIDENCE
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ESCROW ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {DISPUTE_MATRIX.map((d) => (
                  <tr
                    key={d.code}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>⚖️</span>
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>
                            {d.name}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Code: {d.code}</span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-body)', maxWidth: '240px' }}>
                      {d.description}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: '#065f46',
                          background: '#ecfdf5',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        ⏱️ {d.sla}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '240px' }}>
                      {d.evidence}
                    </td>

                    <td style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--primary)', maxWidth: '260px' }}>
                      🛡️ {d.escrowAction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT CATEGORY MODAL ─────────────────────────────────────── */}
      {showCategoryModal && (
        <div className="ra-modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setShowCategoryModal(false)}>
          <div
            className="ra-modal-dialog"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ra-modal-header">
              <h3 className="ra-modal-title">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add Service Category'}
              </h3>
              <button
                type="button"
                className="ra-modal-close"
                onClick={() => setShowCategoryModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="ra-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {catError && (
                  <div
                    style={{
                      background: 'var(--danger-bg)',
                      color: 'var(--danger-text)',
                      border: '1px solid var(--danger-border)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {catError}
                  </div>
                )}

                <div className="ra-form-group">
                  <label className="ra-label">
                    Category Name <span style={{ color: 'var(--danger-text)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="ra-input"
                    placeholder="e.g. Ergonomic Chairs & Workstations"
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      if (!editingCategory && !catSlug) {
                        setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                  />
                </div>

                {/* Preset Emoji Picker */}
                <div>
                  <label className="ra-label" style={{ marginBottom: '6px', display: 'block' }}>
                    Category Icon / Emoji: <span style={{ fontSize: '16px' }}>{catIcon}</span>
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {PRESET_ICONS.map((p) => (
                      <button
                        key={p.icon}
                        type="button"
                        onClick={() => setCatIcon(p.icon)}
                        style={{
                          fontSize: '18px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: catIcon === p.icon ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                          background: catIcon === p.icon ? 'var(--primary-light)' : '#ffffff',
                          cursor: 'pointer',
                        }}
                        title={p.label}
                      >
                        {p.icon}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="ra-input"
                    placeholder="Or type custom emoji or icon code"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div className="ra-form-group">
                  <label className="ra-label">
                    Default Platform Commission Rate (%) <span style={{ color: 'var(--danger-text)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    className="ra-input"
                    value={catCommissionRate}
                    onChange={(e) => setCatCommissionRate(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Standard commission deducted from merchant payouts for rentals in this category.
                  </span>
                </div>

                <div className="ra-form-group">
                  <label className="ra-label">Category Description (Optional)</label>
                  <textarea
                    rows={2}
                    className="ra-input"
                    placeholder="e.g. Ergonomic seating, sit-stand motorized desks, and study organizers"
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="catIsActive"
                    checked={catIsActive}
                    onChange={(e) => setCatIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="catIsActive" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}>
                    Active & Available for Merchant Listings
                  </label>
                </div>
              </div>

              <div className="ra-modal-footer">
                <button
                  type="button"
                  className="ra-btn ra-btn-secondary"
                  onClick={() => setShowCategoryModal(false)}
                  disabled={catSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" disabled={catSubmitting} className="ra-btn ra-btn-primary" style={{ fontWeight: 800 }}>
                  {catSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT SETTING MODAL ────────────────────────────────────────────── */}
      {editingSetting && (
        <div className="ra-modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setEditingSetting(null)}>
          <div
            className="ra-modal-dialog"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ra-modal-header">
              <h3 className="ra-modal-title">Edit Policy Parameter</h3>
              <button
                type="button"
                className="ra-modal-close"
                onClick={() => setEditingSetting(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSetting}>
              <div className="ra-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {settingError && (
                  <div
                    style={{
                      background: 'var(--danger-bg)',
                      color: 'var(--danger-text)',
                      border: '1px solid var(--danger-border)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {settingError}
                  </div>
                )}

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Parameter Key
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                    {editingSetting.settingKey}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-body)', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  {editingSetting.description || 'System setting variable.'}
                </div>

                <div className="ra-form-group">
                  <label className="ra-label">
                    Configured Value <span style={{ color: 'var(--danger-text)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="ra-input"
                    value={newSettingVal}
                    onChange={(e) => setNewSettingVal(e.target.value)}
                    style={{ width: '100%', fontSize: '14px', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div className="ra-modal-footer">
                <button
                  type="button"
                  className="ra-btn ra-btn-secondary"
                  onClick={() => setEditingSetting(null)}
                  disabled={settingSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingSubmitting}
                  className="ra-btn ra-btn-primary"
                  style={{ fontWeight: 800 }}
                >
                  {settingSubmitting ? 'Saving...' : 'Save Policy Parameter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMasterDataPage;
