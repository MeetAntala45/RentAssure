import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/', { replace: true });
    }
  };

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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{selectedCity === 'All' ? 'All Cities' : selectedCity}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: cityDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="m6 9 6 6 6-6" />
              </svg>
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
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {city === 'All' ? (
                              <>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </>
                            ) : (
                              <>
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                              </>
                            )}
                          </svg>
                          <span>{city === 'All' ? 'All Cities' : city}</span>
                        </div>
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="ra-nav-help-text">Help Desk</span>
          </button>

          {/* User Profile or Sign In */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.role === 'Vendor' ? (
                <a
                  href="http://localhost:5174/dashboard"
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
                    textDecoration: 'none',
                    color: 'var(--text-main)',
                  }}
                  title="Switch to Vendor Merchant Hub"
                >
                  <span>🏪</span>
                  <span className="ra-nav-rentals-text">Vendor Hub</span>
                </a>
              ) : user.role === 'Admin' ? (
                <a
                  href="http://localhost:5175/dashboard"
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
                    textDecoration: 'none',
                    color: 'var(--text-main)',
                  }}
                  title="Switch to Admin Console"
                >
                  <span>⚙️</span>
                  <span className="ra-nav-rentals-text">Admin Console</span>
                </a>
              ) : (
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6a1.78 1.78 0 0 0 0-3.2z" />
                    <polyline points="3.29 7 12 12 20.71 7" />
                    <line x1="12" y1="22" x2="12" y2="12" />
                  </svg>
                  <span className="ra-nav-rentals-text">My Rentals</span>
                </button>
              )}

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
                onClick={handleLogout}
                className="ra-btn ra-btn-secondary ra-btn-sm"
                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: 'none', background: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Sign out of account"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="ra-nav-signout-text">Sign Out</span>
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
