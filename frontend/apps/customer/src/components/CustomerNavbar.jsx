import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../../src/shared/AuthContext';

const POPULAR_CITIES = [
  'All',
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Gandhinagar',
  'Bhavnagar',
  'Jamnagar',
  'Junagadh',
  'Anand',
  'Navsari',
  'Morbi',
  'Bharuch',
  'Porbandar',
  'Mehsana',
  'Bhuj',
  'Valsad',
];

const CustomerNavbar = ({
  onOpenAuth = () => {},
  onOpenSupport = () => {},
  onOpenMyBookings = () => {},
  onGoHome = () => {},
  selectedCity = 'All',
  onCityChange = () => {},
}) => {
  const { user, logout } = useAuth();
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const cityDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <header className="ra-customer-header">
      <div className="ra-customer-nav-wrap">
        {/* Brand & City Picker */}
        <div className="ra-nav-left-wrap">
          <a
            href="/"
            className="ra-brand-mark"
            onClick={(e) => {
              e.preventDefault();
              onGoHome();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#18181b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px',
                letterSpacing: '-0.3px',
                flexShrink: 0,
              }}
            >
              RA
            </div>
            <div>
              <div className="ra-brand-text">
                RentAssure
              </div>
              <div className="ra-brand-subtitle">Verified Rental Marketplace</div>
            </div>
          </a>

          {/* City Selector Pill with Custom Popover */}
          <div className="ra-city-selector-relative" ref={cityDropdownRef}>
            <button
              type="button"
              className="ra-city-pill-btn"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              title="Select delivery location"
            >
              <span style={{ fontSize: '13px' }}>📍</span>
              <span>{selectedCity === 'All' ? 'All Cities' : selectedCity}</span>
              <span style={{ fontSize: '9px', opacity: 0.6, transform: cityDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                ▼
              </span>
            </button>

            {cityDropdownOpen && (
              <div className="ra-city-popover-menu">
                <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#fafafa' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Select Your City
                  </div>
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '12px',
                      outline: 'none',
                      background: '#f4f4f5',
                    }}
                  />
                </div>

                <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '6px' }}>
                  {filteredCities.map((city) => {
                    const isSelected = selectedCity === city;
                    return (
                      <div
                        key={city}
                        onClick={() => {
                          onCityChange(city);
                          setCityDropdownOpen(false);
                          setCitySearch('');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#18181b' : 'var(--text-body)',
                          background: isSelected ? '#f4f4f5' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.12s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#fafafa';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{city === 'All' ? '🌐' : '📍'}</span>
                          <span>{city === 'All' ? 'All Cities' : city}</span>
                        </div>
                        {isSelected && <span style={{ color: '#18181b', fontWeight: 800 }}>✓</span>}
                      </div>
                    );
                  })}
                  {filteredCities.length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                      No matching cities found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Menu: Support & Profile */}
        <div className="ra-nav-right-wrap">
          {/* Support Ticket Button */}
          <button
            type="button"
            onClick={onOpenSupport}
            className="ra-nav-help-btn"
            title="Help Desk Support"
          >
            <span style={{ fontSize: '14px' }}>💬</span>
            <span className="ra-nav-help-text">Help Desk</span>
          </button>

          {/* User Profile or Sign In */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={onOpenMyBookings}
                className="ra-btn ra-btn-secondary ra-btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '12px',
                  border: 'none',
                  background: '#f4f4f5',
                }}
              >
                <span>📦</span>
                <span className="ra-nav-rentals-text">My Rentals</span>
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f4f4f5',
                  padding: '4px 10px 4px 6px',
                  borderRadius: '6px',
                  border: 'none',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#18181b',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '11px',
                  }}
                >
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="ra-nav-user-name" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.fullName || 'Customer'}
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="ra-btn ra-btn-secondary ra-btn-sm"
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: 'none', background: '#f4f4f5' }}
                title="Sign out of account"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="ra-btn ra-btn-primary ra-btn-sm"
              style={{
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default CustomerNavbar;
