const https = require('https');
const http = require('http');

async function main() {
  console.log('=== TESTING STRIPE INTEGRATION END-TO-END ===');

  // 1. Login as customer
  const loginData = JSON.stringify({
    email: 'meetantala2005@gmail.com',
    password: 'Admin@123',
  });

  const token = await new Promise((resolve, reject) => {
    const req = http.request(
      'http://localhost:5189/api/auth/customer/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.data?.token) {
              console.log('1. Customer logged in successfully.');
              resolve(parsed.data.token);
            } else {
              reject(new Error('Login failed: ' + body));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  // 2. Fetch an available item
  const item = await new Promise((resolve, reject) => {
    http.get('http://localhost:5189/api/v1/items?status=Available&pageSize=20', (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        const parsed = JSON.parse(body);
        const items = parsed.data?.items || parsed.data;
        const first = Array.isArray(items) ? items.find(i => i.status === 'Available') : null;
        if (first) {
          console.log(`2. Retrieved available rental item: ID ${first.id} ("${first.title}"), Monthly Rent: ₹${first.monthlyRent}, Deposit: ₹${first.securityDeposit}`);
          resolve(first);
        } else {
          reject(new Error('No available rental items found: ' + body));
        }
      });
    });
  });

  // 3. Create Stripe PaymentIntent via RentAssure API
  const intentPayload = JSON.stringify({
    itemId: item.id,
    rentalMonths: 3,
    amount: (Number(item.monthlyRent) + Number(item.securityDeposit)),
  });

  const intentData = await new Promise((resolve, reject) => {
    const req = http.request(
      'http://localhost:5189/api/v1/payments/create-intent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(intentPayload),
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          const parsed = JSON.parse(body);
          if (parsed.isSuccess && parsed.data?.paymentIntentId) {
            console.log('3. Stripe PaymentIntent created successfully!');
            console.log(`   PaymentIntent ID: ${parsed.data.paymentIntentId}`);
            console.log(`   Client Secret: ${parsed.data.clientSecret.slice(0, 15)}...`);
            console.log(`   Total Amount: ₹${parsed.data.amount}`);
            console.log(`   Platform Commission (Admin Cut): ₹${parsed.data.platformCommission}`);
            console.log(`   Vendor Payout (Merchant Earnings): ₹${parsed.data.vendorPayout}`);
            resolve(parsed.data);
          } else {
            reject(new Error('Payment intent creation failed: ' + body));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(intentPayload);
    req.end();
  });

  // 4. Confirm PaymentIntent using Stripe test token pm_card_visa
  console.log('4. Confirming Stripe PaymentIntent using test payment method...');
  const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY
);
  const stripePostData = 'payment_method=pm_card_visa';

  const confirmedIntent = await new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.stripe.com/v1/payment_intents/${intentData.paymentIntentId}/confirm`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(stripePostData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          const parsed = JSON.parse(body);
          if (parsed.status === 'succeeded') {
            console.log(`   Stripe payment SUCCEEDED! Status: ${parsed.status}`);
            console.log(`   Metadata recorded on Stripe:`, parsed.metadata);
            resolve(parsed);
          } else {
            reject(new Error('Stripe confirmation failed: ' + body));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(stripePostData);
    req.end();
  });

  // 5. Create Booking with confirmed Stripe PaymentIntent ID
  const bookingPayload = JSON.stringify({
    itemId: item.id,
    rentalDurationMonths: 3,
    deliveryAddress: '101 Horizon Tower, SG Highway | PIN: 380054 | Contact: 9876543210',
    deliveryCity: 'Ahmedabad',
    stripePaymentIntentId: intentData.paymentIntentId,
  });

  const booking = await new Promise((resolve, reject) => {
    const req = http.request(
      'http://localhost:5189/api/v1/bookings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bookingPayload),
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          const parsed = JSON.parse(body);
          if (parsed.isSuccess && parsed.data?.id) {
            console.log(`5. Booking created successfully! Booking Ref: ${parsed.data.bookingReference}, ID: ${parsed.data.id}`);
            console.log(`   IsPaidOnline: ${parsed.data.isPaidOnline}`);
            console.log(`   StripePaymentIntentId: ${parsed.data.stripePaymentIntentId}`);
            resolve(parsed.data);
          } else {
            reject(new Error('Booking creation failed: ' + body));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(bookingPayload);
    req.end();
  });

  // 6. Vendor login
  const vendorLoginData = JSON.stringify({
    email: 'meet@vendor.com',
    password: 'Admin@123',
  });

  const vendorToken = await new Promise((resolve, reject) => {
    const req = http.request(
      'http://localhost:5189/api/auth/vendor/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(vendorLoginData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          const parsed = JSON.parse(body);
          if (parsed.data?.token) {
            console.log('6. Vendor logged in successfully.');
            resolve(parsed.data.token);
          } else {
            reject(new Error('Vendor login failed: ' + body));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(vendorLoginData);
    req.end();
  });

  // 7. Vendor releases deposit via Stripe refund
  console.log(`7. Vendor releasing security deposit of ₹${booking.securityDeposit} back to customer via Stripe...`);
  const refundResult = await new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:5189/api/v1/payments/refund-deposit/${booking.id}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vendorToken}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          const parsed = JSON.parse(body);
          if (parsed.isSuccess) {
            console.log(`   SUCCESS: Security deposit refunded via Stripe!`);
            console.log(`   Stripe Refund ID: ${parsed.data.refundId}`);
            console.log(`   Refunded Amount: ₹${parsed.data.refundedAmount}`);
            resolve(parsed.data);
          } else {
            reject(new Error('Stripe deposit refund failed: ' + body));
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });

  // 8. Verify customer can see refunded deposit
  const customerBookings = await new Promise((resolve, reject) => {
    http.get(
      'http://localhost:5189/api/v1/bookings/my',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          const parsed = JSON.parse(body);
          const found = parsed.data?.find((b) => b.id === booking.id);
          if (found) {
            console.log(`8. Customer booking verified in My Rentals:`);
            console.log(`   Status: ${found.status}`);
            console.log(`   Deposit Status: ${found.depositStatus}`);
            console.log(`   Stripe Refund ID: ${found.stripeRefundId}`);
            resolve(found);
          } else {
            reject(new Error('Booking not found in customer bookings'));
          }
        });
      }
    );
  });

  console.log('\n======================================================');
  console.log('🎉 ALL STRIPE PAYMENT & REFUND LIFECYCLES WORK 100% PERFECTLY!');
  console.log('======================================================');
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
