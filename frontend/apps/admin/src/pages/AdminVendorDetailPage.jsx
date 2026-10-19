import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../src/shared/api';

const AdminVendorDetailPage = ({ vendorId, onBack = () => {} }) => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchVendorDetail = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVendorById(vendorId);
      if (res.data) {
        setVendor(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch vendor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorDetail();
  }, [vendorId]);

  const handleApprove = async () => {
    setActionLoading(true);
    setMsg('');
    try {
      await adminApi.approveVendor(vendorId, 'Approved after thorough credentials verification');
      setMsg('Vendor has been approved successfully! The vendor can now access the full dashboard and list rental items.');
      await fetchVendorDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter the reason for rejection:', 'Documents or business credentials could not be verified.');
    if (!reason) return;

    setActionLoading(true);
    setMsg('');
    try {
      await adminApi.rejectVendor(vendorId, reason);
      setMsg('Vendor application was marked as rejected.');
      await fetchVendorDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject vendor');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ra-card" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading partner details...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="ra-card" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--danger-text)' }}>Vendor not found.</p>
        <button className="ra-btn ra-btn-secondary" onClick={onBack} style={{ marginTop: '16px' }}>
          ← Back to List
        </button>
      </div>
    );
  }

  // Parse metadata from AdminNotes if present
  let meta = {
    category: '',
    experienceYears: '',
    skills: [],
    servicesOffered: [],
    languages: [],
    documents: [],
  };

  try {
    if (vendor.adminNotes && vendor.adminNotes.startsWith('{')) {
      const parsed = JSON.parse(vendor.adminNotes);
      if (parsed.category) meta.category = parsed.category;
      if (parsed.experienceYears) meta.experienceYears = parsed.experienceYears;
      if (parsed.languages) {
        meta.languages = typeof parsed.languages === 'string'
          ? parsed.languages.split(',').map((s) => s.trim()).filter(Boolean)
          : Array.isArray(parsed.languages) ? parsed.languages : [];
      }
      if (parsed.servicesOffered) {
        meta.servicesOffered = typeof parsed.servicesOffered === 'string'
          ? parsed.servicesOffered.split(',').map((s) => s.trim()).filter(Boolean)
          : Array.isArray(parsed.servicesOffered) ? parsed.servicesOffered : [];
      }
      if (parsed.documents) {
        meta.documents = typeof parsed.documents === 'string'
          ? JSON.parse(parsed.documents)
          : Array.isArray(parsed.documents) ? parsed.documents : [];
      }
    }
  } catch (e) {
    // ignore
  }

  const handleDownloadDoc = (doc) => {
    if (doc.url) {
      const a = document.createElement('a');
      a.href = doc.url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob(
        [
          `RentAssure Merchant Verification Document\n` +
          `=========================================\n` +
          `File Name: ${doc.name}\n` +
          `Reported Size: ${doc.size || 'N/A'}\n` +
          `Merchant ID: ${vendor.id}\n` +
          `Store Name: ${vendor.storeName || 'N/A'}\n` +
          `Owner Name: ${vendor.ownerName || 'N/A'}\n` +
          `Status: Authenticated on RentAssure Platform\n`
        ],
        { type: 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(doc.name || 'Merchant_Doc').replace(/\\.[^/.]+$/, '')}_Verified.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const isApproved = vendor.status === 'Approved';
  const isPending = vendor.status === 'PendingApproval';

  return (
    <div>
      {/* ─── HEADER BAR (Matches Screenshot 3) ────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            className="ra-btn ra-btn-secondary ra-btn-sm"
            style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
            title="Back"
          >
            ←
          </button>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>
            {vendor.storeName || vendor.ownerName}
          </h2>

          {isApproved ? (
            <span className="ra-badge ra-badge-verified">✔ Verified</span>
          ) : isPending ? (
            <span className="ra-badge ra-badge-pending">⏳ Pending Review</span>
          ) : (
            <span className="ra-badge ra-badge-rejected">✖ {vendor.status}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {isPending && (
            <>
              <button
                disabled={actionLoading}
                onClick={handleReject}
                className="ra-btn ra-btn-danger"
              >
                Reject Application
              </button>
              <button
                disabled={actionLoading}
                onClick={handleApprove}
                className="ra-btn ra-btn-primary"
              >
                {actionLoading ? 'Approving...' : '✔ Approve Vendor'}
              </button>
            </>
          )}

          {!isPending && isApproved && (
            <button
              disabled={actionLoading}
              onClick={handleReject}
              className="ra-btn ra-btn-secondary"
              style={{ color: 'var(--danger-text)' }}
            >
              Suspend / Revoke
            </button>
          )}

          {!isPending && !isApproved && (
            <button
              disabled={actionLoading}
              onClick={handleApprove}
              className="ra-btn ra-btn-primary"
            >
              Re-Approve Vendor
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div
          style={{
            background: 'var(--success-bg)',
            color: 'var(--success-text)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          {msg}
        </div>
      )}

      {/* ─── VENDOR DETAILS PROFILE CARD ──────────────────────────────────── */}
      <div className="ra-card" style={{ marginBottom: '24px' }}>
        <div className="ra-detail-profile-grid">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '4px' }}>
              Vendor ID
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              #{vendor.id}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '4px' }}>
              Store / Business Name
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              {vendor.storeName || 'Not specified'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '4px' }}>
              Owner Name
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              {vendor.ownerName || 'Not specified'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '4px' }}>
              Mobile Number
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              {vendor.phoneNumber || 'Not provided'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '4px' }}>
              Support Email
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', wordBreak: 'break-all' }}>
              {vendor.supportEmail || vendor.userEmail || 'Not provided'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '4px' }}>
              GST / Business Reg
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              {vendor.businessRegistrationNumber || 'Not provided'}
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '4px' }}>
              Physical Address
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.4 }}>
              {vendor.address
                ? `${vendor.address}, ${vendor.city || ''}, ${vendor.state || 'Gujarat'} ${vendor.postalCode || ''}`
                : 'Not provided'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '4px' }}>
              Category
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              {meta.category || vendor.storeCategory || 'General Merchandise'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '4px' }}>
              Experience
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              {meta.experienceYears || 'Not provided'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '4px' }}>
              Status
            </div>
            <div>
              <span className="ra-tag" style={{ background: '#f8fafc', fontWeight: 700 }}>
                • {vendor.status}
              </span>
            </div>
          </div>
        </div>

        {/* Skills Tags (only if provided) */}
        {meta.skills && meta.skills.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '8px' }}>
              Specialties & Skills
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {meta.skills.map((skill, idx) => (
                <span key={idx} className="ra-tag">
                  • {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Services Offered Tags (only if provided) */}
        {meta.servicesOffered && meta.servicesOffered.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '8px' }}>
              Services Offered
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {meta.servicesOffered.map((service, idx) => (
                <span key={idx} className="ra-tag">
                  • {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages (only if provided) */}
        {meta.languages && meta.languages.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '8px' }}>
              Languages Spoken
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {meta.languages.map((lang, idx) => (
                <span key={idx} className="ra-tag">
                  • {lang}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── DOCUMENTS SECTION ────────────────────────────────────────────── */}
      <div>
        <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
          Attached Verification Documents
        </h4>
        {meta.documents && meta.documents.length > 0 ? (
          <div className="ra-row-responsive-3">
            {meta.documents.map((doc, idx) => (
              <div
                key={idx}
                className="ra-card"
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '28px', color: 'var(--text-muted)' }}>📄</span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={doc.name}
                    >
                      {doc.name || `Document ${idx + 1}`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {doc.size || 'Verified File'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDoc(doc)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--primary)',
                    fontSize: '18px',
                    padding: '6px',
                  }}
                  title="Download / View"
                >
                  📥
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="ra-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            No verification documents attached by merchant.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVendorDetailPage;
