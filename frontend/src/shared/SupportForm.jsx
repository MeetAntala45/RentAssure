import React, { useState } from 'react';
import { supportApi } from './api';
import { useAuth } from './AuthContext';

export default function SupportForm({ onClose, isModal = false }) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setErrorMsg('Please enter your phone number.');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMsg('Please describe your support request or issue.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await supportApi.submitTicket({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        description: formData.description.trim(),
      });

      if (res.isSuccess) {
        setSuccessMsg(res.message || 'Support inquiry submitted successfully! Our team will contact you soon.');
        setFormData({
          name: user?.fullName || '',
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || '',
          description: '',
        });
      } else {
        setErrorMsg(res.message || 'Failed to submit support request. Please try again.');
      }
    } catch (err) {
      const apiErr = err.response?.data?.message || err.response?.data?.errors?.[0] || 'An error occurred while submitting. Please try again.';
      setErrorMsg(apiErr);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: isModal ? '100%' : '600px',
        margin: isModal ? '0' : '24px auto',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e4e4e7',
        padding: isModal ? '24px' : '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#18181b', margin: '0 0 6px 0' }}>
            Support & Help Desk
          </h2>
          <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>
            Submit your inquiry or issue and our team will get back to you promptly.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#71717a',
              lineHeight: 1,
              padding: '4px',
            }}
            title="Close"
          >
            ×
          </button>
        )}
      </div>

      {successMsg && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#f4f4f5',
            border: '1px solid #27272a',
            color: '#18181b',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#27272a', marginBottom: '6px' }}>
            Full Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Alex Johnson"
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #d4d4d8',
              fontSize: '14px',
              color: '#18181b',
              outline: 'none',
              background: '#fafafa',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#27272a', marginBottom: '6px' }}>
            Email Address <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. alex@example.com"
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #d4d4d8',
              fontSize: '14px',
              color: '#18181b',
              outline: 'none',
              background: '#fafafa',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#27272a', marginBottom: '6px' }}>
            Phone Number <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="e.g. +91 98765 43210"
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #d4d4d8',
              fontSize: '14px',
              color: '#18181b',
              outline: 'none',
              background: '#fafafa',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#27272a', marginBottom: '6px' }}>
            Description <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Please provide details about your issue or inquiry..."
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #d4d4d8',
              fontSize: '14px',
              color: '#18181b',
              outline: 'none',
              background: '#fafafa',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #d4d4d8',
                background: '#ffffff',
                color: '#3f3f46',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: submitting ? '#71717a' : '#18181b',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Support Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
