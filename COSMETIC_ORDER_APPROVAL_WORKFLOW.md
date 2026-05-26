# Cosmetic Order Approval Workflow - Implementation Guide

**Date:** May 26, 2026

## 📋 Overview

The cosmetic order system now has a **two-step approval workflow**:

1. **Beautician places order** → Status: "Pending Admin Approval"
2. **Admin reviews and decides** → Accept or Reject
3. **If Accepted** → QR code generated, wallet charged, stock updated
4. **If Rejected** → Order cancelled, no charges applied

---

## 🔄 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 COSMETIC ORDER WORKFLOW                     │
└─────────────────────────────────────────────────────────────┘

1. BEAUTICIAN PLACES ORDER
   ├─ Items selected
   ├─ Wallet balance checked (NOT deducted yet)
   ├─ Stock validated
   └─ Order created with adminApprovalStatus = "Pending"
                                ↓
         Admin notification sent: "Order awaiting approval"
                                ↓
2. ADMIN REVIEWS ORDER
   ├─ Views order details
   ├─ Checks items & amount
   └─ EITHER:
      │
      ├─→ APPROVE
      │   ├─ Wallet deducted ✓
      │   ├─ Stock updated ✓
      │   ├─ QR code generated ✓
      │   ├─ Order status = "Confirmed"
      │   ├─ adminApprovalStatus = "Approved"
      │   └─ Notification sent to Beautician with QR
      │
      └─→ REJECT
          ├─ Wallet NOT deducted
          ├─ Stock NOT updated
          ├─ Order status = "Cancelled"
          ├─ adminApprovalStatus = "Rejected"
          └─ Rejection reason stored & sent to Beautician
```

---

## 💾 Database Changes

### CosmeticOrder Model Updates

**New Fields:**
```javascript
{
  adminApprovalStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  qrCode: { type: String },              // QR code data URL
  qrCodePath: { type: String },          // Path to stored QR code
  approvedAt: Date,                      // When admin approved
  rejectedAt: Date,                      // When admin rejected
  rejectionReason: String,               // Why it was rejected
}
```

---

## 🔌 API Endpoints

### 1. Place Cosmetic Order (Beautician)

**Endpoint:** `POST /mobileapp/cosmetics/orders`

**Authentication:** Required (Beautician)

**Request Body:**
```json
{
  "items": [
    { "itemId": "item_id_1", "quantity": 2 },
    { "itemId": "item_id_2", "quantity": 1 }
  ],
  "shippingAddress": "Shop address",
  "deliveryNotes": "Fragile items"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Order placed successfully. Awaiting admin approval.",
  "note": "Your wallet will be charged only after admin approval",
  "order": {
    "_id": "order_id",
    "beautician": "beautician_id",
    "items": [...],
    "totalAmount": 1500,
    "adminApprovalStatus": "Pending",
    "status": "Pending",
    "createdAt": "2026-05-26T10:00:00Z"
  },
  "walletBalance": 5000
}
```

---

### 2. Get All Cosmetic Orders (Admin)

**Endpoint:** `GET /api/admin/cosmetics/orders`

**Authentication:** Required (Admin/SuperAdmin)

**Query Parameters:**
```
?page=1
&limit=20
&status=Pending                          // Order status filter
&approvalStatus=Pending                  // Approval status filter (NEW)
```

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "_id": "order_id",
      "beautician": { "fullName": "John Doe", "phoneNumber": "..." },
      "items": [...],
      "totalAmount": 1500,
      "status": "Pending",
      "adminApprovalStatus": "Pending",  // NEW FIELD
      "qrCode": null,
      "createdAt": "2026-05-26T10:00:00Z",
      "orderedAt": "2026-05-26T10:00:00Z"
    }
  ],
  "total": 15
}
```

---

### 3. Approve Cosmetic Order (Admin) ✓

**Endpoint:** `POST /api/admin/cosmetics/orders/:orderId/approve`

**Authentication:** Required (Admin/SuperAdmin)

