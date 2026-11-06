import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { customerApi, paymentsApi } from '../../../../src/shared/api';

const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51UXcyvHQfESOezv6jhJX5Cdqg3c3FDCdBXkdGXB1iNOiFD935si4TkL0lla6NMEfaLtHNjSGzkJQgSHOF8jRd6IM00k5PTSn8w';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Inner Stripe payment form component - Production Level Card Element
const StripePaymentSection = ({
  totalAmount,
  itemId,
  selectedMonths,
  onPaymentSuccess,
  onError,
  loading,
  setLoading,
  user,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState(user?.fullName || '');

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElem = elements.getElement(CardElement);
    if (!cardElem) {
      onError('Card input form not ready. Please refresh.');
      return;
    }

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

      // 2. Production Card confirmation via Stripe.js CardElement
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElem,
          billing_details: {
            name: cardholderName.trim() || user?.fullName || 'RentAssure Customer',
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        onPaymentSuccess(result.paymentIntent.id);
      } else {
        throw new Error('Payment status: ' + (result.paymentIntent?.status || 'incomplete'));
      }
    } catch (err) {
      onError(err.message || 'Payment processing error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="e.g. John Doe"
          className="ra-input"
        />
      </div>

      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
          Credit or Debit Card Details
        </label>
        <div
          style={{
            padding: '14px',
            borderRadius: '10px',
            background: '#f4f4f5',
          }}
        >
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#18181b',
                  fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                  '::placeholder': { color: '#71717a' },
                },
                invalid: { color: '#991b1b' },
              },
            }}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleCardSubmit}
        className="ra-btn ra-btn-primary"
        style={{
          width: '100%',
          padding: '13px',
          fontSize: '14px',
          fontWeight: 700,
          borderRadius: '10px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Processing via Stripe...' : `Pay ₹${totalAmount.toLocaleString('en-IN')} with Card`}
      </button>

      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
        🔒 256-bit SSL encrypted Stripe payment gateway
      </div>
    </div>
  );
};

