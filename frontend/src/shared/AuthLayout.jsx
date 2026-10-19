import React from 'react';

const AuthLayout = ({ children, title, subtitle, portalName = 'RentAssure' }) => {
  return (
    <div className="ra-auth-page">
      {/* Left Form Column */}
      <div className="ra-auth-form-side">
        <div className="ra-auth-box">
          <div className="ra-auth-logo">
            Rent<span>Assure</span>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>
              {portalName}
            </div>
          </div>

          {title && <h2 className="ra-auth-title">{title}</h2>}
          {subtitle && (
            <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginTop: '-16px', marginBottom: '24px' }}>
              {subtitle}
            </p>
          )}

          {children}
        </div>
      </div>

      {/* Right Imagery Masonry Collage (Matches Image 1) */}
      <div className="ra-auth-visual">
        <div className="ra-auth-visual-collage">
          <div className="ra-collage-card">
            <img
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80"
              alt="Designer Living Room & Furniture"
            />
            <div className="ra-collage-overlay">
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
                Living Furniture
              </span>
              <strong style={{ fontSize: '14px' }}>Sofa Sets & Lounges</strong>
            </div>
          </div>

          <div className="ra-collage-card" style={{ transform: 'translateY(20px)' }}>
            <img
              src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"
              alt="Home Cleaning & Maintenance"
            />
            <div className="ra-collage-overlay">
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
                Appliances
              </span>
              <strong style={{ fontSize: '14px' }}>Smart Fridges & Washers</strong>
            </div>
          </div>

          <div className="ra-collage-card">
            <img
              src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80"
              alt="Modern Home Workspace"
            />
            <div className="ra-collage-overlay">
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
                Workspaces
              </span>
              <strong style={{ fontSize: '14px' }}>Ergonomic Desks & Chairs</strong>
            </div>
          </div>

          <div className="ra-collage-card" style={{ transform: 'translateY(20px)' }}>
            <img
              src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80"
              alt="Electronics & Event Gear"
            />
            <div className="ra-collage-overlay">
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
                Electronics
              </span>
              <strong style={{ fontSize: '14px' }}>Displays & Audio Gear</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
