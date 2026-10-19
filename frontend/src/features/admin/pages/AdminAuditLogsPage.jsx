import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { useAdminToast } from '../context/AdminToastContext';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useAdminToast();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getAudits(100);
      if (res.isSuccess) {
        setLogs(res.data || []);
      }
    } catch {
      showToast('error', 'Error', 'Failed to retrieve administrative audit trail.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity = filterSeverity ? log.Severity === filterSeverity : true;
    const matchesSearch = searchTerm
      ? log.Action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.EntityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.Details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.PerformedByUserName.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesSeverity && matchesSearch;
  });

  return (
    <div>
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1>Platform Operations Audit Trail</h1>
          <p>
            Immutable event history documenting vendor approvals, dispute rulings, commission adjustments, and governance updates.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button onClick={fetchLogs} className="btn-admin btn-admin--secondary btn-admin--sm">
            Refresh Stream
          </button>
        </div>
      </div>

      {/* ─── Filters & Search ────────────────────────────────────────── */}
      <div className="admin-filter-bar">
        <div className="admin-tabs">
          <button
            onClick={() => setFilterSeverity('')}
            className={`admin-tab ${filterSeverity === '' ? 'active' : ''}`}
          >
            <span>All Severities</span>
            <span className="admin-tab-count">{logs.length}</span>
          </button>
          <button
            onClick={() => setFilterSeverity('Info')}
            className={`admin-tab ${filterSeverity === 'Info' ? 'active' : ''}`}
          >
            <span>Info</span>
          </button>
          <button
            onClick={() => setFilterSeverity('Warning')}
            className={`admin-tab ${filterSeverity === 'Warning' ? 'active' : ''}`}
          >
            <span>Warning</span>
          </button>
          <button
            onClick={() => setFilterSeverity('Critical')}
            className={`admin-tab ${filterSeverity === 'Critical' ? 'active' : ''}`}
          >
            <span>Critical</span>
          </button>
        </div>

        <div className="admin-search-box">
          <svg className="admin-search-box__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search-box__input"
            placeholder="Search action, entity, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ─── Audit Trail Table ───────────────────────────────────────── */}
      <div className="admin-card">
        <div className="admin-card__body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
              Loading security audit ledger...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
              No audit records matching filter parameters.
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Target Scope</th>
                    <th>Actor</th>
                    <th>Operation Description</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {new Date(log.CreatedAt).toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>
                          {log.Action}
                        </strong>
                      </td>

                      <td>
                        <code style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, color: '#38bdf8' }}>
                          {log.EntityType} #{log.EntityId}
                        </code>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                          {log.PerformedByUserName}
                        </span>
                      </td>

                      <td style={{ maxWidth: '420px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                          {log.Details}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background:
                              log.Severity === 'Critical' ? 'rgba(239,68,68,0.2)' :
                              log.Severity === 'Warning' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)',
                            color:
                              log.Severity === 'Critical' ? '#f87171' :
                              log.Severity === 'Warning' ? '#fbbf24' : '#60a5fa',
                          }}
                        >
                          {log.Severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