export default function CustomerCheckoutPage({
  item: propItem,
  selectedMonths: propMonths,
  selectedQuantity: propQuantity,
  onBack,
  onViewRentals,
  user,
}) {
  const params = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [fetchedItem, setFetchedItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(false);

  const item = propItem || location.state?.item || fetchedItem;

  // Fallback fetch if opened via direct URL or reload
  useEffect(() => {
    const targetId = params.id;
    if (!propItem && !location.state?.item && targetId) {
      setItemLoading(true);
      customerApi.getItemById(targetId)
        .then((res) => {
          if (res?.data) {
            setFetchedItem(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setItemLoading(false));
    }
  }, [params.id, propItem, location.state]);

  const selectedMonths =
    Number(searchParams.get('months')) ||
    location.state?.selectedMonths ||
    propMonths ||
    (item?.minimumRentalMonths ? Math.max(item.minimumRentalMonths, 3) : 3);

  const selectedQuantity =
    Number(searchParams.get('quantity')) ||
    location.state?.selectedQuantity ||
    propQuantity ||
    1;

  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(item?.city || 'Ahmedabad');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [pincode, setPincode] = useState('');
  const [paymentMode, setPaymentMode] = useState('online'); // 'online' or 'offline'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);

  useEffect(() => {
    if (item?.city) {
      setCity(item.city);
    }
  }, [item]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (item) {
      navigate(`/rental-items/${item.id}`);
    } else {
      navigate('/');
    }
  };

  const handleViewRentals = () => {
    if (onViewRentals) {
      onViewRentals();
    } else {
      navigate('/my-rentals');
    }
  };

  if (itemLoading) {
    return (
      <div className="ra-page-container" style={{ margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Preparing secure checkout...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="ra-page-container" style={{ margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No item selected for checkout.</p>
        <button onClick={handleBack} className="ra-btn ra-btn-primary" style={{ marginTop: '16px' }}>
          ← Back to Marketplace
        </button>
      </div>
    );
  }

  // Calculate pricing with quantity multiplier
  const baseRent = Number(item.monthlyRent) || 0;
  const unitDeposit = Number(item.securityDeposit) || (baseRent * 3);
  const d6 = Number(item.discount6MonthsPercent) || 0;
  const d12 = Number(item.discount12MonthsPercent) || 0;

  let unitMonthlyRent = baseRent;
  if (selectedMonths >= 12 && d12 > 0) {
    unitMonthlyRent = Math.round(baseRent * (1 - d12 / 100));
  } else if (selectedMonths >= 6 && d6 > 0) {
    unitMonthlyRent = Math.round(baseRent * (1 - d6 / 100));
  }

  const deliveryFee = 0; // Explicitly FREE
  const totalMonthlyRent = unitMonthlyRent * selectedQuantity;
  const totalDeposit = unitDeposit * selectedQuantity;
  const totalDueToday = totalMonthlyRent + totalDeposit + deliveryFee;

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
        quantity: selectedQuantity,
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
        quantity: selectedQuantity,
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
      <div className="ra-page-container" style={{ margin: '40px auto 80px auto', padding: '0 20px', maxWidth: '720px' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '40px 28px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#f0fdf4',
              color: '#166534',
              fontSize: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
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

          {/* Prominent OTP Box in Seamless Light Theme */}
          <div
            style={{
              background: '#f4f4f5',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '460px',
              margin: '0 auto 28px auto',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              Doorstep Delivery Verification OTP
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 900,
                letterSpacing: '8px',
                color: '#18181b',
                fontFamily: 'monospace',
                margin: '8px 0',
              }}
            >
              {successBooking.deliveryOtp || '482910'}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
              Share this 6-digit OTP with the delivery agent when receiving your item. <strong>Your rental start date and billing cycle officially begin on that verified delivery day.</strong>
            </p>
          </div>

          {/* Order Summary Recap */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '18px 20px',
              maxWidth: '460px',
              margin: '0 auto 28px auto',
              textAlign: 'left',
              fontSize: '13px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Item:</span>
              <strong style={{ color: 'var(--text-main)' }}>{successBooking.itemTitle || item.title}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Quantity:</span>
              <strong style={{ color: 'var(--text-main)' }}>{successBooking.quantity || selectedQuantity} Unit(s)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tenure:</span>
              <span>{successBooking.rentalDurationMonths || selectedMonths} Months</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Deposit Held in Escrow:</span>
              <span>₹{Number(successBooking.securityDeposit).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
              <span style={{ color: successBooking.isPaidOnline ? '#15803d' : 'var(--text-main)', fontWeight: 600 }}>
                {successBooking.isPaidOnline ? 'Online via Stripe' : 'Offline / Pay at Doorstep'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '8px', fontWeight: 700 }}>
              <span>Total Paid / Reserved:</span>
              <span>₹{Number(successBooking.totalAmountPaid).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleViewRentals}
              className="ra-btn ra-btn-primary"
              style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700, borderRadius: '10px' }}
            >
              Go to My Rentals →
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="ra-btn ra-btn-secondary"
              style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600, borderRadius: '10px' }}
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
    <div className="ra-page-container" style={{ padding: '24px 20px 80px 20px' }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--text-main)',
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
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* Two-Column Grid (Fully fluid and responsive) */}
      <div className="ra-checkout-grid">
        {/* ─── LEFT: Delivery Details & Payment Mode ─── */}
        <div>
          {/* Step 1: Delivery Address */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
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
                  background: '#18181b',
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

            <div className="ra-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={user?.fullName || 'Customer'}
                  className="ra-input"
                  style={{ background: '#f4f4f5', opacity: 0.8 }}
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

            <div className="ra-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
              borderRadius: '16px',
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
                  background: '#18181b',
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

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {/* Online Stripe */}
              <div
                onClick={() => setPaymentMode('online')}
                style={{
                  flex: '1 1 200px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: paymentMode === 'online' ? '#18181b' : '#f4f4f5',
                  color: paymentMode === 'online' ? '#ffffff' : 'var(--text-main)',
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
                  <strong style={{ fontSize: '14px' }}>
                    Online with Stripe
                  </strong>
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8, paddingLeft: '24px' }}>
                  Instant card escrow reservation. 100% held safely until return inspection.
                </div>
              </div>

              {/* Offline */}
              <div
                onClick={() => setPaymentMode('offline')}
                style={{
                  flex: '1 1 200px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: paymentMode === 'offline' ? '#18181b' : '#f4f4f5',
                  color: paymentMode === 'offline' ? '#ffffff' : 'var(--text-main)',
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
                  <strong style={{ fontSize: '14px' }}>
                    Pay at Doorstep
                  </strong>
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8, paddingLeft: '24px' }}>
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
                  user={user}
                />
              </Elements>
            ) : (
              <div>
                <div
                  style={{
                    background: '#f4f4f5',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '13px',
                    color: 'var(--text-body)',
                    marginBottom: '16px',
                  }}
                >
                  💵 You have selected offline payment. Your {selectedQuantity > 1 ? `${selectedQuantity} units` : 'unit'} will be reserved immediately, and you will pay ₹{totalDueToday.toLocaleString('en-IN')} (Month 1 rent + deposit) to the merchant on delivery.
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleOfflineBooking}
                  className="ra-btn ra-btn-primary"
                  style={{
                    width: '100%',
                    padding: '13px',
                    fontSize: '14px',
                    fontWeight: 700,
                    borderRadius: '10px',
                  }}
                >
                  {loading ? 'Confirming Reservation...' : 'Confirm Doorstep Reservation →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Order Summary ─── */}
        <div className="ra-detail-sticky-pane">
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-md)',
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
                style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover' }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Tenure: <strong>{selectedMonths} Months</strong> • Qty: <strong>{selectedQuantity}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Store: {item.vendorStoreName || 'Certified Partner'}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', margin: '14px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-body)', marginBottom: '8px' }}>
              <span>Month 1 Rental ({selectedQuantity} × ₹{unitMonthlyRent.toLocaleString('en-IN')})</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{totalMonthlyRent.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-body)', marginBottom: '8px' }}>
              <span>Security Deposit ({selectedQuantity} × ₹{unitDeposit.toLocaleString('en-IN')})</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{totalDeposit.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>Doorstep Delivery & Setup</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>FREE (₹0)</span>
            </div>

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
              <span>Total Payable Today</span>
              <span>₹{totalDueToday.toLocaleString('en-IN')}</span>
            </div>

            <div
              style={{
                background: '#f8f8f9',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              ℹ️ <strong>Recurring Cycle:</strong> Month 2 rent of ₹{totalMonthlyRent.toLocaleString('en-IN')} will be due exactly 1 month after delivery verification. You can pay online via Stripe or offline directly on the app.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
