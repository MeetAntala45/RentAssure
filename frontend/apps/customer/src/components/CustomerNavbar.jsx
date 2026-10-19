import React from 'react';
import { useAuth } from '../../../../src/shared/AuthContext';

const CustomerNavbar = ({ onOpenAuth = () => {}, selectedCity = 'All', onCityChange = () => {} }) => {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="ra-customer-nav-container">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>
            Rent<span style={{ color: 'var(--primary)' }}>Assure</span>
          </div>

          {/* City Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>📍</span>
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-main)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="All">All Cities</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Surat">Surat</option>
              <option value="Vadodara">Vadodara</option>
              <option value="Rajkot">Rajkot</option>
              <option value="Bhavnagar">Bhavnagar</option>
              <option value="Jamnagar">Jamnagar</option>
              <option value="Junagadh">Junagadh</option>
              <option value="Gandhinagar">Gandhinagar</option>
              <option value="Anand">Anand</option>
              <option value="Navsari">Navsari</option>
              <option value="Morbi">Morbi</option>
              <option value="Bharuch">Bharuch</option>
              <option value="Porbandar">Porbandar</option>
              <option value="Mehsana">Mehsana</option>
              <option value="Bhuj">Bhuj</option>
              <option value="Valsad">Valsad</option>
            </select>
          </div>
        </div>

        {/* Port switcher banner */}
        <div
          className="ra-customer-port-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 600,
            background: 'var(--primary-subtle)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #e0e7ff',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Merchant Portal:</span>
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--primary)', fontWeight: 700 }}
          >
            Port 5174 ↗
          </a>
          <span style={{ color: 'var(--border-light)' }}>|</span>
          <span style={{ color: 'var(--text-muted)' }}>Admin Portal:</span>
          <a
            href="http://localhost:5175"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--primary)', fontWeight: 700 }}
          >
            Port 5175 ↗
          </a>
        </div>

        {/* User Account / Sign In */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.fullName}
              </div>
              <button
                onClick={logout}
                className="ra-btn ra-btn-secondary ra-btn-sm"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="ra-btn ra-btn-primary ra-btn-sm"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default CustomerNavbar;
