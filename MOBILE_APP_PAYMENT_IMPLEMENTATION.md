# Mobile App - Payment Implementation Guide

## Overview
This document describes the payment system implementation for the mobile app customer booking service. The system supports three payment methods:
1. **UPI Payment** (via Razorpay)
2. **Wallet Payment** (with partial payment support)
3. **Pay On Site** (Cash or UPI after service completion)

---

## Database Model Updates

### Booking Model Extended Fields

```javascript
// Payment Options
paymentMethod: {
  type: String,
  enum: ["upi", "wallet", "payOnSite"],
  required: true,
}

// UPI Payment (Razorpay)
razorpayPayment: {
  orderId: String,
  paymentId: String,
  signature: String,
  paymentStatus: enum ["pending", "completed", "failed"],
  amountPaid: Number,
  paidAt: Date,
}

// Wallet Payment
walletPayment: {
  amountDeducted: Number,
  deductedAt: Date,
}

// Partial Payment - Wallet insufficient
partialPayment: {
  walletAmount: Number,
  remainingAmount: Number,
  remainingPaymentMethod: enum ["upi", "payOnSite"],
  razorpayOrderId: String,
  razorpayPaymentId: String,
  paidAt: Date,
}

// Pay On Site
payOnSite: {
  status: enum ["pending", "completed"],
  paymentMode: enum ["cash", "upi"],
  paidAt: Date,
}
```

---

## API Endpoints

### 1. Create Booking with Payment Method
**POST** `/api/mobile/bookings/create`

**Request Body:**
```json
{
  "serviceIds": ["service-id-1", "service-id-2"],
  "bookingDate": "2026-06-15",
  "bookingTime": "10:00",
  "address": {
    "address": "123 Main St",
    "unit": "Apt 4B",
    "city": "Mumbai",
    "pincode": "400001",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "notes": "Please call before arrival",
  "addonIds": ["addon-id-1"],
  "paymentMethod": "upi",  // NEW: "upi" | "wallet" | "payOnSite"
  "walletAmount": 0        // NEW: Only for wallet payment
}
```

**Response (UPI Payment):**
```json
{
  "success": true,
  "message": "Booking created. Please complete UPI payment to confirm.",
  "booking": { /* booking object */ },
  "paymentMethod": "upi",
  "razorpayOrderId": "order_xxxxx",
  "estimatedTotalAmount": 1500
}
```

**Response (Wallet - Sufficient Balance):**
```json
{
  "success": true,
  "message": "Booking confirmed! Amount deducted from wallet.",
  "booking": { /* booking object */ },
  "paymentMethod": "wallet",
  "walletDeducted": 1500
}
```

**Response (Wallet - Insufficient Balance):**
```json
{
  "success": true,
  "message": "Wallet balance is insufficient. Please choose to pay remaining via UPI or Pay On Site.",
  "booking": { /* booking object */ },
  "paymentMethod": "wallet",
  "walletAmount": 800,
  "remainingAmount": 700
}
```

**Response (Pay On Site):**
```json
{
  "success": true,
  "message": "Booking created. Payment will be collected after service completion.",
  "booking": { /* booking object */ },
  "paymentMethod": "payOnSite",
  "estimatedTotalAmount": 1500
}
```

---

### 2. Verify UPI Payment
**POST** `/api/mobile/bookings/payment/verify-upi`

**Used when:** Customer completes UPI payment via Razorpay

**Request Body:**
```json
{
  "bookingId": "booking-id",
  "razorpayOrderId": "order_xxxxx",
  "razorpayPaymentId": "pay_xxxxx",
  "razorpaySignature": "signature_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully. Booking confirmed.",
  "booking": { /* booking object with payment verified */ }
}
```

---

### 3. Update Partial Payment Method
**POST** `/api/mobile/bookings/payment/update-partial`

**Used when:** Wallet has insufficient balance, customer chooses how to pay remaining amount

**Request Body:**
```json
{
  "bookingId": "booking-id",
  "remainingPaymentMethod": "upi",  // "upi" or "payOnSite"
  "razorpayOrderId": "order_xxxxx"  // Required only if remainingPaymentMethod is "upi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Remaining ₹700 payment method updated to UPI.",
  "booking": { /* booking object */ }
}
```

