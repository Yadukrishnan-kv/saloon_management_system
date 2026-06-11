# Razorpay Wallet Payment Integration Guide

## Overview
This document explains the backend implementation of Razorpay payment gateway for Beautician wallet recharge in the Salon MERN application.

## Architecture

### Flow Diagram
```
Mobile App                    Backend Server              Razorpay
   |                              |                          |
   |-- createWalletOrder -------->|                          |
   |                              |-- createOrder ---------->|
   |                              |<-- Order Created --------|
   |<-- Order Details ------------|                          |
   |                              |                          |
   |-- Razorpay Payment UI -------|                          |
   |  (Payment Processing)        |                          |
   |                              |                          |
   |-- verifyWalletPayment ------>|                          |
   |  (With Payment Signature)    |                          |
   |                              |-- verifyPaymentSignature |
   |                              |-- getPaymentDetails ---->|
   |                              |<-- Payment Verified -----|
   |                              |                          |
   |<-- Wallet Credited ---------|                          |
   |                              |                          |
   |      (Async Webhook)         |                          |
   |                              |<-- Webhook Event --------|
   |                              |- processWebhook         |
   |                              |                          |
```

## Database Schema Changes

### Wallet Model Updates
```javascript
// New fields added to walletSchema:

pendingOrders: [
  {
    razorpayOrderId: String (unique),
    amount: Number,
    currency: String,
    status: "created" | "paid" | "expired" | "failed",
    createdAt: Date (expires after 1 hour)
  }
]

totalEarnings: Number    // Total money added to wallet
totalWithdrawals: Number // Total money withdrawn
```

### Transaction Reference Enhancement
```javascript
reference: {
  // ... existing fields ...
  razorpayOrderId: String,
  razorpayPaymentId: String,
}
```

## Backend Components

### 1. Razorpay Service (`services/razorpayService.js`)

#### Functions Available:

**a) `createOrder(amount, beauticianId, description)`**
- Creates a Razorpay order
- Returns: `{ success, orderId, amount, currency }`
- Amount is automatically converted to paise (multiply by 100)

**b) `verifyPaymentSignature(orderId, paymentId, signature)`**
- Verifies payment signature from client
- Returns: `boolean`
- Uses HMAC-SHA256 for verification

**c) `verifyWebhookSignature(body, signature)`**
- Verifies Razorpay webhook signature
- Returns: `boolean`
- Called from webhook handler

**d) `getPaymentDetails(paymentId)`**
- Fetches payment details from Razorpay
- Returns: `{ success, payment }`

**e) `getOrderDetails(orderId)`**
- Fetches order details from Razorpay
- Returns: `{ success, order }`

**f) `refundPayment(paymentId, amount)`**
- Initiates refund for a payment
- Returns: `{ success, refund }`

### 2. Controller Functions (`controllers/mobileappPaymentController.js`)

#### **`createWalletOrder(req, res)`**
- **Endpoint**: `POST /api/payment/wallet/create-order`
- **Auth**: Required (Bearer token)
- **Body Parameters**:
  ```json
  {
    "amount": 500  // INR
  }
  ```
- **Validation**:
  - Amount >= ₹100
  - Amount <= ₹100,000
  - Amount must be positive
  
- **Response**:
  ```json
  {
    "success": true,
    "message": "Order created successfully",
    "order": {
      "id": "order_1a2b3c4d5e6f7g8h",
      "amount": 50000,          // in paise
      "currency": "INR",
      "keyId": "rzp_live_xxxxx",
      "prefill": {
        "name": "Beautician Name",
        "email": "email@example.com",
        "contact": "9876543210"
      }
    }
  }
  ```

#### **`verifyWalletPayment(req, res)`**
- **Endpoint**: `POST /api/payment/wallet/verify-payment`
- **Auth**: Required (Bearer token)
- **Body Parameters**:
  ```json
  {
    "razorpayOrderId": "order_1a2b3c4d5e6f7g8h",
    "razorpayPaymentId": "pay_1a2b3c4d5e6f7g8h",
    "razorpaySignature": "signature_hash"
  }
  ```

- **Verification Steps**:
  1. Verify signature locally
  2. Find pending order in wallet
  3. Fetch payment details from Razorpay
  4. Verify payment status is "captured"
  5. Verify amount matches
  6. Update wallet balance
  7. Create transaction record
  8. Send notification

- **Response**:
  ```json
  {
    "success": true,
    "message": "Payment verified successfully",
    "wallet": {
      "balance": 5500,
      "currency": "INR"
    },
    "transaction": {
      "id": "pay_1a2b3c4d5e6f7g8h",
      "amount": 500,
      "date": "2024-01-15T10:30:00Z",
      "status": "completed"
    }
  }
  ```

#### **`paymentWebhook(req, res)`**
- **Endpoint**: `POST /api/payment/webhook`
- **Auth**: Not required (Verified by signature)
- **Events Handled**:
  - `payment.captured` - Payment successful (backup handler)
  - `payment.failed` - Payment failed
  - `refund.created` - Refund initiated

### 3. Webhook Handler (`services/razorpayWebhookHandler.js`)

#### Events Handled:

**a) `payment.captured`**
- Triggered when payment is successfully captured
- Credits wallet if not already credited via client
- Avoids double crediting through signature verification

**b) `payment.failed`**
- Triggered when payment fails
- Marks order as failed
- Sends failure notification to user

**c) `refund.created`**
- Triggered when refund is initiated
- Records refund transaction
- Deducts from wallet balance
- Sends refund notification