**Request Body:** (empty or none)
```json
{}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Order approved successfully",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",  // Base64 encoded QR code
  "walletDeducted": 1500,
  "order": {
    "_id": "order_id",
    "adminApprovalStatus": "Approved",   // Changed to Approved
    "status": "Confirmed",               // Changed to Confirmed
    "qrCode": "data:image/png;base64...",
    "approvedAt": "2026-05-26T10:05:00Z",
    "confirmedAt": "2026-05-26T10:05:00Z",
    "totalAmount": 1500,
    "items": [...]
  }
}
```

**What Happens on Approval:**
1. ✅ Wallet deducted from beautician
2. ✅ Stock updated (decreased)
3. ✅ QR code generated with order data
4. ✅ Order status changed to "Confirmed"
5. ✅ Notification sent to beautician with QR code
6. ✅ Transaction logged in wallet

---

### 4. Reject Cosmetic Order (Admin) ✗

**Endpoint:** `POST /api/admin/cosmetics/orders/:orderId/reject`

**Authentication:** Required (Admin/SuperAdmin)

**Request Body:**
```json
{
  "reason": "Items out of stock"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Order rejected successfully",
  "note": "No charges were made to the beautician",
  "order": {
    "_id": "order_id",
    "adminApprovalStatus": "Rejected",   // Changed to Rejected
    "status": "Cancelled",               // Changed to Cancelled
    "rejectionReason": "Items out of stock",
    "rejectedAt": "2026-05-26T10:05:00Z"
  }
}
```

**What Happens on Rejection:**
1. ❌ NO wallet deduction
2. ❌ NO stock update
3. ✅ Order marked as cancelled
4. ✅ Rejection reason stored
5. ✅ Notification sent to beautician with reason
6. ✅ No transaction in wallet

---

## 📱 Beautician Mobile App Flow

### Step 1: Place Order
```
User clicks "Place Order"
    ↓
System validates items & wallet
    ↓
Order created (adminApprovalStatus = "Pending")
    ↓
Response: "Order placed! Awaiting admin approval"
    ↓
No wallet charge yet
```

### Step 2: Wait for Approval
```
Beautician's App shows order with status "PENDING APPROVAL"
    ↓
Notification arrives: "Order Approved ✓" OR "Order Rejected ✗"
```

### Step 3a: If Approved
```
Notification received: "Your order has been approved!"
    ↓
QR code displayed in notification
    ↓
Wallet deducted: ₹{amount}
    ↓
Order status changes to "Confirmed"
    ↓
Stock reserved for delivery
```

### Step 3b: If Rejected
```
Notification received: "Your order was rejected"
    ↓
Reason shown: "Items out of stock" / "Insufficient quantity"
    ↓
NO wallet charge
    ↓
Beautician can place new order
```

---

## 📊 Admin Dashboard Updates

### Filter Orders by Approval Status

**Pending Approval Tab:**
```
GET /api/admin/cosmetics/orders?approvalStatus=Pending

Shows all orders awaiting admin decision
```

**Approved Orders Tab:**
```
GET /api/admin/cosmetics/orders?approvalStatus=Approved

Shows all approved orders with QR codes
```

**Rejected Orders Tab:**
```
GET /api/admin/cosmetics/orders?approvalStatus=Rejected

Shows all rejected orders with rejection reasons
```

---

## 🎯 QR Code Details

### QR Code Content

Each QR code encodes order information as JSON:

```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "beauticianId": "507f1f77bcf86cd799439012",
  "amount": 1500,
  "items": 3,
  "approvalDate": "2026-05-26T10:05:00Z"
}
```

### QR Code Usage

```
┌────────────────────┐
│  QR CODE in order  │
│                    │
│   [████████]       │  Generated after admin approval
│   [███  ███]       │  Contains: Order ID, Amount, Date
│   [██████  ]       │  Can be scanned for verification
│                    │
└────────────────────┘
```

---

## 💰 Wallet Transaction Flow

### BEFORE (Old System)
```
Beautician places order → Wallet deducted → Order created
                              ↓
                    Order immediately confirmed
```

### AFTER (New System)
```
Beautician places order → Order created (PENDING)
                              ↓
                    Admin reviews order
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
                APPROVE             REJECT
                    ↓                   ↓
            Wallet deducted      No deduction
            Stock updated        No update
            QR generated         Order cancelled
```

