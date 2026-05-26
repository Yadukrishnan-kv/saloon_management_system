# Cosmetic Order Approval Workflow - API Testing Guide

## 🧪 Complete Testing with cURL

### Prerequisites
```bash
# Set your base URL
BASE_URL="http://localhost:5000"

# Set admin token (from login response)
ADMIN_TOKEN="your_admin_jwt_token_here"

# Set beautician token (from login response)
BEAUTICIAN_TOKEN="your_beautician_jwt_token_here"

# Set order ID (from place order response)
ORDER_ID="order_id_from_response"

# Set cosmetic item ID (existing item in database)
ITEM_ID="existing_cosmetic_item_id"
```

---

## 📋 Test Scenario: Complete Workflow

### Step 1️⃣: Beautician Places Order (NOT charged yet)

**Endpoint:** `POST /mobileapp/cosmetics/orders`

**cURL Command:**
```bash
curl -X POST $BASE_URL/mobileapp/cosmetics/orders \
  -H "Authorization: Bearer $BEAUTICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "itemId": "'$ITEM_ID'",
        "quantity": 2
      }
    ],
    "shippingAddress": "123 Main Street, Beauty Shop",
    "deliveryNotes": "Fragile - Handle with care"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order placed successfully. Awaiting admin approval.",
  "note": "Your wallet will be charged only after admin approval",
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "beautician": "507f1f77bcf86cd799439001",
    "items": [
      {
        "item": "507f1f77bcf86cd799439005",
        "name": "Premium Hair Serum",
        "quantity": 2,
        "price": 500
      }
    ],
    "totalAmount": 1000,
    "shippingAddress": "123 Main Street, Beauty Shop",
    "adminApprovalStatus": "Pending",
    "status": "Pending",
    "createdAt": "2026-05-26T10:15:00Z"
  },
  "walletBalance": 5000
}
```

**What to verify:**
- ✅ `adminApprovalStatus` = "Pending"
- ✅ `status` = "Pending"
- ✅ Wallet balance UNCHANGED (still 5000)
- ✅ Order ID returned (save this for next tests)

**Store the ORDER_ID from response:**
```bash
ORDER_ID="507f1f77bcf86cd799439011"
```

---

### Step 2️⃣: Admin Views Pending Orders

**Endpoint:** `GET /api/admin/cosmetics/orders?approvalStatus=Pending`

**cURL Command:**
```bash
curl -X GET "$BASE_URL/api/admin/cosmetics/orders?approvalStatus=Pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "beautician": {
        "_id": "507f1f77bcf86cd799439001",
        "fullName": "John Doe",
        "phoneNumber": "9876543210"
      },
      "items": [
        {
          "item": {
            "_id": "507f1f77bcf86cd799439005",
            "name": "Premium Hair Serum",
            "price": 500
          },
          "quantity": 2,
          "price": 500
        }
      ],
      "totalAmount": 1000,
      "status": "Pending",
      "adminApprovalStatus": "Pending",
      "qrCode": null,
      "createdAt": "2026-05-26T10:15:00Z"
    }
  ],
  "total": 1
}
```

**What to verify:**
- ✅ Order appears in list
- ✅ `adminApprovalStatus` = "Pending"
- ✅ `qrCode` = null (not yet generated)
- ✅ Admin can see beautician details

---

### Step 3️⃣A: Admin APPROVES Order ✅

**Endpoint:** `POST /api/admin/cosmetics/orders/:orderId/approve`

**cURL Command:**
```bash
curl -X POST $BASE_URL/api/admin/cosmetics/orders/$ORDER_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order approved successfully",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAADICAIAAACmeuP4AAAAgElEQVR4nO3BMQEAAADCoPVPbQhfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF3wQAAZu5s6AAAAASUVORK5CYII=",
  "walletDeducted": 1000,
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "beautician": "507f1f77bcf86cd799439001",
    "items": [...],
    "totalAmount": 1000,
    "adminApprovalStatus": "Approved",
    "status": "Confirmed",
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "approvedAt": "2026-05-26T10:20:00Z",
    "confirmedAt": "2026-05-26T10:20:00Z"
  }
}
```

**What to verify:**
- ✅ `adminApprovalStatus` changed to "Approved"
- ✅ `status` changed to "Confirmed"
- ✅ `qrCode` generated (base64 encoded image)
- ✅ `approvedAt` timestamp set
- ✅ `walletDeducted` = 1000

**Verify Wallet Deduction:**
```bash
# Query beautician's wallet
curl -X GET $BASE_URL/api/wallet \
  -H "Authorization: Bearer $BEAUTICIAN_TOKEN"
```

