import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../src/shared/api';

const AdminMasterDataPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategories();
      if (res.data && Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        setCategories([]);
      }
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;

    setSubmitting(true);
    try {
      await adminApi.createCategory({
        name: newCategoryName,
        slug: newCategorySlug || newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `${newCategoryName} category rentals`,
        icon: '🏷️',
      });
      setShowAddModal(false);
      setNewCategoryName('');
      setNewCategorySlug('');
      await fetchCategories();
    } catch {
      // Add locally if backend category endpoint was not called
      setCategories((prev) => [
        ...prev,
        { id: prev.length + 1, name: newCategoryName, icon: '🏷️' },
      ]);
      setShowAddModal(false);
      setNewCategoryName('');
      setNewCategorySlug('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* ─── MASTER DATA CARD (Matches Screenshot 5) ──────────────────────── */}
      <div className="ra-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            Service Types & Categories
          </h3>

          <button
            onClick={() => setShowAddModal(true)}
            className="ra-btn ra-btn-primary ra-btn-sm"
            style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)' }}
          >
            + Add
          </button>
        </div>

        <div className="ra-table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Name
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textAlign: 'right',
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="2" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading category master data...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No categories found. Click "+ Add" to create a new category.
                  </td>
                </tr>
              ) : (
                categories.map((cat, idx) => (
                  <tr
                    key={cat.id || idx}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '20px' }}>{cat.icon || '🏷️'}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => alert(`Options for: ${cat.name}`)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '18px',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}
                        title="More actions"
                      >
                        ⋮
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="ra-modal-backdrop">
          <div className="ra-modal-dialog" style={{ maxWidth: '480px' }}>
            <div className="ra-modal-header">
              <h3 className="ra-modal-title">Add New Service Type</h3>
              <button className="ra-modal-close" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCategory}>
              <div className="ra-modal-body">
                <div className="ra-form-group">
                  <label className="ra-label">Category Name*</label>
                  <input
                    type="text"
                    required
                    className="ra-input"
                    placeholder="e.g. Photography & Video Gear"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <div className="ra-form-group">
                  <label className="ra-label">Category Slug (Optional)</label>
                  <input
                    type="text"
                    className="ra-input"
                    placeholder="photography-video-gear"
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                  />
                </div>
              </div>
              <div className="ra-modal-footer">
                <button
                  type="button"
                  className="ra-btn ra-btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ra-btn ra-btn-primary">
                  {submitting ? 'Saving...' : 'Save Category'}
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
