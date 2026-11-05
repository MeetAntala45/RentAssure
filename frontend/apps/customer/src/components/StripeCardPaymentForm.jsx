import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentsApi } from '../../../../src/shared/api';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#033047',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '15px',
      '::placeholder': {
        color: '#94a3b8',
      },
      iconColor: '#033047',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
};

export default function StripeCardPaymentForm({
  user,
  item,
  rentalMonths,
  totalDueToday,
  securityDeposit,
  monthlyRent,
  onPaymentSuccess,
  onCancel,
  isSubmitting,
  deliveryAddress,
  deliveryCity,
  deliveryPhone,
  isItemUnavailable = false,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardholderName, setCardholderName] = useState(user?.fullName || 'RentAssure Customer');
  const [processing, setProcessing] = useState(false);
  const [processingMode, setProcessingMode] = useState(null); // 'oneclick' | 'manual'
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedTestCard, setCopiedTestCard] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleCopyTestCard = () => {
    navigator.clipboard?.writeText('4242424242424242');
    setCopiedTestCard(true);
    setTimeout(() => setCopiedTestCard(false), 3000);
  };

  // 1-Click Sandbox Test Pay (uses pm_card_visa server-side confirmation)
  const handleInstantOneClickPay = async () => {
    setProcessing(true);
    setProcessingMode('oneclick');
    setErrorMessage('');

    try {
      // 1. Create PaymentIntent on backend with breakdown
      const intentRes = await paymentsApi.createPaymentIntent({
        itemId: item.id,
        rentalMonths: rentalMonths,
        amount: totalDueToday,
      });

      if (!intentRes.isSuccess || !intentRes.data?.paymentIntentId) {
        throw new Error(intentRes.message || 'Failed to initialize Stripe PaymentIntent.');
      }

      const paymentIntentId = intentRes.data.paymentIntentId;

      // 2. Authorize via Stripe test endpoint
      const confirmRes = await paymentsApi.testConfirm(paymentIntentId);
      if (!confirmRes.isSuccess) {
        throw new Error(confirmRes.message || 'Stripe test payment authorization failed.');
      }

      // 3. Trigger booking completion
      await onPaymentSuccess(paymentIntentId, intentRes.data);
    } catch (err) {
      console.error('Instant payment error:', err);
      setErrorMessage(
        err.response?.data?.message ||
        err.message ||
        'Sandbox transaction failed. Please retry.'
      );
    } finally {
      setProcessing(false);
      setProcessingMode(null);
    }
  };

  // Manual Card Form Submission via Stripe Elements
  const handleSubmitManualCard = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Stripe payment processor is still loading. Please wait a moment or use 1-Click Instant Pay.');
      return;
    }

    if (!cardholderName.trim()) {
      setErrorMessage('Please enter the cardholder name.');
      return;
    }

    if (!cardComplete) {
      setErrorMessage('⚠️ Please enter the full 16-digit test card number, MM/YY, and CVC in the card input box (or click the green 1-Click Instant Test Pay button above).');
      return;
    }

    setProcessing(true);
    setProcessingMode('manual');
    setErrorMessage('');

    try {
      // 1. Create PaymentIntent on the backend
      const intentRes = await paymentsApi.createPaymentIntent({
        itemId: item.id,
        rentalMonths: rentalMonths,
        amount: totalDueToday,
      });

      if (!intentRes.isSuccess || !intentRes.data?.clientSecret) {
        throw new Error(intentRes.message || 'Failed to initialize payment transaction.');
      }

      const clientSecret = intentRes.data.clientSecret;
      const cardElement = elements.getElement(CardElement);

      // 2. Confirm Card Payment via Stripe SDK
      const confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName.trim(),
            email: user?.email || '',
            phone: deliveryPhone || '',
            address: {
              line1: deliveryAddress || '',
              city: deliveryCity || '',
              country: 'IN',
            },
          },
        },
      });

      if (confirmResult.error) {
        throw new Error(confirmResult.error.message || 'Payment card authorization failed.');
      }

      if (confirmResult.paymentIntent && confirmResult.paymentIntent.status === 'succeeded') {
        // 3. Payment succeeded! Pass payment intent ID to complete booking
        await onPaymentSuccess(confirmResult.paymentIntent.id, intentRes.data);
      } else {
        throw new Error('Payment was not completed. Status: ' + (confirmResult.paymentIntent?.status || 'Unknown'));
      }
    } catch (err) {
      console.error('Manual payment error:', err);
      setErrorMessage(
        err.response?.data?.message ||
        err.message ||
        'Transaction failed. Please check card info or use 1-Click Test Pay.'
      );
    } finally {
      setProcessing(false);
      setProcessingMode(null);
    }
  };

  const isBusy = processing || isSubmitting || isItemUnavailable;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ─── UNAVAILABLE BANNER ───────────────────────────────────────────── */}
      {isItemUnavailable && (
        <div
          style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '10px',
            padding: '12px 14px',
            color: '#92400e',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚠️</span>
          <span>This product is currently rented out by another customer. Reservations and payments are disabled until returned.</span>
        </div>
      )}

      {/* ─── OPTION 1: 1-CLICK INSTANT TEST PAY (HERO BUTTON) ─────────────── */}
      <div
        style={{
          background: isItemUnavailable ? '#f1f5f9' : 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: isItemUnavailable ? '1px solid #cbd5e1' : '2px solid #86efac',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: isItemUnavailable ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.1)',
          opacity: isItemUnavailable ? 0.75 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: isItemUnavailable ? '#64748b' : '#065f46' }}>
                Instant Sandbox Test Payment
              </div>
              <div style={{ fontSize: '11px', color: isItemUnavailable ? '#94a3b8' : '#047857' }}>
                {isItemUnavailable ? 'Unavailable for rented items' : 'Real Stripe test payment with zero manual card typing'}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 800, background: isItemUnavailable ? '#e2e8f0' : '#bbf7d0', color: isItemUnavailable ? '#64748b' : '#166534', padding: '2px 8px', borderRadius: '9999px', letterSpacing: '0.5px' }}>
            TEST MODE
          </span>
        </div>

        <button
          type="button"
          onClick={handleInstantOneClickPay}
          disabled={isBusy}
          style={{
            width: '100%',
            padding: '13px 20px',
            borderRadius: '10px',
            border: 'none',
            background: isItemUnavailable
              ? '#94a3b8'
              : isBusy && processingMode === 'oneclick'
              ? '#94a3b8'
              : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 800,
            cursor: isBusy ? 'not-allowed' : 'pointer',
            boxShadow: isItemUnavailable ? 'none' : '0 4px 14px rgba(4, 120, 87, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          {isItemUnavailable ? (
            <>
              <span>🔒</span>
              <span>Currently Rented Out (Reservations Closed)</span>
            </>
          ) : isBusy && processingMode === 'oneclick' ? (
            <>
              <span className="ra-spinner" style={{ width: '16px', height: '16px' }} />
              Authorizing via Stripe Sandbox...
            </>
          ) : isSubmitting ? (
            <>
              <span className="ra-spinner" style={{ width: '16px', height: '16px' }} />
              Creating Escrow Booking...
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>1-Click Pay ₹{totalDueToday?.toLocaleString('en-IN')} (Stripe Test Visa)</span>
            </>
          )}
        </button>
      </div>

      {/* ─── OR DIVIDER ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Or Enter Card Details Below
        </span>
        <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
      </div>

      {/* ─── OPTION 2: MANUAL STRIPE CARD INPUT ───────────────────────────── */}
      <form onSubmit={handleSubmitManualCard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Helper chips for manual entry */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#334155' }}>
            <strong>Test Card:</strong>{' '}
            <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, color: '#033047' }}>
              4242 •••• •••• 4242
            </code>{' '}
            &bull; Exp: Any future date &bull; CVC: 123
          </div>
          <button
            type="button"
            onClick={handleCopyTestCard}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#0369a1',
              background: '#ffffff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {copiedTestCard ? '✓ Copied to clipboard!' : '📋 Copy Card Number'}
          </button>
        </div>

        {/* Cardholder Name */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#033047', marginBottom: '4px' }}>
            Cardholder Full Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              color: '#033047',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* Stripe CardElement */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#033047', marginBottom: '4px' }}>
            Card Information (Number, MM/YY, CVC) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '11px 14px',
              backgroundColor: '#ffffff',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={(e) => {
                setCardComplete(e.complete);
                if (e.error) {
                  setErrorMessage(e.error.message);
                } else {
                  setErrorMessage('');
                }
              }}
            />
          </div>
        </div>

        {/* Escrow Guarantee Notice */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#475569',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔒</span>
            <span>256-Bit SSL Encrypted &bull; Escrow Protection by RentAssure</span>
          </div>
          <span style={{ color: '#047857', fontWeight: 700 }}>
            ₹{securityDeposit?.toLocaleString('en-IN')} Refundable on Return
          </span>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Back to Doorstep Option
          </button>

          <button
            type="submit"
            disabled={isBusy}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              border: 'none',
              background: isBusy && processingMode === 'manual'
                ? '#94a3b8'
                : 'linear-gradient(135deg, #033047 0%, #0a4f73 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(3, 48, 71, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isItemUnavailable ? (
              <>
                <span>🔒</span>
                Currently Rented Out
              </>
            ) : isBusy && processingMode === 'manual' ? (
              <>
                <span className="ra-spinner" style={{ width: '15px', height: '15px' }} />
                Verifying Card with Stripe...
              </>
            ) : isSubmitting ? (
              <>
                <span className="ra-spinner" style={{ width: '15px', height: '15px' }} />
                Creating Booking...
              </>
            ) : (
              <>
                <span>🔒</span>
                Pay ₹{totalDueToday?.toLocaleString('en-IN')} with Entered Card
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