---

### 4. Verify Partial UPI Payment
**POST** `/api/mobile/bookings/payment/verify-partial-upi`

**Used when:** Customer completes payment for remaining amount via UPI

**Request Body:**
```json
{
  "bookingId": "booking-id",
  "razorpayPaymentId": "pay_xxxxx",
  "razorpaySignature": "signature_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Partial payment verified successfully. Booking confirmed.",
  "booking": { /* booking object with full payment received */ }
}
```

---

## Payment Flow Diagrams

### Flow 1: UPI Payment
```
1. Customer selects UPI payment
   ↓
2. API creates Razorpay order
   ↓
3. Booking created with paymentMethod: "upi"
   ↓
4. Razorpay Order ID returned to client
   ↓
5. Client opens Razorpay payment UI
   ↓
6. Customer completes UPI payment
   ↓
7. Client calls verify-upi endpoint
   ↓
8. API verifies signature and confirms booking
   ↓
9. Payment Status: "Paid"
```

### Flow 2: Wallet Payment (Sufficient Balance)
```
1. Customer selects Wallet payment
   ↓
2. API checks wallet balance
   ↓
3. Balance >= totalAmount
   ↓
4. API deducts amount from wallet
   ↓
5. Booking created with paymentMethod: "wallet"
   ↓
6. Wallet transaction recorded
   ↓
7. Payment Status: "Paid"
```

### Flow 3: Wallet Payment (Insufficient Balance - Pay Remaining via UPI)
```
1. Customer selects Wallet payment
   ↓
2. API checks wallet balance
   ↓
3. Balance < totalAmount but > 0
   ↓
4. Booking created with partialPayment details
   ↓
5. remainingPaymentMethod: "" (pending)
   ↓
6. Client prompts customer to choose UPI or Pay On Site
   ↓
7. If UPI: Client calls update-partial with "upi"
   ↓
8. API creates Razorpay order for remaining amount
   ↓
9. Client calls verify-partial-upi after payment
   ↓
10. API verifies and confirms booking
   ↓
11. Payment Status: "Paid"
```

### Flow 4: Wallet Payment (Insufficient Balance - Pay Remaining On Site)
```
1. Customer selects Wallet payment
   ↓
2. API checks wallet balance
   ↓
3. Balance < totalAmount but > 0
   ↓
4. Booking created with partialPayment details
   ↓
5. Client calls update-partial with "payOnSite"
   ↓
6. remainingPaymentMethod: "payOnSite"
   ↓
7. Booking confirmed
   ↓
8. Payment Status: "Pending" (for remaining amount)
   ↓
9. Beautician collects remaining amount after service
```

### Flow 5: Pay On Site
```
1. Customer selects Pay On Site
   ↓
2. Booking created with paymentMethod: "payOnSite"
   ↓
3. payOnSite.status: "pending"
   ↓
4. Booking confirmed
   ↓
5. Payment Status: "Pending"
   ↓
6. Beautician collects payment after service
   ↓
7. Beautician updates payOnSite.paymentMode (cash/upi)
   ↓
8. Payment Status: "Paid"
```

---

## Client Integration Guide

### Step 1: Create Booking with Payment Method

```javascript
// Example: Create booking with UPI payment
const createBooking = async () => {
  const response = await fetch('/api/mobile/bookings/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceIds: ['service-1'],
      bookingDate: '2026-06-15',
      bookingTime: '10:00',
      address: { /* ... */ },
      paymentMethod: 'upi'
    })
  });
  
  const data = await response.json();
  
  if (data.success && data.razorpayOrderId) {
    // Open Razorpay payment
    openRazorpayPayment(data.razorpayOrderId);
  }
};
```

### Step 2: Integrate Razorpay Payment SDK

```javascript
// Add Razorpay script to your app
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>

// Open Razorpay UI
const openRazorpayPayment = (orderId) => {
  const options = {
    key: RAZORPAY_KEY_ID,
    order_id: orderId,
    handler: async (response) => {
      // Verify payment
      const verifyResponse = await fetch('/api/mobile/bookings/payment/verify-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: BOOKING_ID,
          razorpayOrderId: orderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        })
      });
      
      const data = await verifyResponse.json();
      if (data.success) {
        showSuccess('Payment confirmed!');
      }
    }
  };
  
  const rzp = new Razorpay(options);
  rzp.open();
};
```