---

## 🔔 Notifications

### For Beautician

**When Order Placed:**
```
Title: "Order Placed - Awaiting Approval"
Message: "Your order of ₹{amount} is awaiting admin approval"
Type: "cosmetic_order_approval"
```

**When Approved:**
```
Title: "Cosmetic Order Approved ✓"
Message: "Your cosmetic order #{id} of ₹{amount} has been approved. QR code generated."
Type: "cosmetic_order_approval"
Data: { orderId, qrCode }
```

**When Rejected:**
```
Title: "Cosmetic Order Rejected ✗"
Message: "Your order #{id} of ₹{amount} was rejected. Reason: {rejectionReason}"
Type: "cosmetic_order_rejection"
Data: { orderId, reason }
```

### For Admin

**Pending Orders Alert:**
```
Title: "Cosmetic Order - Awaiting Approval"
Message: "{BeauticianName} placed an order of ₹{amount} awaiting approval"
Type: "cosmetic_order_approval"
```

---

## 🧪 Testing Steps

### Test 1: Place Order (Admin Approval Pending)

```bash
curl -X POST http://localhost:5000/mobileapp/cosmetics/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"itemId": "item_id", "quantity": 2}
    ],
    "shippingAddress": "Shop address"
  }'

Expected:
- Status: 201 Created
- adminApprovalStatus: "Pending"
- status: "Pending"
- NO wallet deduction yet
```

### Test 2: Admin Views Pending Orders

```bash
curl -X GET "http://localhost:5000/api/admin/cosmetics/orders?approvalStatus=Pending" \
  -H "Authorization: Bearer {admin_token}"

Expected:
- Orders with adminApprovalStatus: "Pending"
- All order details visible
```

### Test 3: Admin Approves Order

```bash
curl -X POST http://localhost:5000/api/admin/cosmetics/orders/{orderId}/approve \
  -H "Authorization: Bearer {admin_token}"

Expected:
- Status: 200 OK
- adminApprovalStatus: "Approved"
- qrCode: base64 image string
- Wallet deducted
```

### Test 4: Verify Wallet Deduction

```bash
# Check beautician wallet after approval
db.wallets.findOne({ user: beautician_user_id })

Expected:
- balance reduced by order amount
- New transaction logged: "...ADMIN APPROVED"
```

### Test 5: Admin Rejects Order

```bash
curl -X POST http://localhost:5000/api/admin/cosmetics/orders/{orderId}/reject \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Items out of stock"
  }'

Expected:
- Status: 200 OK
- adminApprovalStatus: "Rejected"
- status: "Cancelled"
- NO wallet deduction
- rejectionReason stored
```

---

## ⚠️ Error Handling

### Error: Order Already Processed

```json
{
  "success": false,
  "message": "Order already approved"
}
```

**Cause:** Trying to approve/reject an order that was already processed

### Error: Insufficient Wallet Balance

```json
{
  "success": false,
  "message": "Insufficient wallet balance for this order",
  "required": 1500,
  "available": 1000
}
```

**Cause:** Admin tried to approve, but beautician wallet depleted

### Error: Invalid Status

```json
{
  "success": false,
  "message": "Order not found"
}
```

**Cause:** Order ID doesn't exist or was already deleted

---

## 📌 Important Notes

1. **QR Code Generation:** Uses `qrcode` npm package
2. **No Wallet Deduction Until Approval:** Beautician's balance is safe until admin approves
3. **Stock Protection:** Stock is only updated after approval
4. **Audit Trail:** All actions are logged in wallet transactions
5. **Notifications:** Both beautician and admin notified of all actions
6. **Backward Compatibility:** Existing orders continue to work normally

---

## 🚀 Summary

| Step | Action | Wallet | Stock | QR Code | Status |
|------|--------|--------|-------|---------|--------|
| 1 | Beautician places | ❌ | ❌ | ❌ | Pending |
| 2a | Admin approves | ✅ | ✅ | ✅ | Confirmed |
| 2b | Admin rejects | ❌ | ❌ | ❌ | Cancelled |

---

**Last Updated:** May 26, 2026  
**Version:** 2.0 (Approval Workflow Added)