Expected: Wallet balance reduced by 1000

---

### Step 3️⃣B: Admin REJECTS Order ❌

**Endpoint:** `POST /api/admin/cosmetics/orders/:orderId/reject`

**cURL Command:**
```bash
curl -X POST $BASE_URL/api/admin/cosmetics/orders/$ORDER_ID/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Items currently out of stock. Please check back in 2 days."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order rejected successfully",
  "note": "No charges were made to the beautician",
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "beautician": "507f1f77bcf86cd799439001",
    "items": [...],
    "totalAmount": 1000,
    "adminApprovalStatus": "Rejected",
    "status": "Cancelled",
    "rejectionReason": "Items currently out of stock. Please check back in 2 days.",
    "rejectedAt": "2026-05-26T10:25:00Z"
  }
}
```

**What to verify:**
- ✅ `adminApprovalStatus` = "Rejected"
- ✅ `status` = "Cancelled"
- ✅ `rejectionReason` stored correctly
- ✅ `rejectedAt` timestamp set
- ✅ Wallet balance UNCHANGED

---

## 🔄 Alternative Test Scenarios

### Scenario A: Approve Multiple Orders in Sequence

```bash
#!/bin/bash

# Get all pending orders
ORDERS=$(curl -s -X GET "$BASE_URL/api/admin/cosmetics/orders?approvalStatus=Pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.orders[].\_id')

# Approve each order
for ORDER in $ORDERS; do
  echo "Approving order: $ORDER"
  curl -X POST $BASE_URL/api/admin/cosmetics/orders/$ORDER/approve \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}'
  echo ""
done
```

### Scenario B: Reject with Different Reasons

```bash
# Reason 1: Out of Stock
curl -X POST $BASE_URL/api/admin/cosmetics/orders/$ORDER_ID/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Items out of stock"}'

# Reason 2: Exceeded Stock Limit
curl -X POST $BASE_URL/api/admin/cosmetics/orders/$ORDER_ID/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Cannot approve: exceeds maximum stock allocation per order"}'

# Reason 3: Verification Issue
curl -X POST $BASE_URL/api/admin/cosmetics/orders/$ORDER_ID/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Beautician account requires verification"}'
```

---

## 🔍 Verification & Inspection

### Check if Order Approved Successfully

```bash
curl -X GET $BASE_URL/api/admin/cosmetics/orders/$ORDER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Extract and Save QR Code Image

```bash
# Get the QR code from approved order
QR_CODE=$(curl -s -X GET $BASE_URL/api/admin/cosmetics/orders/$ORDER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.order.qrCode')

# Save QR code as image (from base64)
echo $QR_CODE | base64 --decode > qr_code_$ORDER_ID.png
echo "QR code saved as: qr_code_$ORDER_ID.png"
```

### View Wallet Transaction History

```bash
curl -X GET "$BASE_URL/api/wallet?limit=10" \
  -H "Authorization: Bearer $BEAUTICIAN_TOKEN" \
  -H "Content-Type: application/json"
```

Expected transactions in response:
```json
{
  "transactions": [
    {
      "type": "debit",
      "amount": 1000,
      "description": "Cosmetic order #507f1f77bcf86cd799439011 - 1 item(s) [ADMIN APPROVED]",
      "status": "completed"
    }
  ]
}
```

---

## ⚠️ Error Scenario Testing

### Test 1: Approve Already Approved Order

```bash
curl -X POST $BASE_URL/api/admin/cosmetics/orders/$ORDER_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Error Response:**
```json
{
  "success": false,
  "message": "Order already approved"
}
```

---

### Test 2: Insufficient Wallet Balance

```bash
# First, deplete beautician's wallet
# Then try to approve a new order

curl -X POST $BASE_URL/api/admin/cosmetics/orders/$ORDER_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Error Response:**
```json
{
  "success": false,
  "message": "Insufficient wallet balance for this order",
  "required": 1500,
  "available": 500
}
```

---

### Test 3: Reject Without Reason

```bash
curl -X POST $BASE_URL/api/admin/cosmetics/orders/$ORDER_ID/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": ""}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order rejected successfully",
  "order": {
    "rejectionReason": "No reason provided"
  }
}
```

---

### Test 4: Invalid Order ID

```bash
curl -X POST $BASE_URL/api/admin/cosmetics/orders/invalid_id/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Error Response:**
```json
{
  "success": false,
  "message": "Order not found"
}
```

---

### Test 5: Unauthorized Access (Beautician tries to approve)