## API Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/payment/wallet/create-order` | Create Razorpay order | Yes |
| POST | `/api/payment/wallet/verify-payment` | Verify and credit payment | Yes |
| GET | `/api/payment/wallet` | Get wallet details | Yes |
| POST | `/api/payment/wallet/add` | Add money (non-Razorpay) | Yes |
| POST | `/api/payment/wallet/use-points` | Redeem points | Yes |
| GET | `/api/payment/transactions` | Get transaction history | Yes |
| POST | `/api/payment/webhook` | Razorpay webhook | No |

## Setup Instructions

### 1. Environment Variables

Add to `.env` file:
```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
PAYMENT_MIN_AMOUNT=100
PAYMENT_MAX_AMOUNT=100000
MIN_WALLET_BALANCE=50
```

### 2. Install Dependencies

```bash
cd Server
npm install razorpay
```

### 3. Register Routes

In `server.js` or your main app file:
```javascript
const paymentRoutes = require('./routes/mobileappPaymentRoutes');
app.use('/api/payment', paymentRoutes);
```

### 4. Configure Webhook

In Razorpay Dashboard:
1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payment/webhook`
3. Select events:
   - payment.authorized
   - payment.captured
   - payment.failed
   - refund.created
4. Copy webhook secret and add to `.env`

## Security Best Practices

### ✅ Implemented

1. **Signature Verification** - All payments verified using HMAC-SHA256
2. **Server-side Validation** - Amount, currency verified on backend
3. **Idempotency** - Prevents double crediting via webhook + client verification
4. **Rate Limiting** - Use middleware to prevent abuse
5. **Amount Limits** - Min ₹100, Max ₹100,000
6. **Transaction Logging** - All payments recorded with status

### ⚠️ Additional Recommendations

1. **IP Whitelisting** - Whitelist Razorpay IPs for webhook
2. **HTTPS Only** - Use HTTPS for all payment endpoints
3. **Secrets Management** - Store keys in secure vault, not in code
4. **Audit Logging** - Log all payment events
5. **Rate Limiting** - Implement rate limiting on payment endpoints
6. **Encryption** - Encrypt sensitive payment data at rest

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid signature | Signature verification failed | Check RAZORPAY_KEY_SECRET in .env |
| Order not found | Order doesn't exist in wallet | Ensure order was created before verification |
| Amount mismatch | Order amount ≠ Payment amount | Check if amount in rupees vs paise |
| Payment not captured | Payment status not "captured" | Wait for Razorpay to capture (usually instant) |
| Wallet not found | User doesn't have wallet | Wallet auto-created on first payment attempt |

## Testing

### Using Razorpay Test Mode

1. **Test Credentials**:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=test_secret_key
   ```

2. **Test Payment Details**:
   - **Card**: 4111 1111 1111 1111
   - **Expiry**: Any future date
   - **CVV**: Any 3 digits
   - **OTP**: 123456 (or skip)

3. **Testing Webhook Locally**:
   - Use `ngrok` to expose local server
   - Set webhook URL to ngrok URL
   - Use Razorpay webhook tester in dashboard

### Test Scenarios

```bash
# Create order
POST /api/payment/wallet/create-order
Content-Type: application/json
Authorization: Bearer {token}

{
  "amount": 500
}

# Response
{
  "success": true,
  "order": { ... }
}

# Complete payment in Razorpay UI
# Then verify

POST /api/payment/wallet/verify-payment
Content-Type: application/json
Authorization: Bearer {token}

{
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "sig_xxx"
}
```

## Troubleshooting

### Issue: Payment verified but wallet not credited

**Solution**:
1. Check if wallet exists: `GET /api/payment/wallet`
2. Check transaction history: `GET /api/payment/transactions`
3. Check server logs for errors
4. Verify Razorpay payment details: Check payment ID on Razorpay dashboard

### Issue: Webhook not being called

**Solution**:
1. Verify webhook URL in Razorpay dashboard
2. Check webhook secret matches: `RAZORPAY_WEBHOOK_SECRET`
3. Ensure server is accessible publicly (not localhost)
4. Check firewall/security groups allow Razorpay IPs
5. View webhook logs in Razorpay dashboard

### Issue: Double crediting

**Solution**:
1. This is prevented by checking `pendingOrder.status`
2. Once marked as "paid", subsequent requests are rejected
3. Check database for duplicate transactions

## Mobile App Integration

### Frontend Flow (Client-side):

```javascript
// 1. Create order
const response = await fetch('/api/payment/wallet/create-order', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ amount: 500 })
});
const { order } = await response.json();

// 2. Open Razorpay payment UI
const options = {
  key: order.keyId,
  amount: order.amount,
  currency: order.currency,
  order_id: order.id,
  prefill: order.prefill,
  handler: async (response) => {
    // 3. Verify payment on backend
    const result = await fetch('/api/payment/wallet/verify-payment', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature
      })
    });
    
    if (result.ok) {
      // Show success
    }
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

## Performance Considerations

1. **Database Indexes**: Ensure indexes on `razorpayOrderId` and `user`
2. **Webhook Processing**: Use queue system (Bull, RabbitMQ) for high volume
3. **Caching**: Cache wallet balance for reads
4. **Async Operations**: Send notifications asynchronously

## Future Enhancements

- [ ] Refund management UI
- [ ] Auto-retry failed payments
- [ ] Subscription/recurring payments
- [ ] Multiple payment methods
- [ ] Payment analytics dashboard
- [ ] Batch payouts to beauticians
- [ ] Wallet withdrawal to bank

## Support & References

- **Razorpay Documentation**: https://razorpay.com/docs/
- **Razorpay API Reference**: https://razorpay.com/docs/api/
- **Webhook Events**: https://razorpay.com/docs/webhooks/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-cards/

---

**Last Updated**: January 2024
**Version**: 1.0.0
