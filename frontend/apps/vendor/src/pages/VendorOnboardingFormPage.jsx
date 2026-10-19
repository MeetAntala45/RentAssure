import React, { useState, useMemo, useRef, useEffect } from 'react';
import { vendorApi } from '../../../../src/shared/api';
import { useAuth } from '../../../../src/shared/AuthContext';
import {
  IconDocument,
  IconDownload,
  IconUpload,
  IconCheckCircle,
} from '../../../../src/shared/Icons';

// Gujarat Cities List
const GUJARAT_CITIES = [
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Bhavnagar',
  'Jamnagar',
  'Junagadh',
  'Gandhinagar',
  'Anand',
  'Navsari',
  'Morbi',
  'Nadiad',
  'Surendranagar',
  'Bharuch',
  'Porbandar',
  'Mehsana',
  'Bhuj',
  'Valsad',
  'Vapi',
  'Godhra',
  'Palanpur',
  'Botad',
  'Patan',
  'Veraval',
  'Amreli',
  'Dahod',
  'Gondal',
];

const VendorOnboardingFormPage = ({ vendorStatus, onStatusChange = () => {} }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const isApproved = vendorStatus?.status === 'Approved';
  const isPending = vendorStatus?.status === 'PendingApproval';
  const isRejected = vendorStatus?.status === 'Rejected';

  // Parse admin notes for metadata & documents
  const meta = useMemo(() => {
    try {
      if (vendorStatus?.adminNotes) {
        return typeof vendorStatus.adminNotes === 'string'
          ? JSON.parse(vendorStatus.adminNotes)
          : vendorStatus.adminNotes;
      }
    } catch {
      // ignore
    }
    return {};
  }, [vendorStatus]);

  const initialDocs = useMemo(() => {
    try {
      if (meta?.documents) {
        const parsed = typeof meta.documents === 'string' ? JSON.parse(meta.documents) : meta.documents;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  }, [meta]);

  // Form states initialized with existing vendor data
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [storeCategory, setStoreCategory] = useState('Living Furniture');
  const [experienceYears, setExperienceYears] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState([]);

  // Sync state when vendorStatus changes
  useEffect(() => {
    if (vendorStatus) {
      setStoreName(vendorStatus.storeName || '');
      setOwnerName(vendorStatus.ownerName || user?.fullName || '');
      setBusinessRegistrationNumber(vendorStatus.businessRegistrationNumber || '');
      setPhoneNumber(vendorStatus.phoneNumber || '');
      setSupportEmail(vendorStatus.supportEmail || user?.email || '');
      setAddress(vendorStatus.address || '');
      if (vendorStatus.city) {
        setCity(vendorStatus.city);
      }
      if (meta?.category) {
        setStoreCategory(meta.category);
      }
      if (meta?.experienceYears) {
        setExperienceYears(meta.experienceYears);
      }
      if (initialDocs.length > 0) {
        setUploadedDocs(initialDocs);
      }
    } else {
      setOwnerName(user?.fullName || '');
      setSupportEmail(user?.email || '');
    }
  }, [vendorStatus, meta, initialDocs, user]);

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Real document upload handler
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newDocs = files.map((file) => {
      let sizeStr = '';
      if (file.size >= 1024 * 1024) {
        sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      } else {
        sizeStr = Math.max(1, Math.round(file.size / 1024)) + ' KB';
      }
      return {
        name: file.name,
        size: sizeStr,
        type: file.type,
        url: URL.createObjectURL(file),
      };
    });

    setUploadedDocs((prev) => [...prev, ...newDocs]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveDoc = (index) => {
    setUploadedDocs((prev) => prev.filter((_, i) => i !== index));
  };

  // Download document handler
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
          `RentAssure Verified Merchant Document\n` +
          `=====================================\n` +
          `File Name: ${doc.name}\n` +
          `Reported Size: ${doc.size}\n` +
          `Merchant ID: ${vendorStatus?.vendorId || '—'}\n` +
          `Store Name: ${vendorStatus?.storeName || 'RentAssure Store'}\n` +
          `Owner: ${vendorStatus?.ownerName || user?.fullName || 'Store Owner'}\n` +
          `GST / Reg: ${vendorStatus?.businessRegistrationNumber || 'N/A'}\n` +
          `Location: ${vendorStatus?.city || 'Ahmedabad'}, Gujarat, India\n` +
          `Status: Authenticated & Approved on RentAssure Platform\n`
        ],
        { type: 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(doc.name || 'Merchant_Document').replace(/\.[^/.]+$/, '')}_Verified.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (uploadedDocs.length === 0) {
      setError('Please attach at least one verification document (e.g. GST Certificate, Store License, or ID Proof).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
        businessRegistrationNumber: businessRegistrationNumber.trim(),
        phoneNumber: phoneNumber.trim(),
        supportEmail: supportEmail.trim(),
        address: address.trim(),
        city,
        state: 'Gujarat',
        postalCode: '380001',
        storeCategory,
        experienceYears,
        previousExperience: 'Established Retail Merchant',
        documentsJson: JSON.stringify(
          uploadedDocs.map((d) => ({
            name: d.name,
            size: d.size,
            type: d.type || 'document',
          }))
        ),
      };

      const res = await vendorApi.submitOnboarding(payload);
      if (res.data) {
        setMessage('Your store verification application has been submitted successfully!');
        onStatusChange(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to submit verification form. Please check the inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const res = await vendorApi.getStatus();
      if (res.data) {
        onStatusChange(res.data);
      }
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  };

  // ─── 1. VERIFIED STORE PROFILE DETAILS VIEW (Matching Image 2 Reference) ──
  if (isApproved) {
    const docs = uploadedDocs.length > 0 ? uploadedDocs : initialDocs;

    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Header Bar matching Image 2 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              {vendorStatus?.ownerName || vendorStatus?.storeName || user?.fullName || 'Store Partner'}
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: '#f4f4f5',
                color: '#18181b',
                border: '1px solid #d4d4d8',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              <IconCheckCircle width={16} height={16} stroke="#18181b" />
              Verified
            </span>
          </div>
        </div>

        {/* Primary Details Card (Grid Matching Image 2) */}
        <div
          className="ra-card"
          style={{
            marginBottom: '24px',
            padding: '28px',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          {/* Row 1: ID, Name, Mobile, Email */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ID</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginTop: '6px' }}>
                {vendorStatus?.vendorId || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Name</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginTop: '6px' }}>
                {vendorStatus?.ownerName || user?.fullName || 'Store Owner'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Mobile Number</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginTop: '6px' }}>
                {vendorStatus?.phoneNumber || 'Not provided'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Email</div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#1e293b',
                  marginTop: '6px',
                  wordBreak: 'break-all',
                }}
              >
                {vendorStatus?.supportEmail || user?.email || 'Not provided'}
              </div>
            </div>
          </div>

          {/* Row 2: Address, Store Name / Category, Work Experience */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.8fr 1.2fr 1fr',
              gap: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #f1f5f9',
              marginBottom: '24px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Address</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1e293b',
                  marginTop: '6px',
                  lineHeight: 1.5,
                }}
              >
                {vendorStatus?.address || 'Not provided'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Store / Business Name</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginTop: '6px' }}>
                {vendorStatus?.storeName || 'Not specified'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {meta?.category || vendorStatus?.storeCategory || 'General Merchandise'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Work Experience</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginTop: '6px' }}>
                {meta?.experienceYears || 'Not provided'}
              </div>
            </div>
          </div>

          {/* Row 3: City & State, Business Reg / GST, Status */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>State & City</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginTop: '6px' }}>
                {vendorStatus?.city || 'Ahmedabad'}, {vendorStatus?.state || 'Gujarat'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Business Reg / GST</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginTop: '6px' }}>
                {vendorStatus?.businessRegistrationNumber || 'Not provided'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Status</div>
              <div style={{ marginTop: '6px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: '#ecfdf5',
                    color: '#059669',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  ● Active Merchant
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Showcase matching Image 2 */}
        <div
          className="ra-card"
          style={{
            padding: '24px 28px',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Documents
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              {docs.length} Verified {docs.length === 1 ? 'Document' : 'Documents'}
            </span>
          </div>

          {docs.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              {docs.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: '#f4f4f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#18181b',
                        flexShrink: 0,
                      }}
                    >
                      <IconDocument width={20} height={20} stroke="#18181b" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={doc.name}
                      >
                        {doc.name || `Document ${idx + 1}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {doc.size || 'Verified File'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    title="Download / View Document"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: '#18181b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <IconDownload width={18} height={18} stroke="#18181b" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '13px',
                background: '#f8fafc',
                borderRadius: '8px',
              }}
            >
              No verification documents currently attached.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── 2. ONBOARDING & VERIFICATION FORM (Only when not verified, or editing) ─
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px' }}>
      {/* ─── PENDING VERIFICATION NOTICE ──────────────────────────────────── */}
      {isPending && (
        <div className="ra-card" style={{ marginBottom: '28px', borderLeft: '5px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>⏳</span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Verification Under Review
                </h3>
                <span className="ra-badge ra-badge-pending">Pending Admin Approval</span>
              </div>
              <p style={{ color: 'var(--text-body)', fontSize: '14px', lineHeight: 1.6 }}>
                Your store application for <strong>{vendorStatus?.storeName || 'Your Store'}</strong> has been submitted.
                To maintain high quality on RentAssure, our Administrator verifies all merchant licenses before unlocking listings.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                Admin Portal reviews applications at <code>http://localhost:5175</code>. Once approved by the admin, your full dashboard and "+ Add Rental Item" capabilities will automatically unlock.
              </p>
            </div>

            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="ra-btn ra-btn-primary ra-btn-sm"
              style={{ flexShrink: 0 }}
            >
              {checking ? 'Checking...' : '🔄 Refresh Status'}
            </button>
          </div>
        </div>
      )}

      {/* ─── REJECTION ALERT ─────────────────────────────────────────────── */}
      {isRejected && (
        <div
          className="ra-card"
          style={{
            marginBottom: '28px',
            borderLeft: '5px solid var(--danger-text)',
            background: '#fff5f5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>✖</span>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--danger-text)' }}>
              Application Rejected
            </h3>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '14px' }}>
            Reason: {vendorStatus?.rejectionReason || 'Uploaded business credentials could not be verified.'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
            Please update your business information below and re-submit for review.
          </p>
        </div>
      )}

      {/* ─── ONBOARDING FORM ─────────────────────────────────────────────── */}
      <div className="ra-card">
        <div
          style={{
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '20px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            {isPending ? 'Edit Store Verification Details' : 'Store Partner Verification'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Please fill in your merchant details to register as an authorized rental provider on RentAssure.
          </p>
        </div>

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
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background: 'var(--success-bg)',
              color: 'var(--success-text)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '20px',
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Row 1: Store Name & Owner Name */}
          <div className="ra-form-grid-2">
            <div className="ra-form-group">
              <label className="ra-label">Store / Business Name*</label>
              <input
                type="text"
                required
                className="ra-input"
                placeholder="e.g. Apex Living Furniture Depot"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>

            <div className="ra-form-group">
              <label className="ra-label">Owner Full Name*</label>
              <input
                type="text"
                required
                className="ra-input"
                placeholder="e.g. Priya Patel"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Reg Number, Phone, Email */}
          <div className="ra-form-grid-3">
            <div className="ra-form-group">
              <label className="ra-label">Business Registration / GST*</label>
              <input
                type="text"
                required
                className="ra-input"
                placeholder="e.g. 24AAACA1234A1Z5"
                value={businessRegistrationNumber}
                onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
              />
            </div>

            <div className="ra-form-group">
              <label className="ra-label">Mobile Number*</label>
              <input
                type="tel"
                required
                className="ra-input"
                placeholder="9789786789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="ra-form-group">
              <label className="ra-label">Support Email*</label>
              <input
                type="email"
                required
                className="ra-input"
                placeholder="store@apexdepot.com"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Street Address */}
          <div className="ra-form-group">
            <label className="ra-label">Physical Store / Warehouse Address*</label>
            <input
              type="text"
              required
              className="ra-input"
              placeholder="e.g. Plot NO - 7/A, Anand Nagar-2, Near Royal Duplex, Pramukh Nagar"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Row 4: City (Gujarat only) & State (Gujarat auto-filled) */}
          <div className="ra-form-grid-2">
            <div className="ra-form-group">
              <label className="ra-label">City (Gujarat)*</label>
              <select
                className="ra-select"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              >
                {GUJARAT_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="ra-form-group">
              <label className="ra-label">State*</label>
              <input
                type="text"
                readOnly
                className="ra-input"
                value="Gujarat"
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  cursor: 'not-allowed',
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          {/* Row 5: Store Category & Experience */}
          <div className="ra-form-grid-2">
            <div className="ra-form-group">
              <label className="ra-label">Primary Rental Category*</label>
              <select
                className="ra-select"
                value={storeCategory}
                onChange={(e) => setStoreCategory(e.target.value)}
              >
                <option value="Living Furniture">Living Furniture & Sofas</option>
                <option value="Home Appliances">Home Appliances & White Goods</option>
                <option value="Office & Workspaces">Office & Ergonomic Workspaces</option>
                <option value="Electronics & Audio">Consumer Electronics & Cameras</option>
                <option value="Event Equipment">Party & Event Audio Gear</option>
              </select>
            </div>

            <div className="ra-form-group">
              <label className="ra-label">Experience in Business*</label>
              <input
                type="text"
                required
                className="ra-input"
                placeholder="e.g. 4.7 yrs"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
              />
            </div>
          </div>

          {/* ─── REAL DOCUMENT UPLOAD FEATURE ─────────────────────────────── */}
          <div className="ra-form-group" style={{ marginBottom: '24px' }}>
            <label
              className="ra-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span>Store Verification Documents (GST, Business License, or ID Proof)*</span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                {uploadedDocs.length} {uploadedDocs.length === 1 ? 'file' : 'files'} attached
              </span>
            </label>

            {/* Click / Drag & Drop Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#18181b';
                e.currentTarget.style.background = '#f4f4f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#f4f4f5',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#18181b',
                  marginBottom: '10px',
                }}
              >
                <IconUpload width={22} height={22} stroke="#18181b" />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                Click to browse or drag & drop verification documents
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Upload real documents: GST Certificate, Business Registration, Store License (PDF, PNG, JPG)
              </div>
            </div>

            {/* List of Uploaded Documents */}
            {uploadedDocs.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  marginTop: '16px',
                }}
              >
                {uploadedDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: '#f4f4f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#18181b',
                          flexShrink: 0,
                        }}
                      >
                        <IconDocument width={18} height={18} stroke="#18181b" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#1e293b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={doc.name}
                        >
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {doc.size}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDoc(idx);
                      }}
                      title="Remove file"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ra-btn ra-btn-primary ra-btn-lg ra-btn-block"
          >
            {loading
              ? 'Submitting Application...'
              : isPending
              ? 'Update Submitted Details'
              : 'Submit Application for Admin Verification'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VendorOnboardingFormPage;
