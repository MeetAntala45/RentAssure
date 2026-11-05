import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { customerApi, paymentsApi } from '../../../../src/shared/api';

const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51UXcyvHQfESOezv6jhJX5Cdqg3c3FDCdBXkdGXB1iNOiFD935si4TkL0lla6NMEfaLtHNjSGzkJQgSHOF8jRd6IM00k5PTSn8w';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Inner Stripe payment form component
const StripePaymentSection = ({
  totalAmount,
  itemId,
  selectedMonths,
  onPaymentSuccess,
  onError,
  loading,
  setLoading,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [useTestOneClick, setUseTestOneClick] = useState(true);

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // 1. Create PaymentIntent on backend
      const intentRes = await paymentsApi.createPaymentIntent({
        itemId,
        rentalMonths: selectedMonths,
        amount: totalAmount,
      });

      if (!intentRes.isSuccess || !intentRes.data?.clientSecret) {
        throw new Error(intentRes.message || 'Failed to initialize Stripe payment.');
      }

      const clientSecret = intentRes.data.clientSecret;
      const intentId = intentRes.data.paymentIntentId;

      if (useTestOneClick) {
        // Fast 1-click test confirmation using server test endpoint
        const confirmRes = await paymentsApi.testConfirm(intentId);
        if (confirmRes.isSuccess) {
          onPaymentSuccess(intentId);
        } else {
          throw new Error(confirmRes.message || 'Test confirmation failed.');
        }
      } else {
        // Real card element confirmation via Stripe.js
        const cardElem = elements.getElement(CardElement);
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElem,
          },
        });

        if (result.error) {
          throw new Error(result.error.message);
        } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
          onPaymentSuccess(result.paymentIntent.id);
        }
      }
    } catch (err) {
      onError(err.message || 'Payment processing error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '14px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => setUseTestOneClick(true)}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm)',
            border: useTestOneClick ? '2px solid var(--primary)' : '1px solid var(--border-light)',
            background: useTestOneClick ? 'var(--primary-light)' : '#ffffff',
            color: useTestOneClick ? 'var(--primary)' : 'var(--text-body)',
            cursor: 'pointer',
          }}
        >
          ⚡ Stripe Instant Test (1-Click)
        </button>
        <button
          type="button"
          onClick={() => setUseTestOneClick(false)}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm)',
            border: !useTestOneClick ? '2px solid var(--primary)' : '1px solid var(--border-light)',
            background: !useTestOneClick ? 'var(--primary-light)' : '#ffffff',
            color: !useTestOneClick ? 'var(--primary)' : 'var(--text-body)',
            cursor: 'pointer',
          }}
        >
          💳 Manual Card Entry
        </button>
      </div>

      {!useTestOneClick && (
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            background: '#ffffff',
            marginBottom: '14px',
          }}
        >
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#0f172a',
                  '::placeholder': { color: '#94a3b8' },
                },
                invalid: { color: '#ef4444' },
              },
            }}
          />
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={handleCardSubmit}
        className="ra-btn ra-btn-primary"
        style={{
          width: '100%',
          padding: '13px',
          fontSize: '15px',
          fontWeight: 700,
          borderRadius: 'var(--radius-md)',
        }}
      >
        {loading ? 'Processing via Stripe...' : `Pay ₹${totalAmount.toLocaleString('en-IN')} with Stripe`}
      </button>
    </div>
  );
};

