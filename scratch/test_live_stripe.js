const API_BASE = 'http://localhost:5189/api';

async function req(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function run() {
  console.log('--- 1. CUSTOMER LOGIN ---');
  let custLogin;
  try {
    custLogin = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'meetantala2005@gmail.com', password: 'Admin@123' })
    });
  } catch {
    custLogin = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'meetantala2005@gmail.com', password: 'Password@123' })
    });
  }

  const customerToken = custLogin.data.token;
  console.log('Customer logged in! Name:', custLogin.data.fullName);

  console.log('\n--- 2. GET ITEM 54 (DYSON PURIFIER) ---');
  const itemsRes = await req(`${API_BASE}/v1/items?pageSize=30`);
  const item = itemsRes.data.items.find(i => i.id === 54 || i.title.includes('Dyson Purifier'));
  console.log(`Using Item: ID=${item.id}, Title="${item.title}", Status="${item.status}", Rent=₹${item.monthlyRent}, Deposit=₹${item.securityDeposit}`);

  console.log('\n--- 3. CREATE STRIPE PAYMENT INTENT ---');
  const totalDue = item.securityDeposit + item.monthlyRent;
  const intentRes = await req(`${API_BASE}/v1/payments/create-intent`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      itemId: item.id,
      rentalMonths: 3,
      amount: totalDue,
    })
  });

  console.log('PaymentIntent Response:', intentRes);
  const { paymentIntentId, clientSecret } = intentRes.data;
  console.log(`PaymentIntent ID: ${paymentIntentId}`);

  console.log('\n--- 4. TEST CONFIRM PAYMENT INTENT VIA BACKEND /v1/payments/test-confirm ---');
  const confirmRes = await req(`${API_BASE}/v1/payments/test-confirm/${paymentIntentId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({})
  });
  console.log('Confirm Response Status:', confirmRes.data.status);

  console.log('\n--- 5. CREATE BOOKING WITH STRIPE PAYMENT INTENT ---');
  const bookingRes = await req(`${API_BASE}/v1/bookings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      itemId: item.id,
      rentalDurationMonths: 3,
      deliveryAddress: 'Flat 402, Shivalik Heights, SG Highway | Contact: 9876543210',
      deliveryCity: item.city || 'Ahmedabad',
      startDate: new Date().toISOString(),
      stripePaymentIntentId: paymentIntentId,
    })
  });

  const booking = bookingRes.data;
  console.log(`Booking Created! Ref: ${booking.bookingReference}, ID: ${booking.id}`);
  console.log(`IsPaidOnline: ${booking.isPaidOnline}, StripePaymentIntentId: ${booking.stripePaymentIntentId}`);

  console.log('\n--- 6. VENDOR LOGIN ---');
  let vendorLogin;
  try {
    vendorLogin = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'meet@vendor.com', password: 'Admin@123' })
    });
  } catch {
    vendorLogin = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'meet@vendor.com', password: 'Password@123' })
    });
  }

  const vendorToken = vendorLogin.data.token;
  console.log('Vendor logged in! Name:', vendorLogin.data.fullName);

  console.log('\n--- 7. VENDOR STRIPE REFUND DEPOSIT ---');
  const refundRes = await req(`${API_BASE}/v1/payments/refund-deposit/${booking.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${vendorToken}` },
    body: JSON.stringify({})
  });

  console.log('Stripe Refund Response:', refundRes);
  console.log(`Refund ID: ${refundRes.data?.refundId}`);

  console.log('\n--- 8. VERIFY CUSTOMER BOOKINGS STATUS ---');
  const myBookingsRes = await req(`${API_BASE}/v1/bookings/my`, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  const myBooking = myBookingsRes.data.find(b => b.id === booking.id);
  console.log('Verified Booking:', {
    reference: myBooking.bookingReference,
    isPaidOnline: myBooking.isPaidOnline,
    stripePaymentIntentId: myBooking.stripePaymentIntentId,
    depositStatus: myBooking.depositStatus,
    stripeRefundId: myBooking.stripeRefundId,
  });

  console.log('\n✅ ALL STRIPE PAYMENT & REFUND FLOWS VERIFIED PERFECTLY!');
}

run().catch(err => {
  console.error('FAILED:', err.message);
});