```bash
curl -X POST $BASE_URL/api/admin/cosmetics/orders/$ORDER_ID/approve \
  -H "Authorization: Bearer $BEAUTICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Error Response:**
```json
{
  "success": false,
  "message": "Not authorized for this role"
}
```

---

## 📊 Data Verification Queries

### MongoDB Query: Check Order Status Changes

```bash
# Connect to MongoDB
mongo

# Use your database
use salon_db

# Check order progression
db.cosmeticorders.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })
```

Expected output shows:
- `adminApprovalStatus`: "Approved" or "Rejected"
- `status`: "Confirmed" or "Cancelled"
- `qrCode`: Base64 string (if approved)
- `approvedAt` or `rejectedAt`: Timestamp

### MongoDB Query: Check Wallet Transactions

```bash
db.wallets.findOne(
  { user: ObjectId("beautician_user_id") },
  { transactions: { $slice: -5 } }
)
```

### MongoDB Query: Get All Pending Orders

```bash
db.cosmeticorders.find({ 
  adminApprovalStatus: "Pending" 
}).pretty()
```

### MongoDB Query: Get Approved Orders with QR Codes

```bash
db.cosmeticorders.find({
  adminApprovalStatus: "Approved",
  qrCode: { $exists: true, $ne: null }
}).count()
```

---

## 🎯 Postman Collection JSON

**Import this into Postman:**

```json
{
  "info": {
    "name": "Cosmetic Order Approval API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Place Order (Pending Approval)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{BEAUTICIAN_TOKEN}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{BASE_URL}}/mobileapp/cosmetics/orders",
          "host": ["{{BASE_URL}}"],
          "path": ["mobileapp", "cosmetics", "orders"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\n  \"items\": [\n    {\n      \"itemId\": \"{{ITEM_ID}}\",\n      \"quantity\": 2\n    }\n  ],\n  \"shippingAddress\": \"123 Beauty Shop\"\n}"
        }
      }
    },
    {
      "name": "2. Get Pending Orders (Admin)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{ADMIN_TOKEN}}"
          }
        ],
        "url": {
          "raw": "{{BASE_URL}}/api/admin/cosmetics/orders?approvalStatus=Pending",
          "host": ["{{BASE_URL}}"],
          "path": ["api", "admin", "cosmetics", "orders"],
          "query": [
            {
              "key": "approvalStatus",
              "value": "Pending"
            }
          ]
        }
      }
    },
    {
      "name": "3. Approve Order",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{ADMIN_TOKEN}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{BASE_URL}}/api/admin/cosmetics/orders/{{ORDER_ID}}/approve",
          "host": ["{{BASE_URL}}"],
          "path": ["api", "admin", "cosmetics", "orders", "{{ORDER_ID}}", "approve"]
        },
        "body": {
          "mode": "raw",
          "raw": "{}"
        }
      }
    },
    {
      "name": "4. Reject Order",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{ADMIN_TOKEN}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{BASE_URL}}/api/admin/cosmetics/orders/{{ORDER_ID}}/reject",
          "host": ["{{BASE_URL}}"],
          "path": ["api", "admin", "cosmetics", "orders", "{{ORDER_ID}}", "reject"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\n  \"reason\": \"Items out of stock\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "BASE_URL",
      "value": "http://localhost:5000"
    },
    {
      "key": "ADMIN_TOKEN",
      "value": ""
    },
    {
      "key": "BEAUTICIAN_TOKEN",
      "value": ""
    },
    {
      "key": "ORDER_ID",
      "value": ""
    },
    {
      "key": "ITEM_ID",
      "value": ""
    }
  ]
}
```

---

## ✅ Complete Testing Checklist

- [ ] Install qrcode: `npm install qrcode`
- [ ] Restart server: `npm run dev`
- [ ] Place order as beautician (should be Pending)
- [ ] Verify wallet NOT deducted
- [ ] Admin views pending orders
- [ ] Admin approves order
- [ ] Verify QR code generated
- [ ] Verify wallet deducted
- [ ] Verify stock updated
- [ ] Test rejection workflow
- [ ] Verify no wallet deduction on rejection
- [ ] Test error scenarios
- [ ] Check notification delivery
- [ ] Verify MongoDB transactions

---

## 🚀 Next Steps

1. ✅ Run: `npm install qrcode`
2. ✅ Restart server
3. ✅ Test with provided cURL commands
4. ✅ Import Postman collection
5. ✅ Implement frontend UI
6. ✅ Deploy to production

---

**Happy Testing!** 🎉