export default function CustomerCheckoutPage({
  item,
  selectedMonths = 3,
  onBack,
  onViewRentals,
  user,
}) {
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(item?.city || 'Ahmedabad');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState('online'); // 'online' or 'offline'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);

  if (!item) {
    return (
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No item selected for checkout.</p>
        <button onClick={onBack} className="ra-btn ra-btn-primary" style={{ marginTop: '16px' }}>
          ← Back to Marketplace
        </button>
      </div>
    );
  }

  // Calculate pricing
  const baseRent = Number(item.monthlyRent) || 0;
  const deposit = Number(item.securityDeposit) || (baseRent * 3);
  const d6 = Number(item.discount6MonthsPercent) || 0;
  const d12 = Number(item.discount12MonthsPercent) || 0;

  let activeMonthlyRent = baseRent;
  if (selectedMonths >= 12 && d12 > 0) {
    activeMonthlyRent = Math.round(baseRent * (1 - d12 / 100));
  } else if (selectedMonths >= 6 && d6 > 0) {
    activeMonthlyRent = Math.round(baseRent * (1 - d6 / 100));
  }

  const deliveryFee = 0; // Explicitly FREE as requested!
  const totalDueToday = activeMonthlyRent + deposit + deliveryFee;

  // Complete offline / reserve booking
  const handleOfflineBooking = async () => {
    if (!address.trim()) {
      setError('Please provide a delivery address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        itemId: item.id,
        rentalDurationMonths: selectedMonths,
        deliveryAddress: `${address.trim()} (Pincode: ${pincode.trim() || '380001'})`,
        deliveryCity: city.trim() || item.city,
        stripePaymentIntentId: null, // Offline
      };

      const res = await customerApi.createBooking(payload);
      if (res.isSuccess && res.data) {
        setSuccessBooking(res.data);
      } else {
        setError(res.message || 'Failed to place rental booking.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing reservation.');
    } finally {
      setLoading(false);
    }
  };

  // Called when online Stripe payment succeeds
  const handleOnlinePaymentSuccess = async (stripeIntentId) => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        itemId: item.id,
        rentalDurationMonths: selectedMonths,
        deliveryAddress: `${address.trim() || 'Customer Doorstep'} (Pincode: ${pincode.trim() || '380001'})`,
        deliveryCity: city.trim() || item.city,
        stripePaymentIntentId: stripeIntentId,
      };

      const res = await customerApi.createBooking(payload);
      if (res.isSuccess && res.data) {
        setSuccessBooking(res.data);
      } else {
        setError(res.message || 'Failed to save booking record.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking submission failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── SUCCESS SCREEN WITH DELIVERY OTP ───
  if (successBooking) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto 80px auto', padding: '0 20px' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f0fdf4',
              color: '#166534',
              fontSize: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '1px solid #bbf7d0',
            }}
          >
            ✓
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
            Rental Reservation Confirmed!
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
            Reference: <strong style={{ color: 'var(--text-main)' }}>{successBooking.bookingReference}</strong>
          </p>

          {/* Prominent OTP Box */}
          <div
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
              border: '2px dashed var(--primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '480px',
              margin: '0 auto 28px auto',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              🔑 Doorstep Delivery Verification OTP
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 900,
                letterSpacing: '8px',
                color: 'var(--text-main)',
                fontFamily: 'monospace',
                margin: '8px 0',
              }}
            >
              {successBooking.deliveryOtp || '482910'}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
              Provide this 6-digit OTP to the delivery agent upon arrival. <strong>Your rental start date and billing cycle officially begin on that verified delivery day.</strong>
            </p>
          </div>

          {/* Order Summary Recap */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              padding: '16px 20px',
              maxWidth: '480px',
              margin: '0 auto 28px auto',
              textAlign: 'left',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Item:</span>
              <strong style={{ color: 'var(--text-main)' }}>{successBooking.itemTitle || item.title}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tenure:</span>
              <span>{successBooking.rentalDurationMonths || selectedMonths} Months</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Deposit Held in Escrow:</span>
              <span>₹{Number(successBooking.securityDeposit).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
              <span style={{ color: successBooking.isPaidOnline ? '#166534' : 'var(--text-main)', fontWeight: 600 }}>
                {successBooking.isPaidOnline ? 'Online via Stripe' : 'Offline / Pay at Doorstep'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '6px', fontWeight: 700 }}>
              <span>Total Paid / Reserved:</span>
              <span>₹{Number(successBooking.totalAmountPaid).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onViewRentals}
              className="ra-btn ra-btn-primary"
              style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}
            >
              Go to My Rentals →
            </button>
            <button
              type="button"
              onClick={onBack}
              className="ra-btn ra-btn-secondary"
              style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600 }}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT FORM ───
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--primary)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>←</span> Back to Product
        </button>
        <span>/</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Checkout</span>
      </div>

      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 24px 0' }}>
        Complete Your Rental Reservation
      </h1>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* Two-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(340px, 1fr)',
          gap: '32px',
          alignItems: 'start',
        }}
        className="ra-checkout-grid"
      >
        {/* ─── LEFT: Delivery Details & Payment Mode ─── */}
        <div>
          {/* Step 1: Delivery Address */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                1
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Delivery Address & Contact
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={user?.fullName || 'Customer'}
                  className="ra-input"
                  style={{ background: '#f8fafc' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Contact Phone Number*
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="ra-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Street Address / Apartment / Landmark*
              </label>
              <input
                type="text"
                required
                placeholder="Flat / House No., Building Name, Street"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="ra-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  City*
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="ra-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="380001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="ra-input"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Payment Method */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                2
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Select Payment Method
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              {/* Online Stripe */}
              <div
                onClick={() => setPaymentMode('online')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: paymentMode === 'online' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: paymentMode === 'online' ? 'var(--primary-light)' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={paymentMode === 'online'}
                    onChange={() => setPaymentMode('online')}
                  />
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                    Online with Stripe
                  </strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '24px' }}>
                  Instant card escrow reservation. 100% held safely until return inspection.
                </div>
              </div>

              {/* Offline */}
              <div
                onClick={() => setPaymentMode('offline')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: paymentMode === 'offline' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: paymentMode === 'offline' ? 'var(--primary-light)' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={paymentMode === 'offline'}
                    onChange={() => setPaymentMode('offline')}
                  />
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                    Pay at Doorstep
                  </strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '24px' }}>
                  Reserve now; pay 1st month rent + deposit directly upon verified delivery.
                </div>
              </div>
            </div>

            {/* Payment Mode Execution */}
            {paymentMode === 'online' ? (
              <Elements stripe={stripePromise}>
                <StripePaymentSection
                  totalAmount={totalDueToday}
                  itemId={item.id}
                  selectedMonths={selectedMonths}
                  onPaymentSuccess={handleOnlinePaymentSuccess}
                  onError={(msg) => setError(msg)}
                  loading={loading}
                  setLoading={setLoading}
                />
              </Elements>
            ) : (
              <div>
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px',
                    fontSize: '13px',
                    color: 'var(--text-body)',
                    marginBottom: '16px',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  💵 You have selected offline payment. Your unit will be reserved immediately, and you will pay ₹{totalDueToday.toLocaleString('en-IN')} (Month 1 rent + deposit) to the merchant on delivery.
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleOfflineBooking}
                  className="ra-btn ra-btn-primary"
                  style={{
                    width: '100%',
                    padding: '13px',
                    fontSize: '15px',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {loading ? 'Confirming Reservation...' : 'Confirm Doorstep Reservation →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Order Summary ─── */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px 0' }}>
              Order Breakdown
            </h3>

            {/* Item Card Snippet */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'center' }}>
              <img
                src={item.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=140&q=80'}
                alt=""
                style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Tenure: <strong>{selectedMonths} Months</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Store: {item.vendorStoreName || 'Certified Partner'}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', margin: '14px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-body)', marginBottom: '8px' }}>
              <span>Month 1 Rental</span>
              <span>₹{activeMonthlyRent.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-body)', marginBottom: '8px' }}>
              <span>Security Deposit (Held in Escrow)</span>
              <span>₹{deposit.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#166534', fontWeight: 600, marginBottom: '8px' }}>
              <span>Doorstep Delivery & Setup</span>
              <span>FREE (₹0)</span>
            </div>

            <div style={{ borderTop: '1px dashed var(--border-light)', margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
              <span>Total Payable Today</span>
              <span>₹{totalDueToday.toLocaleString('en-IN')}</span>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              ℹ️ <strong>Recurring Cycle:</strong> Month 2 rent of ₹{activeMonthlyRent.toLocaleString('en-IN')} will be due exactly 1 month after delivery verification. You can pay online via Stripe or offline directly on the app.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
