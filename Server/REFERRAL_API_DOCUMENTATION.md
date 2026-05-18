# Referral System API Documentation

## Overview
Unified API endpoints for managing referral details for both Customers and Beauticians.

---

## Base URL
```
http://localhost:5000/api/mobileapp/referral
```

## Authentication
All endpoints require JWT token in the `Authorization` header:
```
Authorization: Bearer {token}
```

---

## Endpoints

### 1. Get Comprehensive Referral Details
**This is the main unified endpoint for both Customer & Beautician**

**Endpoint:** `GET /details`

**Description:** Returns complete referral information including referral code, statistics, and list of referred users.

**Request Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "userType": "Customer",           // or "Beautician"
    "userId": "user_id",
    "username": "john_doe",           // For Customer
    "fullName": "John Doe",           // For Beautician
    "email": "john@example.com",
    "phoneNumber": "9876543210",
    "referralCode": "SidiXY12",       // Their unique referral code
    "totalReferrals": 5,              // Total people referred by this user
    "stats": {
      "totalRewardPoints": 150,       // Total points earned from referrals
      "walletPoints": 150,            // Current wallet balance in points
      "completedReferrals": 3,        // Referrals with completed rewards
      "pendingReferrals": 2,          // Referrals with pending rewards
      "totalReferrals": 5             // Total referral records
    },
    "referrals": [
      {
        "referredUserId": "user_2_id",
        "referredUsername": "jane_doe",
        "referredEmail": "jane@example.com",
        "referredPhone": "9876543211",
        "rewardPoints": 30,
        "rewardStatus": "completed",  // pending | completed | expired
        "usedDate": "2024-05-15T10:30:00Z",
        "createdAt": "2024-05-15T10:30:00Z"
      },
      {
        "referredUserId": "user_3_id",
        "referredUsername": "mike_smith",
        "referredEmail": "mike@example.com",
        "referredPhone": "9876543212",
        "rewardPoints": 30,
        "rewardStatus": "pending",
        "usedDate": "2024-05-16T14:20:00Z",
        "createdAt": "2024-05-16T14:20:00Z"
      }
    ]
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "User not found" | "Beautician not found" | "Invalid user role for referral system"
}
```

**HTTP Status Codes:**
- `200` - Success
- `404` - User/Beautician not found
- `400` - Invalid user role
- `500` - Server error

---

### 2. Get User's Referral Code
**Endpoint:** `GET /code`

**Description:** Returns only the user's referral code and referral count.

**Response:**
```json
{
  "success": true,
  "referralCode": "SidiXY12",
  "referralCount": 5
}
```

---

### 3. Get Referral Statistics
**Endpoint:** `GET /stats`

**Description:** Returns detailed referral statistics including all referred users.

**Query Parameters (Optional):**
- None required

**Response:**
```json
{
  "success": true,
  "stats": {
    "referralCode": "SidiXY12",
    "totalReferrals": 5,
    "totalRewardPoints": 150,
    "walletPoints": 150,
    "referrals": [
      {
        "referredUserId": "user_2_id",
        "referredUserName": "jane_doe",
        "referredUserEmail": "jane@example.com",
        "rewardPoints": 30,
        "rewardStatus": "completed",
        "usedDate": "2024-05-15T10:30:00Z"
      }
    ]
  }
}
```

---

### 4. Get Referral History (Paginated)
**Endpoint:** `GET /history`

**Description:** Returns paginated list of referrals.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page

**Example Request:**
```
GET /history?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "referrals": [
    {
      "referredUserId": "user_id",
      "referredUsername": "jane_doe",
      "referredEmail": "jane@example.com",
      "rewardPoints": 30,
      "rewardStatus": "completed",
      "usedDate": "2024-05-15T10:30:00Z"
    }
  ],
  "pagination": {
    "totalReferrals": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### 5. Validate Referral Code
**Endpoint:** `POST /validate`

**Description:** Validates if a referral code is valid and returns referrer information.

**Request Body:**
```json
{
  "code": "SidiXY12"
}
```

**Response (Valid Code):**
```json
{
  "success": true,
  "message": "Referral code is valid",
  "referrerName": "john_doe",
  "referrerEmail": "john@example.com"
}
```

**Response (Invalid Code):**
```json
{
  "success": false,
  "message": "Invalid referral code"
}
```

**Response (Own Code):**
```json
{
  "success": false,
  "message": "Cannot use your own referral code"
}
```

---

## Referral Code Format
- Format: `Sidi` + 4 alphanumeric characters
- Example: `SidiXY12`, `SidiAB34`, `SidiZ9K2`
- Unique for each user
- Case-sensitive

---

## Reward Status Values
- `pending` - Referral has been used but reward not yet processed
- `completed` - Reward has been successfully applied to wallet
- `expired` - Referral expired without completing

---

## Data Models

### User Referral Fields (Customer)
```javascript
{
  referralCode: String,        // Unique code for this user
  referredBy: ObjectId,        // Reference to user who referred them
  referralCount: Number        // Total successful referrals
}
```

### Beautician Referral Fields
```javascript
{
  referralCode: String,        // Unique code for this beautician
  referredBy: ObjectId,        // Reference to beautician who referred them
  referralCount: Number        // Total successful referrals
}
```

### Referral Record
```javascript
{
  referrerUser: ObjectId,      // User who referred
  referredUser: ObjectId,      // User who was referred
  referralCode: String,        // The code that was used
  rewardPoints: Number,        // Points earned from this referral
  rewardStatus: String,        // pending | completed | expired
  usedDate: Date,              // When the code was used
  expiryDate: Date             // When the reward expires
}
```

---

## Usage Examples

### Example 1: Get Complete Referral Details (Main Endpoint)
```bash
curl -X GET http://localhost:5000/api/mobileapp/referral/details \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Get Referral Code Only
```bash
curl -X GET http://localhost:5000/api/mobileapp/referral/code \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 3: Validate a Referral Code
```bash
curl -X POST http://localhost:5000/api/mobileapp/referral/validate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SidiXY12"
  }'
```

### Example 4: Get Paginated History
```bash
curl -X GET "http://localhost:5000/api/mobileapp/referral/history?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Key Features

✅ **Unified Endpoint**: Works for both Customers and Beauticians
✅ **Complete Data**: Returns referral code, stats, and referral list in one request
✅ **Pagination Support**: For referral history
✅ **Reward Tracking**: Shows reward points and status
✅ **User Information**: Includes referred user details
✅ **Wallet Integration**: Shows current wallet points

---

## Error Handling

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Invalid referral code | Code format incorrect or doesn't exist |
| 400 | Cannot use your own referral code | User trying to use their own code |
| 404 | User not found | User ID invalid or deleted |
| 404 | Beautician not found | Beautician record not found |
| 400 | Invalid user role for referral system | User role not Customer or Beautician |
| 500 | Server error | Backend exception |

---

## Authentication
All endpoints require valid JWT token. The token should be sent in the Authorization header as:
```
Authorization: Bearer {JWT_TOKEN}
```

The token is automatically validated by the `protect` middleware.

---

## Notes for App Developer

1. **Main Endpoint**: Use `/details` endpoint for complete referral information
2. **Token Required**: All requests must include valid JWT token
3. **Response Format**: Always check `success` field first
4. **Pagination**: Use page and limit parameters for history
5. **Referral Code Format**: Always `Sidi` + 4 characters
6. **Wallet Points**: Stored separately in Wallet collection
7. **User Types**: Response adapts based on user.role (Customer or Beautician)

---

## Support
For issues or questions, contact the backend team.
