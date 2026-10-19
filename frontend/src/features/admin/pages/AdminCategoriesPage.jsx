import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { useAdminToast } from '../context/AdminToastContext';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    commissionRate: 10.0,
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useAdminToast();

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getCategories();
      if (res.isSuccess) {
        setCategories(res.data || []);
      }
    } catch {
      showToast('error', 'Error', 'Failed to retrieve marketplace categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      commissionRate: 12.0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.Name,
      description: cat.Description || '',
      commissionRate: cat.CommissionRate,
      isActive: cat.IsActive,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id, name) => {
    try {
      const res = await adminService.toggleCategoryStatus(id);
      if (res.isSuccess) {
        showToast('info', 'Status Updated', `Category '${name}' status updated.`);
        fetchCategories();
      }
    } catch {
      showToast('error', 'Error', 'Failed to toggle category.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('error', 'Validation Error', 'Category name is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        const res = await adminService.updateCategory(editingCategory.id, formData);
        if (res.isSuccess) {
          showToast('success', 'Category Saved', `Updated '${formData.name}' successfully.`);
          setIsModalOpen(false);
          fetchCategories();
        }
      } else {
        const res = await adminService.createCategory(formData);
        if (res.isSuccess) {
          showToast('success', 'Category Added', `Created new segment '${formData.name}'.`);
          setIsModalOpen(false);
          fetchCategories();
        }
      }
    } catch {
      showToast('error', 'Save Error', 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1>Catalog Categories & Segment Fees</h1>
          <p>
            Configure rentable inventory classifications and establish category-level commission take rates.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button onClick={handleOpenCreate} className="btn-admin btn-admin--primary btn-admin--sm">
            + New Category
          </button>
        </div>
      </div>

      {/* ─── Categories Cards Grid ───────────────────────────────────── */}
      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          Loading category taxonomy...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {categories.map((cat) => (
            <div key={cat.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="admin-card__header">
                <div>
                  <h3 className="admin-card__title">{cat.Name}</h3>
                  <code style={{ fontSize: '0.72rem', color: '#94a3b8' }}>slug: {cat.Slug}</code>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: cat.IsActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: cat.IsActive ? '#34d399' : '#f87171',
                  }}
                >
                  {cat.IsActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="admin-card__body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                  {cat.Description || 'No description provided.'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Default Commission</span>
                    <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>{cat.CommissionRate}%</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Live Listings</span>
                    <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>{cat.ItemCount} items</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleToggleStatus(cat.id, cat.Name)}
                    className="btn-admin btn-admin--secondary btn-admin--sm"
                  >
                    {cat.IsActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="btn-admin btn-admin--primary btn-admin--sm"
                  >
                    Edit Commission
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Add/Edit Category Modal ─────────────────────────────────── */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{editingCategory ? `Edit Category: ${editingCategory.Name}` : 'Create New Rental Category'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="admin-modal__close">✕</button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="admin-modal__body">
                <div className="admin-form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="e.g. Pro Audio & Event Electronics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Default Category Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    required
                    className="admin-form-input"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Platform split retained on rentals in this segment (unless merchant has a custom override).
                  </span>
                </div>

                <div className="admin-form-group">
                  <label>Description & Scope</label>
                  <textarea
                    rows="3"
                    className="admin-form-textarea"
                    placeholder="Describe eligible rentable equipment..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal__footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-admin btn-admin--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-admin btn-admin--primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
