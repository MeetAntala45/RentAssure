import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { useAdminToast } from '../context/AdminToastContext';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [editValues, setEditValues] = useState({});

  const { showToast } = useAdminToast();

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getSettings();
      if (res.isSuccess) {
        setSettings(res.data || []);
        const map = {};
        res.data?.forEach((s) => {
          map[s.SettingKey] = s.SettingValue;
        });
        setEditValues(map);
      }
    } catch {
      showToast('error', 'Error', 'Failed to load platform settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSetting = async (key) => {
    const val = editValues[key];
    setSavingKey(key);
    try {
      const res = await adminService.updateSetting(key, val);
      if (res.isSuccess) {
        showToast('success', 'Policy Updated', `Setting '${key}' was updated to '${val}'.`);
        fetchSettings();
      } else {
        showToast('error', 'Error', res.message);
      }
    } catch {
      showToast('error', 'Save Error', 'Failed to update platform setting.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div>
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1>Platform Governance & Commission Rules</h1>
          <p>
            Configure global marketplace financial split percentages, automated escrow holding windows, and return arbitration policies.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button onClick={fetchSettings} className="btn-admin btn-admin--secondary btn-admin--sm">
            Refresh Policies
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          Loading governance configuration...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Group 1: Financial & Commission */}
          <div className="admin-card">
            <div className="admin-card__header">
              <div>
                <h3 className="admin-card__title">Financial Rules & Stripe Escrow Custody</h3>
                <span className="admin-card__subtitle">Default marketplace split and security deposit custody duration</span>
              </div>
            </div>

            <div className="admin-card__body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {settings
                  .filter((s) => s.Group === 'Financial')
                  .map((s) => (
                    <div
                      key={s.SettingKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.25rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 10,
                        border: '1px solid var(--admin-border)',
                        gap: '2rem',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: '#ffffff', fontSize: '0.92rem', display: 'block' }}>
                          {s.SettingKey}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                          {s.Description}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                          Last modified: {new Date(s.UpdatedAt).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '280px' }}>
                        <input
                          type="text"
                          className="admin-form-input"
                          value={editValues[s.SettingKey] || ''}
                          onChange={(e) =>
                            setEditValues({ ...editValues, [s.SettingKey]: e.target.value })
                          }
                        />
                        <button
                          onClick={() => handleSaveSetting(s.SettingKey)}
                          className="btn-admin btn-admin--primary btn-admin--sm"
                          disabled={savingKey === s.SettingKey}
                        >
                          {savingKey === s.SettingKey ? 'Saving...' : 'Update'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Group 2: Operations & General */}
          <div className="admin-card">
            <div className="admin-card__header">
              <div>
                <h3 className="admin-card__title">Logistics, Return Inspection & Support</h3>
                <span className="admin-card__subtitle">Vendor return inspection windows and platform escalation contacts</span>
              </div>
            </div>

            <div className="admin-card__body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {settings
                  .filter((s) => s.Group !== 'Financial')
                  .map((s) => (
                    <div
                      key={s.SettingKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.25rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 10,
                        border: '1px solid var(--admin-border)',
                        gap: '2rem',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: '#ffffff', fontSize: '0.92rem', display: 'block' }}>
                          {s.SettingKey}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                          {s.Description}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                          Last modified: {new Date(s.UpdatedAt).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '280px' }}>
                        <input
                          type="text"
                          className="admin-form-input"
                          value={editValues[s.SettingKey] || ''}
                          onChange={(e) =>
                            setEditValues({ ...editValues, [s.SettingKey]: e.target.value })
                          }
                        />
                        <button
                          onClick={() => handleSaveSetting(s.SettingKey)}
                          className="btn-admin btn-admin--primary btn-admin--sm"
                          disabled={savingKey === s.SettingKey}
                        >
                          {savingKey === s.SettingKey ? 'Saving...' : 'Update'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
