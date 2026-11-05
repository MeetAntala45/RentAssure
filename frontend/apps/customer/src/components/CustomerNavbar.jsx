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
          <a href="#" className="ra-brand-mark" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <div className="ra-brand-logo-icon">🛡️</div>
            <div>
              <div className="ra-brand-text">
                Rent<span>Assure</span>
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
              <span style={{ fontSize: '15px' }}>📍</span>
              <span>{selectedCity === 'All' ? 'All Cities' : selectedCity}</span>
              <span style={{ fontSize: '10px', opacity: 0.7, transform: cityDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                ▼
              </span>
            </button>

            {cityDropdownOpen && (
              <div className="ra-city-popover-menu">
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-light)', background: 'var(--primary-subtle)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
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
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      fontSize: '12px',
                      outline: 'none',
                      background: '#ffffff',
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
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: isSelected ? 800 : 500,
                          color: isSelected ? 'var(--primary)' : 'var(--text-body)',
                          background: isSelected ? 'var(--primary-light)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.12s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{city === 'All' ? '🌐' : '📍'}</span>
                          <span>{city === 'All' ? 'All Cities' : city}</span>
                        </div>
                        {isSelected && <span style={{ color: 'var(--primary)', fontWeight: 800 }}>✓</span>}
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
            <span style={{ fontSize: '15px' }}>💬</span>
            <span className="ra-nav-help-text">Help Desk</span>
          </button>

          {/* User Profile or Sign In */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={onOpenMyBookings}
                className="ra-btn ra-btn-secondary ra-btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '9999px',
                  fontWeight: 700,
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
                  background: 'var(--primary-light)',
                  padding: '4px 10px 4px 6px',
                  borderRadius: '9999px',
                  border: '1px solid var(--color-light-blue-border)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #033047 0%, #304C62 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                  }}
                >
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="ra-nav-user-name" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.fullName || 'Customer'}
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="ra-btn ra-btn-secondary ra-btn-sm"
                style={{ padding: '6px 12px', fontSize: '12px' }}
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
                borderRadius: '9999px',
                padding: '9px 20px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(3, 48, 71, 0.2)',
              }}
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