### Step 3: Handle Wallet Payment

```javascript
// If wallet has insufficient balance
if (response.remainingAmount) {
  // Show options: Pay via UPI or Pay On Site
  showPaymentOptions({
    walletAmount: response.walletAmount,
    remainingAmount: response.remainingAmount,
    bookingId: response.booking._id
  });
}

// If customer chooses UPI for remaining amount
const payRemainingViaUPI = async (bookingId, remainingAmount) => {
  const response = await fetch('/api/mobile/bookings/payment/update-partial', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      remainingPaymentMethod: 'upi'
    })
  });
  
  const data = await response.json();
  openRazorpayPayment(data.razorpayOrderId);
};

// If customer chooses Pay On Site for remaining amount
const payRemainingOnSite = async (bookingId) => {
  const response = await fetch('/api/mobile/bookings/payment/update-partial', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      remainingPaymentMethod: 'payOnSite'
    })
  });
  
  if (response.success) {
    showSuccess('Booking confirmed. Pay remaining on site.');
  }
};
```

---

## Environment Variables Required

```env
# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## Testing with Razorpay Test Credentials

### Test Card Numbers (UPI):
- **Mock UPI ID**: test@razorpay
- **OTP**: 111111
- **Use test mode**: `rzp_test_*` credentials

### Test Status Codes:
- **Success**: Complete payment with correct OTP
- **Failure**: Wrong OTP or network error

---

## Error Handling

### Common Errors and Responses

**1. Invalid Payment Method**
```json
{
  "success": false,
  "message": "Invalid payment method. Must be 'upi', 'wallet', or 'payOnSite'"
}
```

**2. Wallet Not Found**
```json
{
  "success": false,
  "message": "Wallet not found for your account"
}
```

**3. Insufficient Wallet Balance**
```json
{
  "success": false,
  "message": "Insufficient wallet balance. Please use UPI or Pay On Site option.",
  "walletBalance": 500,
  "requiredAmount": 1500
}
```

**4. Invalid Razorpay Signature**
```json
{
  "success": false,
  "message": "Payment signature verification failed"
}
```

**5. Booking Not Found**
```json
{
  "success": false,
  "message": "Booking not found"
}
```

---

## Implementation Checklist

- [x] Updated Booking model with payment fields
- [x] Updated createBooking function with payment logic
- [x] Added verifyUPIPayment endpoint
- [x] Added updatePartialPayment endpoint
- [x] Added verifyPartialUPIPayment endpoint
- [x] Updated routes with new payment endpoints
- [x] Integrated Razorpay service
- [x] Wallet integration for payment deduction
- [ ] Client-side Razorpay payment UI integration
- [ ] Client-side payment option selection UI
- [ ] Test all payment flows
- [ ] Add payment status tracking UI

---

## Future Enhancements

1. **Webhook Integration**: Auto-update payment status from Razorpay webhooks
2. **Refund Handling**: Auto-refund for cancelled bookings
3. **Payment History**: Detailed transaction history for customers
4. **Payment Analytics**: Dashboard for platform earnings
5. **Recurring Payments**: Auto-booking with saved payment methods
6. **Multiple Payment Methods**: Add more payment gateways
7. **Split Payment**: Multiple payers for group bookings
8. **Subscription Payments**: Monthly service subscriptions

---

## Testing Workflow

```bash
# 1. Create booking with UPI payment
POST /api/mobile/bookings/create
Body: { paymentMethod: "upi", ... }
Response: Get razorpayOrderId

# 2. Complete Razorpay payment in UI (use test credentials)

# 3. Verify payment
POST /api/mobile/bookings/payment/verify-upi
Body: { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
Response: Booking confirmed with Payment Status: "Paid"

# 4. Check booking status
GET /api/mobile/bookings/{bookingId}
Response: Verify paymentMethod, paymentStatus, and payment details
```

---

## Contact & Support

For issues or questions regarding payment implementation:
- Check Razorpay documentation: https://razorpay.com/docs/api/
- Review error responses carefully
- Ensure .env variables are correctly set
- Verify wallet balance before booking

