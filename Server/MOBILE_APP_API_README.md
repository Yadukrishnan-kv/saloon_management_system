# Mobile App API README

## 1. Base URL
Production base URL:
- https://sidi.mobilegear.co.in

API root:
- https://sidi.mobilegear.co.in/api/mobileapp

Example:
- https://sidi.mobilegear.co.in/api/mobileapp/auth/customer/login

---

## 2. Authentication Flow

### Login APIs
- Customer: POST /api/mobileapp/auth/customer/login
- Beautician: POST /api/mobileapp/auth/beautician/login

### Token response format
Success login returns a JWT token in response body.

~~~json
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt_token>",
  "user": {
    "_id": "...",
    "username": "...",
    "email": "...",
    "role": "Customer"
  }
}
~~~

### Pass token
Use Authorization header for protected APIs:
~~~http
Authorization: Bearer <token>
~~~

### Expiry / refresh
- Token is JWT with server-configured expiry (default is 7d).
- On 401 Invalid or expired token, login again.

---

## 3. Booking Workflow

### New Booking Flow (Admin-Driven Assignment with Multiple Services)
This platform uses an admin-driven booking assignment workflow. Customers can now book MULTIPLE SERVICES in single appointment:

1. **Customer Creates Booking (Requested)**
   - Customer logs in, selects ONE OR MORE services, and books appointment
   - **MULTIPLE SERVICES supported** - customer can add Facial + Massage + other services
   - **NO beautician selection** - services are generic without assigned beautician
   - Booking shows total amount across all selected services
   - Booking status: `Requested` (waiting for admin)
   - Beautician field: `null`
   - Customer & Admin notified

2. **Admin Reviews & Assigns Beautician (Assigned)**
   - Admin views pending booking requests with all service details and total amount
   - Admin selects appropriate beautician to handle ALL services in booking
   - Booking status changes: `Requested` → `Assigned`
   - Beautician & Customer notified about assignment with complete service list
   - Travel fee calculated when beautician assigned

3. **Beautician Accepts/Rejects (Accepted/Rejected)**
   - Beautician receives notification of assigned booking with all services
   - Beautician can: Accept ALL services (`Accepted`) or Reject (`Rejected`)
   - If Rejected: Booking status → `Rejected` (admin can reassign to another beautician)
   - If Accepted: Beautician commits to providing ALL services in single appointment

4. **Booking Completion**
   - Beautician marks: On The Way → In Progress → Completed
   - Single appointment covers all services customer selected
   - Both customer & beautician notified at each stage
   - Payments processed for all services, commissions calculated

### Multiple Services Example
- Customer selects: Facial (₹999, 60 min) + Massage (₹1499, 90 min)
- Total: ₹2498 for 150 minutes
- Admin assigns beautician to handle BOTH services
- Beautician provides both services in single 150-min appointment
- No beautician selection by customer; admin decides based on availability

### Admin Booking Management Endpoints
See **Admin Booking Management APIs** section below for:
- GET `/bookings/pending` - View pending requests with all services and totals
- POST `/bookings/:bookingId/assign` - Assign beautician to ALL services in booking
- GET `/bookings/assigned` - View all assigned bookings & beautician responses

---

## 4. API Modules

Notes:
- Full URL format: https://sidi.mobilegear.co.in + Endpoint
- Protected = requires Authorization Bearer token
- For GET/DELETE endpoints, Request Body = N/A
- **MULTIPLE SERVICES**: Most booking APIs now support multiple services per booking

---

# ======================================================
# CUSTOMER APIs
# ======================================================

---

## Auth APIs - Customer (/api/mobileapp/auth)

### 1) Customer Register
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/auth/customer/register
- **Description:** Register customer and trigger OTP verification via email.
- **Headers:** Content-Type: application/json
- **Request Body:**
~~~json
{
  "name": "Asha",
  "email": "asha@example.com",
  "password": "Pass@123",
  "confirmPassword": "Pass@123"
}
~~~
- **Note:** Only email is required for OTP verification. OTP will be sent to the provided email address.
- **Response:**
~~~json
{
  "success": true,
  "message": "Registration successful. Please verify your account.",
  "userId": "6650...",
  "requiresOTP": true
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Email already in use"
}
~~~

---

### 2) Verify OTP
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/auth/customer/verify-otp
- **Description:** Verify OTP sent to email and return JWT token.
- **Headers:** Content-Type: application/json
- **Request Body:**
~~~json
{
  "userId": "6650...",
  "otp": "123456",
  "type": "email"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Verification successful",
  "token": "<jwt_token>",
  "user": {
    "_id": "6650...",
    "username": "Asha",
    "role": "Customer"
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
~~~

---

### 3) Customer Login
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/auth/customer/login
- **Description:** Login with email, username, or phone + password.
- **Headers:** Content-Type: application/json
- **Request Body (email):**
~~~json
{
  "email": "asha@example.com",
  "password": "Pass@123"
}
~~~
- **Request Body (username):**
~~~json
{
  "username": "Asha",
  "password": "Pass@123"
}
~~~
- **Request Body (phone):**
~~~json
{
  "phone": "9876543210",
  "password": "Pass@123"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt_token>",
  "user": {
    "_id": "6650...",
    "username": "Asha",
    "email": "asha@example.com",
    "role": "Customer"
  },
  "profileComplete": true
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Invalid credentials"
}
~~~

---

### 4) Customer Resend OTP
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/auth/customer/resend-otp
- **Headers:** Content-Type: application/json
- **Request Body:**
~~~json
{
  "userId": "6650..."
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "OTP sent to your email"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "userId is required"
}
~~~

---

### 5) Forgot Password
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/auth/forgot-password
- **Headers:** Content-Type: application/json
- **Request Body:**
~~~json
{
  "email": "asha@example.com"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Password reset OTP sent to your email",
  "userId": "6650..."
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "No account found with this credential"
}
~~~

---

### 6) Reset Password
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/auth/reset-password
- **Headers:** Content-Type: application/json
- **Request Body:**
~~~json
{
  "userId": "6650...",
  "otp": "123456",
  "newPassword": "NewPass@123",
  "confirmPassword": "NewPass@123"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
~~~

---

### 7) Logout
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/auth/logout
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Logged out successfully"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Invalid or expired token"
}
~~~

---

## User APIs - Customer (/api/mobileapp/user)

### 1) Get Profile
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/user/profile
- **Description:** Get current customer profile with stats and favorite stylists.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "user": {
    "_id": "...",
    "username": "Asha",
    "email": "asha@example.com",
    "phoneNumber": "9876543210",
    "profileImage": "https://sidi.mobilegear.co.in/uploads/1234567890-filename.jpg",
    "favoriteBeauticians": [
      {
        "_id": "...",
        "fullName": "Riya",
        "profileImage": "https://sidi.mobilegear.co.in/uploads/riya.jpg",
        "rating": 4.7,
        "tier": "Premium"
      }
    ]
  },
  "stats": {
    "totalBookings": 12,
    "totalReviews": 5,
    "memberSince": "2025-01-15T00:00:00.000Z",
    "tier": "Classic"
  }
}
~~~
- **Note:** profileImage will be a full URL if uploaded, or empty string if not set.

---

### 2) Update Profile
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/user/profile
- **Headers:** Authorization: Bearer <token>; Content-Type: multipart/form-data (with image) or application/json (text only)
- **Request Body (FormData with image):**
~~~
name: "Asha K"
email: "asha.k@example.com"
phone: "9876543210"
profileImage: <file object>
~~~
- **Request Body (JSON - text only):**
~~~json
{
  "name": "Asha K",
  "email": "asha.k@example.com",
  "phone": "9876543210"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "...",
    "username": "Asha K",
    "email": "asha.k@example.com",
    "phoneNumber": "9876543210",
    "profileImage": "https://sidi.mobilegear.co.in/uploads/1234567890-filename.jpg"
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Email already in use"
}
~~~

---

### 3) Change Password
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/user/change-password
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "currentPassword": "Old@123",
  "newPassword": "New@123",
  "confirmPassword": "New@123"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Password changed successfully"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Current password is incorrect"
}
~~~

---

### 4) Add Address
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/user/add-address
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "label": "Home",
  "address": "12 MG Road",
  "city": "Kochi",
  "pincode": "682001",
  "latitude": 9.9312,
  "longitude": 76.2673,
  "isDefault": true
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Address added successfully",
  "address": {
    "_id": "...",
    "label": "Home"
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Address and city are required"
}
~~~

---

### 5) Get Addresses
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/user/addresses
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "addresses": [
    {
      "_id": "...",
      "label": "Home",
      "city": "Kochi"
    }
  ]
}
~~~

---

### 6) Update Address
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/user/address/:id
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "label": "Office",
  "address": "Infopark",
  "city": "Kochi",
  "isDefault": false
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Address updated successfully"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Address not found"
}
~~~

---

### 7) Delete Address
- **Endpoint:** DELETE https://sidi.mobilegear.co.in/api/mobileapp/user/address/:id
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Address deleted successfully"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Address not found"
}
~~~

---

### 8) Booking History
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/user/booking-history
- **Headers:** Authorization: Bearer <token>
- **Query Params:** page, limit, status
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "bookings": [],
  "total": 12,
  "currentPage": 1,
  "totalPages": 2
}
~~~

---

### 9) Booking By ID
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/user/booking/:id
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "booking": {
    "_id": "...",
    "status": "Completed"
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Booking not found"
}
~~~

---

### 10) Get Favorite Stylists
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/user/favorites
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "favorites": [
    {
      "_id": "...",
      "fullName": "Riya",
      "profileImage": "/uploads/riya.jpg",
      "rating": 4.7,
      "totalReviews": 40,
      "tier": "Premium",
      "skills": ["Facial", "Hair Styling"],
      "experience": 5
    }
  ]
}
~~~

---

### 11) Add Favorite Stylist
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/user/favorites
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "beauticianId": "6651..."
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Added to favorites"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Already in favorites"
}
~~~

---

### 12) Remove Favorite Stylist
- **Endpoint:** DELETE https://sidi.mobilegear.co.in/api/mobileapp/user/favorites/:beauticianId
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Removed from favorites"
}
~~~

---

### 13) Get Favorite Services
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/user/favorite-services
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "favorites": [
    {
      "_id": "...",
      "name": "Facial",
      "price": 999,
      "duration": 60,
      "image1": "/uploads/facial1.jpg",
      "image2": "/uploads/facial2.jpg",
      "category": { "_id": "...", "name": "Skin" }
    }
  ]
}
~~~

---

### 14) Add Favorite Service
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/user/favorite-services
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "serviceId": "6652..."
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Added to favorites"
}
~~~

---

### 15) Remove Favorite Service
- **Endpoint:** DELETE https://sidi.mobilegear.co.in/api/mobileapp/user/favorite-services/:serviceId
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Removed from favorites"
}
~~~

---

### 16) Get All Favorites (Beauticians & Services)
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/user/favorites/all
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "favoriteBeauticians": [
    {
      "_id": "...",
      "fullName": "Riya",
      "profileImage": "/uploads/riya.jpg",
      "rating": 4.7,
      "tier": "Premium"
    }
  ],
  "favoriteServices": [
    {
      "_id": "...",
      "name": "Facial",
      "price": 999,
      "duration": 60,
      "image1": "/uploads/facial1.jpg",
      "image2": "/uploads/facial2.jpg",
      "category": { "_id": "...", "name": "Skin" }
    }
  ]
}
~~~

---

## Services APIs - Customer (/api/mobileapp/services)

### 1) Home Dashboard
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/services/home
- **Description:** Aggregate home screen data - banners, categories, popular services, offers.
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "dashboard": {
    "banners": [
      {
        "_id": "...",
        "title": "Summer Sale",
        "description": "Get 30% off on all services",
        "image": "https://sidi.mobilegear.co.in/uploads/banner.jpg",
        "isActive": true
      }
    ],
    "categories": [
      {
        "_id": "...",
        "name": "Hair",
        "image": "https://sidi.mobilegear.co.in/uploads/hair.jpg",
        "serviceCount": 8
      }
    ],
    "popularServices": [
      {
        "_id": "...",
        "name": "Facial",
        "price": 999,
        "image1": "https://sidi.mobilegear.co.in/uploads/facial1.jpg",
        "image2": "https://sidi.mobilegear.co.in/uploads/facial2.jpg",
        "category": { "_id": "...", "name": "Skin" }
      }
    ],
    "offers": [
      {
        "_id": "...",
        "name": "Deep Conditioning",
        "price": 1200,
        "discount": 20,
        "image1": "https://sidi.mobilegear.co.in/uploads/conditioning1.jpg"
      }
    ]
  }
}
~~~

---

### 2) Get Location from Coordinates
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/services/location?lat=<latitude>&lng=<longitude>
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "location": {
    "address": "123 Main St, City, State, Country",
    "city": "City",
    "state": "State",
    "country": "Country",
    "postalCode": "123456"
  }
}
~~~

---

### 3) Get All Categories
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/categories
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
[
  {
    "_id": "...",
    "name": "Hair",
    "image": "https://sidi.mobilegear.co.in/uploads/hair.jpg",
    "isActive": true,
    "sortOrder": 0
  }
]
~~~

---

### 4) Get All SubCategories
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/subcategories
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
[
  {
    "_id": "...",
    "name": "Hair Coloring",
    "category": { "_id": "...", "name": "Hair" },
    "isActive": true,
    "sortOrder": 0
  }
]
~~~

---

### 5) Search Services
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/services/search
- **Query Params:** query (required), location, date, time
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "services": [],
  "availableBeauticians": []
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Search query is required"
}
~~~

---

### 6) Popular Services
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/services/popular
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "popularServices": []
}
~~~

---

### 7) Offers
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/services/offers
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "activeOffers": {
    "discountedServices": [],
    "banners": []
  }
}
~~~

---

### 8) Get Service Addons
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/services/:serviceId/addons
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "addons": [
    {
      "_id": "...",
      "name": "Aromatherapy Oil",
      "description": "Premium essential oil treatment",
      "price": 250,
      "image": "https://sidi.mobilegear.co.in/uploads/aroma.jpg"
    },
    {
      "_id": "...",
      "name": "Deep Conditioning",
      "description": "Intensive hair conditioning",
      "price": 400,
      "image": "https://sidi.mobilegear.co.in/uploads/conditioning.jpg"
    }
  ]
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Service not found"
}
~~~

---

### 9) Get All Services
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/services
- **Query Params:** categoryId, search, minPrice, maxPrice, sortBy
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "services": [
    {
      "_id": "...",
      "name": "Facial",
      "price": 999,
      "duration": 60,
      "image1": "https://sidi.mobilegear.co.in/uploads/facial1.jpg",
      "image2": "https://sidi.mobilegear.co.in/uploads/facial2.jpg",
      "category": { "_id": "...", "name": "Skin" }
    }
  ],
  "total": 25
}
~~~

---

### 10) Get Service By ID
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/services/:serviceId
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "service": {
    "_id": "...",
    "name": "Facial",
    "description": "Professional facial treatment",
    "price": 999,
    "pricingType": "Fixed",
    "duration": 60,
    "image1": "https://sidi.mobilegear.co.in/uploads/facial1.jpg",
    "image2": "https://sidi.mobilegear.co.in/uploads/facial2.jpg",
    "discount": 10,
    "category": { "_id": "...", "name": "Skin" },
    "beauticians": [
      {
        "_id": "...",
        "fullName": "Riya",
        "profileImage": "https://sidi.mobilegear.co.in/uploads/riya.jpg",
        "rating": 4.7
      }
    ]
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Service not found"
}
~~~

---

### 11) Get All Curated Services
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/curated-services
- **Query Params:** categoryId (optional), search (optional)
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "curatedServices": [
    {
      "_id": "...",
      "curatedServiceName": "Bridal Package",
      "curatedServiceTitle": "Premium Bridal Look",
      "category": { "_id": "...", "name": "Makeup" },
      "subCategory": { "_id": "...", "name": "Bridal" },
      "price": 4999,
      "duration": 180,
      "discount": 10,
      "image1": "https://sidi.mobilegear.co.in/uploads/bridal1.jpg",
      "image2": "https://sidi.mobilegear.co.in/uploads/bridal2.jpg",
      "description": "Full bridal makeup and hair styling"
    }
  ],
  "total": 5
}
~~~

---

### 12) Get All Beauticians (Public)
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/all
- **Query Params:** page, limit, search, status
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "beauticians": [
    {
      "_id": "...",
      "fullName": "Riya",
      "profileImage": "/uploads/riya.jpg",
      "rating": 4.7,
      "tier": "Premium",
      "skills": ["Facial", "Hair Styling"],
      "experience": 5,
      "status": "Active",
      "isVerified": true,
      "services": [
        {
          "_id": "...",
          "name": "Facial",
          "price": 999,
          "duration": 60,
          "category": { "_id": "...", "name": "Skin" },
          "subCategory": { "_id": "...", "name": "Brightening" }
        }
      ],
      "curatedServices": [
        {
          "_id": "...",
          "curatedServiceName": "Bridal Package",
          "price": 4999,
          "category": { "_id": "...", "name": "Bridal" }
        }
      ]
    }
  ],
  "total": 1,
  "currentPage": 1,
  "totalPages": 1
}
~~~

---

### 13) Get Beautician's Services & Curated Services (Public)
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/:beauticianId/services
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "beauticianId": "6651...",
  "services": [
    {
      "_id": "...",
      "name": "Facial",
      "price": 999,
      "duration": 60,
      "category": { "_id": "...", "name": "Skin" },
      "subCategory": { "_id": "...", "name": "Brightening" },
      "beautician": {
        "_id": "...",
        "fullName": "Riya",
        "phoneNumber": "9123456789",
        "profileImage": "/uploads/riya.jpg",
        "rating": 4.7,
        "tier": "Premium"
      }
    }
  ],
  "curatedServices": [
    {
      "_id": "...",
      "curatedServiceName": "Bridal Glow Package",
      "price": 2999,
      "category": { "_id": "...", "name": "Bridal" },
      "beautician": { "_id": "...", "fullName": "Riya", "rating": 4.7 }
    }
  ]
}
~~~

---

## Booking APIs - Customer (/api/mobileapp/bookings)

### 1) Create Booking
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/bookings/create
- **Description:** Create booking request with MULTIPLE SERVICES. Customer selects date, time, and one or more services. Booking shows total amount. Goes to admin for beautician assignment. Bookings must be for next day or later, not after 11 PM.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "serviceIds": ["6652...", "6653...", "6654..."],
  "bookingDate": "2026-04-10",
  "bookingTime": "14:00",
  "locationType": "home",
  "address": {
    "address": "12 MG Road",
    "city": "Kochi",
    "pincode": "682001",
    "latitude": 9.9312,
    "longitude": 76.2673,
    "unit": "Apt 4B",
    "gateCode": "1234"
  },
  "notes": "Please be on time",
  "addonIds": ["6654...", "6655..."]
}
~~~
- **Note:** 
  - `serviceIds` is an ARRAY - supports multiple services
  - At least one service ID required
  - `addonIds`, `address.unit`, and `address.gateCode` are optional
  - Total amount = sum of all service prices + addons
  - **NO beautician selection** - Admin will assign
  
- **Response:**
~~~json
{
  "success": true,
  "message": "Booking request created. Admin will assign a beautician shortly.",
  "booking": {
    "_id": "...",
    "status": "Requested",
    "jobId": "A1B2C3-BK",
    "customer": "...",
    "beautician": null,
    "services": [
      {
        "_id": "...",
        "service": {
          "_id": "...",
          "name": "Facial",
          "price": 899,
          "duration": 60
        }
      },
      {
        "_id": "...",
        "service": {
          "_id": "...",
          "name": "Massage",
          "price": 1299,
          "duration": 90
        }
      }
    ],
    "addons": [...],
    "bookingDate": "2026-04-10T00:00:00.000Z",
    "timeSlot": { "startTime": "14:00", "endTime": "15:30" }
  },
  "totalServices": 2,
  "totalServicePrice": 2198,
  "totalDiscount": 100,
  "addonsAmount": 200,
  "estimatedTotalAmount": 2398,
  "estimatedDuration": 150
}
~~~

- **Workflow:**
  1. Customer selects multiple services, books for date/time
  2. Booking shows total amount for all services
  3. Status: `Requested` (awaiting admin)
  4. Admin views pending requests with all service details
  5. Admin assigns beautician for all selected services
  6. Status changes: `Requested` → `Assigned`
  7. Beautician accepts/rejects (status → `Accepted`/`Rejected`)
  8. If accepted, beautician provides ALL services in single appointment

- **Error Response:**
~~~json
{
  "success": false,
  "message": "Bookings are not accepted after 11:00 PM"
}
~~~
~~~json
{
  "success": false,
  "message": "At least one service is required"
}
~~~

---

### 2) My Bookings
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/bookings/my-bookings
- **Description:** Get all bookings with status filter. Shows MULTIPLE SERVICES per booking and admin assignment status.
- **Headers:** Authorization: Bearer <token>
- **Query Params:** page, limit, status (upcoming/completed/cancelled)
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "bookings": [
    {
      "_id": "...",
      "jobId": "A1B2C3-BK",
      "status": "Assigned",
      "beautician": {
        "_id": "...",
        "fullName": "Riya",
        "profileImage": "/uploads/riya.jpg",
        "rating": 4.7
      },
      "services": [
        {
          "_id": "...",
          "service": {
            "_id": "...",
            "name": "Facial",
            "price": 999,
            "duration": 60
          }
        },
        {
          "_id": "...",
          "service": {
            "_id": "...",
            "name": "Massage",
            "price": 1499,
            "duration": 90
          }
        }
      ],
      "bookingDate": "2026-05-15T00:00:00.000Z",
      "timeSlot": { "startTime": "10:00", "endTime": "12:30" },
      "totalAmount": 2498,
      "finalAmount": 2498,
      "createdAt": "2026-05-13T10:30:00.000Z"
    }
  ],
  "total": 8,
  "currentPage": 1
}
~~~
- **Note:** Services array contains MULTIPLE services. Total includes all services + addons.

---

### 3) Booking Details
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/bookings/:bookingId
- **Description:** Get full booking detail with ALL SERVICES, beautician info, and status history.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "booking": {
    "_id": "...",
    "jobId": "A1B2C3-BK",
    "status": "Assigned",
    "customer": { "_id": "...", "fullName": "Asha" },
    "beautician": {
      "_id": "...",
      "fullName": "Riya",
      "phoneNumber": "+919123456789",
      "profileImage": "/uploads/riya.jpg",
      "rating": 4.7
    },
    "services": [
      {
        "_id": "...",
        "service": { "_id": "...", "name": "Facial", "price": 999, "duration": 60 },
        "serviceName": "Facial",
        "price": 999,
        "duration": 60
      },
      {
        "_id": "...",
        "service": { "_id": "...", "name": "Massage", "price": 1499, "duration": 90 },
        "serviceName": "Massage",
        "price": 1499,
        "duration": 90
      }
    ],
    "addons": [ { "addonName": "Aromatherapy", "price": 200 } ],
    "bookingDate": "2026-05-15T00:00:00.000Z",
    "timeSlot": { "startTime": "10:00", "endTime": "12:30" },
    "address": { "street": "12 MG Road", "city": "Kochi", "pincode": "682001" },
    "totalAmount": 2498,
    "addonsAmount": 200,
    "travelFee": 50,
    "finalAmount": 2748,
    "timeline": [
      { "status": "Requested", "date": "2026-05-13T10:00:00.000Z", "message": "Booking requested" },
      { "status": "Assigned", "date": "2026-05-13T10:05:00.000Z", "message": "Admin assigned beautician" }
    ],
    "createdAt": "2026-05-13T10:00:00.000Z"
  }
}
~~~
- **Note:** Shows all services in booking, beautician assigned by admin, and complete status history.
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Booking not found"
}
~~~
- **Booking Status Flow:** Requested (customer creates) → Assigned (admin assigns beautician) → Accepted (beautician accepts) → OnTheWay → InProgress → Completed

---

### 4) Cancel Booking
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/bookings/:bookingId/cancel
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "reason": "Plan changed"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "refundAmount": 699
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Cannot cancel a booking that is InProgress"
}
~~~

---

### 5) Reschedule Booking
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/bookings/:bookingId/reschedule
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "newDate": "2026-04-12",
  "newTime": "11:00"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Booking rescheduled successfully",
  "booking": { "_id": "..." }
}
~~~

---

### 6) Available Slots
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/bookings/available-slots
- **Description:** Get available time slots for booking. Slots calculated based on beautician availability and TOTAL service duration(s).
- **Query Params:** serviceIds (required - array of service IDs for MULTIPLE SERVICES), date (required), beauticianId (optional - used during admin assignment)
- **Headers:** N/A
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "availableSlots": ["09:00", "10:00", "11:00", "14:00", "15:00"],
  "totalDuration": 150,
  "message": "Slots calculated for multiple services: Facial (60 min) + Massage (90 min) = 150 total minutes"
}
~~~
- **Note:** 
  - `serviceIds` is an ARRAY for multiple services
  - `totalDuration` = sum of all service durations
  - Slots filtered based on beautician availability and service duration
  - Each slot represents start time; end time = start time + totalDuration

---

### 7) Customer Complete Booking
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/bookings/:bookingId/complete
- **Description:** Customer confirms service completion.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Booking marked as completed"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Booking not found or not in progress"
}
~~~

---

## Reviews APIs - Customer (/api/mobileapp/reviews)

### 1) Create Beautician Review
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/reviews/beautician
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "beauticianId": "6653...",
  "rating": 5,
  "reviewText": "Great service"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Review submitted successfully.",
  "review": {
    "_id": "...",
    "beauticianId": "...",
    "customerId": "...",
    "rating": 5,
    "reviewText": "Great service"
  }
}
~~~

---

### 2) Rate a Service
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/reviews/service
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "serviceId": "6653...",
  "rating": 4
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Service rated successfully."
}
~~~

---

### 3) Rate a Curated Service
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/reviews/curated-service
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "curatedServiceId": "6653...",
  "rating": 5
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Curated service rated successfully."
}
~~~

---

### 4) Get Beautician Reviews (Public)
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/reviews/beautician/:beauticianId
- **Query Params:** page, limit, sortBy
- **Headers:** N/A
- **Response:**
~~~json
{
  "success": true,
  "reviews": [
    { "_id": "...", "customerId": "...", "rating": 5, "reviewText": "Great service" }
  ],
  "averageRating": 4.6,
  "totalReviews": 40,
  "ratingDistribution": { "1": 1, "2": 2, "3": 4, "4": 10, "5": 23 }
}
~~~

---

### 5) Get Service Ratings (Public)
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/reviews/service/:serviceId
- **Query Params:** page, limit
- **Headers:** N/A
- **Response:**
~~~json
{
  "success": true,
  "reviews": [],
  "averageRating": 4.3,
  "totalReviews": 18
}
~~~

---

### 6) Get Curated Service Ratings (Public)
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/reviews/curated-service/:curatedServiceId
- **Headers:** N/A
- **Response:**
~~~json
{
  "success": true,
  "ratings": [
    { "_id": "...", "customerId": "...", "rating": 5 }
  ],
  "averageRating": 4.8,
  "totalRatings": 12
}
~~~

---

### 7) My Reviews
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/reviews/my-reviews
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "reviews": []
}
~~~

---

### 8) Update Review
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/reviews/:reviewId
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "rating": 4,
  "reviewText": "Updated review"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Review updated successfully",
  "review": { "_id": "...", "adminApproval": "Pending" }
}
~~~

---

### 9) Delete Review
- **Endpoint:** DELETE https://sidi.mobilegear.co.in/api/mobileapp/reviews/:reviewId
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Review deleted successfully"
}
~~~

---

## Payment APIs - Customer (/api/mobileapp/payment)

### 1) Get Wallet
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/payment/wallet
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "wallet": {
    "balance": 1500,
    "points": 35,
    "currency": "INR"
  }
}
~~~

---

### 2) Add Wallet Money
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/payment/wallet/add
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "amount": 500,
  "paymentMethod": "UPI"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Amount added to wallet",
  "transactionId": "TXN_ABC123",
  "paymentUrl": null
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Valid amount is required"
}
~~~

---

### 3) Use Points
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/payment/wallet/use-points
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "points": 100
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Points redeemed successfully",
  "discountAmount": 100,
  "remainingPoints": 20
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Insufficient points"
}
~~~

---

### 4) Transactions
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/payment/transactions
- **Query Params:** page, limit, type, period (weekly|monthly)
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "transactions": [],
  "total": 14
}
~~~

---

### 5) Pay Booking
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/payment/booking/:bookingId/pay
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "paymentMethod": "wallet",
  "walletAmount": 500
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Payment successful",
  "transactionId": "PAY_ABC123",
  "receipt": {
    "bookingId": "...",
    "amount": 1200,
    "status": "Paid",
    "pointsEarned": 12
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Insufficient wallet balance"
}
~~~

---

### 6) Booking Receipt
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/payment/booking/:bookingId/receipt
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "receipt": {
    "bookingId": "...",
    "totalAmount": 1400,
    "finalAmount": 1200,
    "paymentMethod": "wallet",
    "status": "Paid"
  }
}
~~~

---

## Notification APIs - Customer (/api/mobileapp/notifications)

### 1) Get Notifications
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/notifications
- **Query Params:** page, limit, type
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "notifications": [],
  "unreadCount": 5
}
~~~

---

### 2) Mark Notification Read
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/notifications/:notificationId/read
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Notification marked as read"
}
~~~

---

### 3) Mark All Read
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/notifications/read-all
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "All notifications marked as read"
}
~~~

---

### 4) Register Device
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/notifications/register-device
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "deviceToken": "fcm_token_here",
  "deviceType": "android"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Device registered for notifications"
}
~~~

---

### 5) Unregister Device
- **Endpoint:** DELETE https://sidi.mobilegear.co.in/api/mobileapp/notifications/unregister-device
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Device unregistered from notifications"
}
~~~

---

### 6) Get Notification Settings
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/notifications/settings
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "settings": {
    "bookingUpdates": true,
    "promotional": true,
    "reminders": true
  }
}
~~~

---

### 7) Update Notification Settings
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/notifications/settings
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "bookingUpdates": true,
  "promotional": false,
  "reminders": true
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Notification settings updated"
}
~~~

---

## Complaint APIs - Customer (/api/mobileapp/complaints)

### 1) Create Complaint
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/complaints/create
- **Description:** Submit a complaint. Notifies admin.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "subject": "Late arrival",
  "description": "The beautician arrived 30 minutes late for my booking.",
  "category": "Service",
  "bookingId": "6653..."
}
~~~
- **Note:** `category` defaults to "Other" if omitted. `bookingId` is optional.
- **Response:**
~~~json
{
  "success": true,
  "message": "Complaint submitted successfully",
  "complaint": {
    "_id": "...",
    "subject": "Late arrival",
    "status": "Open",
    "category": "Service",
    "createdAt": "2026-04-08T..."
  }
}
~~~

---

### 2) Get My Complaints
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/complaints/my-complaints
- **Query Params:** status, page, limit
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "complaints": [
    {
      "_id": "...",
      "subject": "Late arrival",
      "status": "Open",
      "category": "Service",
      "booking": { "bookingDate": "2026-04-05T...", "status": "Completed" },
      "createdAt": "2026-04-08T..."
    }
  ],
  "total": 3,
  "currentPage": 1,
  "totalPages": 1
}
~~~

---

### 3) Get Complaint By ID
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/complaints/:complaintId
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "complaint": {
    "_id": "...",
    "subject": "Late arrival",
    "description": "The beautician arrived 30 minutes late for my booking.",
    "status": "Open",
    "category": "Service",
    "booking": { "bookingDate": "2026-04-05T...", "status": "Completed", "beautician": "..." },
    "createdAt": "2026-04-08T..."
  }
}
~~~

---

## Location APIs (/api/mobileapp/location)

### 1) Nearby Beauticians
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/location/beauticians-nearby
- **Query Params:** latitude (required), longitude (required), serviceId (optional), radius (optional)
- **Headers:** N/A
- **Response:**
~~~json
{
  "success": true,
  "beauticians": [
    { "_id": "...", "name": "Riya", "distance": 2.4, "rating": 4.7 }
  ]
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Latitude and longitude are required"
}
~~~

---

### 2) Service Availability
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/location/service-availability
- **Query Params:** latitude (required), longitude (required), serviceId (required), date (optional), time (optional)
- **Headers:** N/A
- **Response:**
~~~json
{
  "success": true,
  "available": true,
  "nearestBeautician": { "_id": "...", "name": "Riya", "distance": 1.9, "rating": 4.8 },
  "estimatedArrival": "14 minutes"
}
~~~

---

### 3) Calculate Distance
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/location/calculate-distance
- **Headers:** Content-Type: application/json
- **Request Body:**
~~~json
{
  "origin": { "lat": 9.9312, "lng": 76.2673 },
  "destination": { "lat": 9.9500, "lng": 76.3000 }
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "distance": 4.2,
  "duration": "12 minutes",
  "estimatedCost": 42
}
~~~

---

### 4) Service Areas
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/location/areas
- **Headers:** N/A
- **Response:**
~~~json
{
  "success": true,
  "areas": [
    { "name": "Kochi", "pincode": "682001", "serviceAvailable": true }
  ]
}
~~~

---

## Unified Search API

### Search by Name (Service / Curated Service / Beautician)
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/search/all?query=Facial
- **Description:** Search for an exact match (case-insensitive) in order: Service -> Curated Service -> Beautician. Only the first matching type is returned.
- **Headers:** N/A
- **Request Body:** N/A

**If a Service is found:**
~~~json
{
  "success": true,
  "type": "service",
  "service": {
    "_id": "...",
    "name": "Facial",
    "description": "Professional facial treatment",
    "price": 999,
    "duration": 60,
    "image1": "/uploads/facial1.jpg",
    "image2": "/uploads/facial2.jpg",
    "category": { "_id": "...", "name": "Skin" },
    "subCategory": { "_id": "...", "name": "Brightening" },
    "beautician": { "_id": "...", "fullName": "Riya" }
  }
}
~~~

**If a Curated Service is found:**
~~~json
{
  "success": true,
  "type": "curatedService",
  "curatedService": {
    "_id": "...",
    "curatedServiceName": "Bridal Glow Package",
    "curatedServiceTitle": "Bridal Glow",
    "description": "Special package for brides",
    "price": 2999,
    "duration": 180,
    "category": { "_id": "...", "name": "Bridal" },
    "subCategory": { "_id": "...", "name": "Glow" },
    "beautician": { "_id": "...", "fullName": "Riya", "phoneNumber": "9123456789", "profileImage": "/uploads/riya.jpg", "rating": 4.7, "tier": "Premium" }
  }
}
~~~

**If a Beautician is found:**
~~~json
{
  "success": true,
  "type": "beautician",
  "beautician": {
    "_id": "...",
    "fullName": "Riya",
    "phoneNumber": "9123456789",
    "profileImage": "/uploads/riya.jpg",
    "bio": "Certified beautician with 3 years experience",
    "professionalTitle": "Senior Beautician",
    "skills": ["Facial", "Hair"],
    "experience": 3,
    "tier": "Premium",
    "user": { "_id": "...", "username": "riya", "email": "riya@example.com" }
  }
}
~~~

**If nothing is found:**
~~~json
{
  "success": false,
  "message": "No result found for the given name"
}
~~~

---

# ======================================================
# BEAUTICIAN APIs
# ======================================================

---

## Auth APIs - Beautician (/api/mobileapp/auth)

### 1) Beautician Register
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/auth/beautician/register
- **Description:** Register beautician account (creates both User and Beautician, links them; pending admin verification). OTP sent to email. Profile image is NOT required at registration.
- **Headers:** Content-Type: multipart/form-data
- **Request Body (form-data):**
~~~
name: Riya
email: riya@example.com
password: Pass@123
phoneNumber: 9123456789
skills: Facial
skills: Hair
experience: 3
bio: Certified beautician with 3 years experience
qualifications: Diploma in Beauty Therapy
location[address]: 123 Main St
location[city]: Mumbai
location[state]: MH
location[pincode]: 400001
professionalTitle: Senior Beautician
documentType: Qualification
documents: <file1.pdf>
documents: <file2.jpg>
~~~
- **Required fields:** name, email, password, phoneNumber, skills, experience
- **Optional fields:** bio, qualifications, location[address/city/state/pincode], professionalTitle, documents, documentType
- **Response:**
~~~json
{
  "success": true,
  "message": "Registration successful. Your account is pending admin verification.",
  "beauticianId": "6651...",
  "requiresVerification": true,
  "pccUploaded": false,
  "walletBalance": 1000
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Email already in use"
}
~~~

---

### 2) Beautician Login
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/auth/beautician/login
- **Description:** Login with email or phoneNumber and password.
- **Headers:** Content-Type: application/json
- **Request Body (email):**
~~~json
{
  "email": "riya@example.com",
  "password": "Pass@123"
}
~~~
- **Request Body (phone):**
~~~json
{
  "phoneNumber": "9123456789",
  "password": "Pass@123"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt_token>",
  "beautician": {
    "_id": "6651...",
    "username": "Riya",
    "role": "Beautician",
    "beauticianProfile": {
      "_id": "...",
      "verificationStatus": "Pending"
    }
  },
  "verificationStatus": "Pending"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Account is deactivated. Contact support."
}
~~~

---

### 3) Beautician Upload Documents (Auth)
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/auth/beautician/upload-documents
- **Description:** Upload verification documents after registration.
- **Headers:** Authorization: Bearer <token>; Content-Type: multipart/form-data
- **Request Body (form-data):**
~~~
documents: <file1> (max 5 files)
documents: <file2>
documentType: certificate
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Documents uploaded successfully"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "No files uploaded"
}
~~~

---

## Beautician Profile APIs (/api/mobileapp/beautician)

### 1) Get Profile
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/profile
- **Description:** Get full beautician profile including all fields, services, curated services, verification steps, documents, portfolio, and payment methods.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "beautician": {
    "user": {
      "_id": "...",
      "username": "Riya",
      "email": "riya@example.com",
      "phoneNumber": "9123456789",
      "profileImage": "/uploads/riya.jpg",
      "tier": "Premium"
    },
    "fullName": "Riya",
    "phoneNumber": "9123456789",
    "profileImage": "/uploads/riya.jpg",
    "professionalTitle": "Senior Hair Stylist",
    "bio": "Certified beautician with 3 years experience",
    "skills": ["Facial", "Hair", "Makeup"],
    "experience": 3,
    "tier": "Premium",
    "rating": 4.7,
    "totalReviews": 40,
    "isAcceptingBookings": true,
    "status": "Active",
    "verificationStatus": "Approved",
    "isVerified": true,
    "qualifications": "Diploma in Beauty Therapy",
    "commissionPerBooking": 200,
    "pccDocument": {
      "documentUrl": "/uploads/pcc.pdf",
      "isVerified": true,
      "uploadedAt": "2026-01-05T...",
      "verifiedAt": "2026-01-10T..."
    },
    "verificationSteps": {
      "identityVerified": { "status": "completed", "verifiedAt": "2026-01-10T..." },
      "portfolioReview": { "status": "completed", "reviewedAt": "2026-01-12T..." },
      "finalApproval": { "status": "completed", "approvedAt": "2026-01-15T...", "approvedBy": "..." }
    },
    "location": {
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "MH",
      "pincode": "400001",
      "coordinates": { "lat": 19.076, "lng": 72.877 }
    },
    "availability": [
      { "day": "Monday", "startTime": "09:00", "endTime": "18:00", "isAvailable": true },
      { "day": "Tuesday", "startTime": "09:00", "endTime": "18:00", "isAvailable": true }
    ],
    "documents": [
      {
        "_id": "...",
        "documentType": "certificate",
        "documentName": "Cosmetology Diploma",
        "documentUrl": "/uploads/diploma.pdf",
        "isVerified": true,
        "verifiedAt": "2026-01-12T...",
        "uploadedAt": "2026-01-05T..."
      }
    ],
    "portfolio": [
      { "imageUrl": "/uploads/portfolio1.jpg", "description": "Bridal makeup" }
    ],
    "earnings": {
      "totalEarnings": 25000,
      "pendingPayout": 6000,
      "totalCommissionPaid": 2400,
      "lastPaidAt": "2026-04-01T...",
      "nextPayoutDate": "2026-04-09T..."
    },
    "paymentMethods": [
      {
        "_id": "...",
        "type": "bank_account",
        "label": "HDFC Bank",
        "details": {
          "accountNumber": "****1234",
          "ifscCode": "HDFC0001234",
          "bankName": "HDFC",
          "accountHolderName": "Riya P"
        },
        "isDefault": true
      }
    ],
    "services": [
      {
        "_id": "...",
        "name": "Facial",
        "price": 999,
        "duration": 60,
        "category": { "_id": "...", "name": "Skin" },
        "subCategory": { "_id": "...", "name": "Brightening" }
      }
    ],
    "curatedServices": [
      {
        "_id": "...",
        "curatedServiceName": "Bridal Glow Package",
        "price": 2999,
        "category": { "_id": "...", "name": "Bridal" },
        "subCategory": { "_id": "...", "name": "Glow" }
      }
    ]
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

---

### 2) Update Profile
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/beautician/profile
- **Headers:** Authorization: Bearer <token>; Content-Type: multipart/form-data or application/json
- **Request Body (JSON):**
~~~json
{
  "name": "Riya P",
  "experience": 4,
  "skills": ["Facial", "Makeup"],
  "bio": "Certified stylist",
  "professionalTitle": "Senior Hair Stylist",
  "location": {
    "address": "Infopark, Kochi",
    "city": "Kochi",
    "state": "Kerala",
    "pincode": "682030",
    "coordinates": { "lat": 9.9312, "lng": 76.2673 }
  }
}
~~~
- **Multipart field (if uploading image):** profileImage: <file>
- **Response:**
~~~json
{
  "success": true,
  "message": "Profile updated successfully",
  "beautician": {
    "_id": "...",
    "fullName": "Riya P",
    "phoneNumber": "9123456789",
    "professionalTitle": "Senior Hair Stylist",
    "skills": ["Facial", "Makeup"],
    "experience": 4,
    "bio": "Certified stylist",
    "profileImage": "/uploads/riya.jpg",
    "tier": "Premium",
    "rating": 4.7,
    "status": "Active",
    "isVerified": true,
    "verificationStatus": "Approved",
    "location": {
      "address": "Infopark, Kochi",
      "city": "Kochi",
      "state": "Kerala",
      "pincode": "682030",
      "coordinates": { "lat": 9.9312, "lng": 76.2673 }
    }
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

---

### 3) Upload Profile Image
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/beautician/profile/upload-image
- **Headers:** Authorization: Bearer <token>; Content-Type: multipart/form-data
- **Request Body (form-data):**
~~~
profileImage: <file>
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "profileImage": "/uploads/1712345678901.jpg"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "No image file provided"
}
~~~

---

### 4) Get Verification Status
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/verification-status
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "verificationStatus": "Pending",
  "steps": {
    "identityVerified": { "status": "completed", "verifiedAt": "2026-01-10T..." },
    "portfolioReview": { "status": "in_progress" },
    "finalApproval": { "status": "pending" }
  },
  "isProfileLive": false,
  "estimatedReviewTime": "24-48 hours"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

---

### 5) Toggle Accepting Bookings
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/beautician/toggle-accepting
- **Description:** Toggle online/offline status.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "isAccepting": true
}
~~~
- **Note:** If `isAccepting` is omitted, it toggles the current value.
- **Response:**
~~~json
{
  "success": true,
  "message": "Now accepting bookings",
  "isAcceptingBookings": true
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

---

### 6) Get Work Eligibility
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/work-eligibility
- **Description:** Check if wallet balance >= Rs.50 minimum required to accept bookings.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response (eligible):**
~~~json
{
  "success": true,
  "walletBalance": 1500,
  "minimumRequired": 50,
  "isEligibleForWork": true,
  "currency": "INR",
  "message": "Eligible for work"
}
~~~
- **Response (not eligible):**
~~~json
{
  "success": true,
  "walletBalance": 30,
  "minimumRequired": 50,
  "isEligibleForWork": false,
  "currency": "INR",
  "message": "Maintain a minimum balance of $50 to continue receiving bookings."
}
~~~

---

## Beautician Availability APIs (/api/mobileapp/beautician)

### 1) Get Availability
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/availability
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "availability": {
    "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "workingHours": { "start": "09:00", "end": "18:00" },
    "breakTime": { "start": "13:00", "end": "14:00" },
    "timeSlots": ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"],
    "unavailableDates": [
      { "_id": "...", "date": "2026-04-20T...", "reason": "Leave", "isRecurring": false }
    ]
  }
}
~~~

---

### 2) Update Availability
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/beautician/availability
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "workingDays": ["Monday", "Tuesday", "Wednesday"],
  "workingHours": { "start": "10:00", "end": "19:00" },
  "breakTime": { "start": "13:00", "end": "14:00" }
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Availability updated successfully"
}
~~~

---

### 3) Add Unavailable Date
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/beautician/availability/add-unavailable
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "date": "2026-04-20",
  "reason": "Leave",
  "isRecurring": false
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Unavailable date added"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Date is required"
}
~~~

---

### 4) Remove Unavailable Date
- **Endpoint:** DELETE https://sidi.mobilegear.co.in/api/mobileapp/beautician/availability/unavailable/:id
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Unavailable date removed"
}
~~~

---

### 5) Toggle Slot Availability
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/beautician/availability/toggle-slot
- **Description:** Block or unblock a specific time slot on a specific date.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "date": "2026-04-10",
  "time": "14:00",
  "isAvailable": false
}
~~~
- **Note:** `isAvailable: false` blocks the slot; `isAvailable: true` unblocks it.
- **Response:**
~~~json
{
  "success": true,
  "message": "Slot blocked successfully"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Date and time are required"
}
~~~

---

## Beautician Booking APIs (/api/mobileapp/bookings)

### 1) Today Bookings
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/today
- **Description:** Today's non-cancelled bookings. Shows MULTIPLE SERVICES per booking with aggregated totals.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "bookings": [
    {
      "_id": "...",
      "jobId": "A1B2C3-BK",
      "status": "Accepted",
      "bookingDate": "2026-04-10T...",
      "timeSlot": { "startTime": "10:00", "endTime": "12:30" },
      "customer": { "_id": "...", "username": "Asha", "profileImage": "...", "tier": "Classic" },
      "services": [
        { "service": { "name": "Facial", "price": 999 }, "duration": 60 },
        { "service": { "name": "Massage", "price": 1499 }, "duration": 90 }
      ],
      "address": { "address": "12 MG Road", "city": "Kochi" },
      "totalAmount": 2498,
      "travelFee": 50,
      "finalAmount": 2548
    }
  ]
}
~~~
- **Note:** Services array contains all services in booking. Duration = sum of all service durations.
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~


---

### 2) Assigned Bookings (Awaiting Response)
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/assigned
- **Description:** Bookings assigned by admin awaiting beautician acceptance/rejection. Shows MULTIPLE SERVICES per booking.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "bookings": [
    {
      "_id": "...",
      "jobId": "B5C6D7-BK",
      "status": "Assigned",
      "bookingDate": "2026-04-11T...",
      "timeSlot": { "startTime": "14:00", "endTime": "16:00" },
      "customer": { "_id": "...", "username": "Priya", "tier": "Classic", "profileImage": "..." },
      "services": [
        { "service": { "name": "Hair Styling", "price": 799 }, "duration": 60 },
        { "service": { "name": "Hair Color", "price": 1199 }, "duration": 60 }
      ],
      "address": { "city": "Kochi", "pincode": "682001" },
      "totalAmount": 1998,
      "travelFee": 30,
      "finalAmount": 2028
    }
  ]
}
~~~
- **Note:** Status "Assigned" means admin assigned you to this booking. Use Accept/Decline endpoints to respond.

---

### 3) Upcoming Bookings
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/upcoming
- **Description:** Accepted bookings scheduled for future (status = Accepted). Shows MULTIPLE SERVICES per booking.
- **Query Params:** page, limit
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "bookings": [
    {
      "_id": "...",
      "jobId": "A1B2C3-BK",
      "status": "Accepted",
      "bookingDate": "2026-04-12T...",
      "timeSlot": { "startTime": "11:00", "endTime": "13:30" },
      "customer": { "username": "Asha", "phoneNumber": "9876543210" },
      "services": [
        { "service": { "name": "Facial", "price": 999 }, "duration": 60 },
        { "service": { "name": "Massage", "price": 1499 }, "duration": 90 }
      ],
      "totalAmount": 2498,
      "finalAmount": 2548
    }
  ],
  "total": 5
}
~~~
- **Note:** All services in booking must be completed in single appointment.

---

### 4) Booking History
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/history
- **Description:** Completed/cancelled bookings history. Shows MULTIPLE SERVICES per booking and earnings breakdown.
- **Query Params:** page, limit, month, year
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "bookings": [
    {
      "_id": "...",
      "jobId": "A1B2C3-BK",
      "status": "Completed",
      "bookingDate": "2026-04-05T...",
      "completedAt": "2026-04-05T...",
      "services": [
        { "service": { "name": "Facial" }, "price": 999 },
        { "service": { "name": "Massage" }, "price": 1499 }
      ],
      "addons": [ { "addonName": "Aromatherapy", "price": 200 } ],
      "totalAmount": 2698,
      "finalAmount": 2848,
      "beauticianPayout": 2548,
      "platformCommission": 300
    }
  ],
  "total": 20,
  "totalEarnings": 35000
}
~~~
- **Note:** Earnings from multiple services aggregated. Commission is ₹300 for entire booking.

---

### 5) Beautician Booking Detail
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId
- **Description:** Full booking detail with customer contact info, MULTIPLE SERVICES, add-ons, and biometric status.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "booking": {
    "_id": "...",
    "jobId": "A1B2C3-BK",
    "status": "Assigned",
    "bookingDate": "2026-04-10T...",
    "timeSlot": { "startTime": "14:00", "endTime": "16:00" },
    "services": [
      {
        "service": { "_id": "...", "name": "Facial", "price": 999 },
        "serviceName": "Facial",
        "price": 999,
        "duration": 60
      },
      {
        "service": { "_id": "...", "name": "Massage", "price": 1499 },
        "serviceName": "Massage",
        "price": 1499,
        "duration": 60
      }
    ],
    "addons": [
      { "addonName": "Aromatherapy Oil", "price": 250 }
    ],
    "address": {
      "street": "12 MG Road",
      "unit": "Apt 4B",
      "gateCode": "1234",
      "city": "Kochi",
      "pincode": "682001",
      "latitude": 9.9312,
      "longitude": 76.2673
    },
    "notes": "Please be on time",
    "locationType": "home",
    "preferredGender": "Female",
    "totalAmount": 2498,
    "discountAmount": 0,
    "addonsAmount": 250,
    "travelFee": 50,
    "finalAmount": 2798,
    "paymentStatus": "Pending",
    "biometricVerification": {
      "startVerified": false,
      "completeVerified": false
    },
    "timeline": [
      { "status": "Requested", "date": "2026-04-08T10:00:00.000Z", "message": "Booking requested" },
      { "status": "Assigned", "date": "2026-04-08T10:05:00.000Z", "message": "Admin assigned you" }
    ],
    "createdAt": "2026-04-08T10:00:00.000Z"
  },
  "customerContact": {
    "name": "Asha",
    "phone": "9876543210",
    "email": "asha@example.com",
    "tier": "Classic",
    "profileImage": "/uploads/asha.jpg"
  }
}
~~~
- **Note:** Total = sum of all services + addons. Beautician assigned by admin. Status "Assigned" means you need to accept/decline.
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Booking not found"
}
~~~
- **Status Flow:** Requested (customer creates) → Assigned (admin assigns you) → Accepted (you accept) → OnTheWay → InProgress → Completed

---

### 6) Accept Booking (Assigned by Admin)
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId/accept
- **Description:** Accept booking assigned by admin. Booking status changes from "Assigned" to "Accepted". ALL SERVICES in booking are confirmed.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Booking accepted successfully",
  "booking": {
    "_id": "...",
    "jobId": "A1B2C3-BK",
    "status": "Accepted",
    "services": [ { "serviceName": "Facial" }, { "serviceName": "Massage" } ],
    "totalAmount": 2498
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Only Assigned bookings can be accepted"
}
~~~
- **Note:** Accepting means you commit to ALL services in the booking.

---

### 7) Decline Booking (Assigned by Admin)
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId/decline
- **Description:** Reject booking assigned by admin. Booking status changes from "Assigned" to "Rejected". Admin can reassign to another beautician.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "reason": "Unavailable at that time"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Booking declined"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Booking not found or already processed"
}
~~~

---

### 8) On The Way
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId/on-the-way
- **Description:** Mark booking as en route. Notifies customer.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Status updated to on the way"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Booking not found or not accepted"
}
~~~

---

### 9) Start Booking
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId/start
- **Description:** Mark booking in progress. Accepts bookings in Accepted or OnTheWay status.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "biometricToken": "face_verify_token_abc",
  "professionalNotes": "Client has sensitive skin"
}
~~~
- **Note:** Both fields are optional.
- **Response:**
~~~json
{
  "success": true,
  "message": "Booking marked as in-progress",
  "biometricVerified": true
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Booking not found or not accepted"
}
~~~

---

### 10) Complete Booking
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId/complete
- **Description:** Complete service and trigger payout.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "notes": "Service completed",
  "biometricToken": "face_verify_token_xyz"
}
~~~
- **Note:** `biometricToken` is optional.
- **Response:**
~~~json
{
  "success": true,
  "message": "Booking completed",
  "jobId": "A1B2C3-BK",
  "paymentAmount": 1200,
  "platformCommission": 200,
  "beauticianPayout": 1000,
  "payoutDate": "2026-04-12T00:00:00.000Z",
  "biometricVerified": true
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Booking not found or not in progress"
}
~~~

---

## Beautician Dashboard & Stats APIs (/api/mobileapp/beautician)

### 1) Home Dashboard
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/home
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "dashboard": {
    "beautician": {
      "fullName": "Riya",
      "profileImage": "/uploads/riya.jpg",
      "isAcceptingBookings": true,
      "verificationStatus": "Approved",
      "status": "Active",
      "tier": "Premium",
      "location": {
        "address": "123 Main St",
        "city": "Mumbai",
        "coordinates": { "lat": 19.076, "lng": 72.877 }
      }
    },
    "upcomingBooking": {
      "_id": "...",
      "jobId": "A1B2C3-BK",
      "bookingDate": "2026-04-08T...",
      "status": "Accepted",
      "timeSlot": { "startTime": "10:00", "endTime": "11:00" },
      "customer": { "username": "Asha", "profileImage": "...", "tier": "Classic" },
      "services": [{ "service": { "name": "Facial", "price": 999 } }]
    },
    "weeklyEarnings": {
      "revenue": 7000,
      "servicesCompleted": 5
    },
    "isEligibleForWork": true,
    "walletBalance": 1500
  }
}
~~~

---

### 2) Dashboard Stats
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/dashboard-stats
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "stats": {
    "todayBookings": 3,
    "upcomingBookings": 4,
    "completedToday": 2,
    "earnings": {
      "today": 1200,
      "week": 7000,
      "month": 23000
    },
    "rating": 4.7
  }
}
~~~

---

### 3) Earnings
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/earnings
- **Query Params:** startDate, endDate
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "earnings": [
    {
      "bookingId": "...",
      "amount": 1200,
      "date": "2026-04-05T...",
      "services": ["Facial"]
    }
  ],
  "total": 12500,
  "breakdown": {
    "serviceCharges": 12500,
    "tips": 0,
    "bonuses": 0
  }
}
~~~

---

### 4) Get Schedule By Date
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/schedule?date=2026-04-10
- **Query Params:** date (required, format: YYYY-MM-DD)
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "date": "2026-04-10T00:00:00.000Z",
  "totalBookings": 3,
  "bookings": [
    {
      "_id": "...",
      "status": "Accepted",
      "timeSlot": { "startTime": "10:00", "endTime": "11:00" },
      "customer": { "username": "Asha", "phoneNumber": "9876543210" },
      "services": [{ "service": { "name": "Facial", "price": 999 } }]
    }
  ]
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Date parameter is required"
}
~~~

---

### 5) Get Clients
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/clients
- **Description:** List unique customers from completed bookings with stats.
- **Query Params:** page, limit
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "clients": [
    {
      "customer": {
        "_id": "...",
        "username": "Asha",
        "email": "asha@example.com",
        "phoneNumber": "9876543210",
        "profileImage": "/uploads/asha.jpg",
        "tier": "Classic"
      },
      "totalBookings": 5,
      "totalSpent": 8500,
      "lastBookingDate": "2026-04-05T...",
      "services": ["Facial", "Hair Styling"]
    }
  ],
  "total": 12
}
~~~

---

## Beautician Services APIs (/api/mobileapp/beautician)

### 1) Get Services
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/services
- **Description:** List all active services available to offer.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "services": [
    {
      "serviceId": "...",
      "name": "Facial",
      "price": 999,
      "duration": 60,
      "category": { "_id": "...", "name": "Skin" }
    }
  ]
}
~~~

---

### 2) Update Service Preference
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/beautician/services/:serviceId
- **Description:** Note service preferences (admin controls base pricing).
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "price": 1099,
  "duration": 75
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Service preferences noted. Admin controls base pricing."
}
~~~

---

### 3) List Curated Services
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/curated-services
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "curatedServices": [
    {
      "_id": "...",
      "curatedServiceName": "Bridal Glow Package",
      "curatedServiceTitle": "Bridal Glow",
      "price": 2999,
      "duration": 180,
      "discount": 0,
      "isActive": true,
      "image1": "/uploads/bridal1.jpg",
      "image2": "/uploads/bridal2.jpg",
      "category": { "_id": "...", "name": "Bridal" },
      "subCategory": { "_id": "...", "name": "Glow" },
      "beautician": {
        "_id": "...",
        "fullName": "Riya",
        "phoneNumber": "9123456789",
        "profileImage": "/uploads/riya.jpg",
        "rating": 4.7,
        "tier": "Premium"
      }
    }
  ]
}
~~~

---

### 4) Create Curated Service
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/beautician/curated-services
- **Headers:** Authorization: Bearer <token>; Content-Type: multipart/form-data
- **Request Body (form-data):**
~~~
curatedServiceName: Bridal Glow Package
curatedServiceTitle: Bridal Glow
description: Full bridal makeup and hair styling
price: 2999
duration: 180
discount: 0
category: <categoryId>
subCategory: <subCategoryId>
image1: <file>
image2: <file>
~~~
- **Response:**
~~~json
{
  "success": true,
  "curatedService": {
    "_id": "...",
    "curatedServiceName": "Bridal Glow Package",
    "curatedServiceTitle": "Bridal Glow",
    "price": 2999,
    "duration": 180,
    "discount": 0,
    "image1": "/uploads/bridal1.jpg",
    "image2": "/uploads/bridal2.jpg",
    "category": { "_id": "...", "name": "Bridal" },
    "subCategory": { "_id": "...", "name": "Glow" },
    "beautician": {
      "_id": "...",
      "fullName": "Riya",
      "phoneNumber": "9123456789",
      "profileImage": "/uploads/riya.jpg",
      "rating": 4.7,
      "tier": "Premium"
    }
  }
}
~~~

---

### 5) Update Curated Service
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/beautician/curated-services/:curatedServiceId
- **Headers:** Authorization: Bearer <token>; Content-Type: multipart/form-data
- **Request Body (form-data):** Same fields as Create (all optional).
- **Response:**
~~~json
{
  "success": true,
  "curatedService": {
    "_id": "...",
    "curatedServiceName": "Updated Name",
    "price": 3499,
    "duration": 180,
    "category": { "_id": "...", "name": "Bridal" },
    "beautician": {
      "_id": "...",
      "fullName": "Riya",
      "rating": 4.7,
      "tier": "Premium"
    }
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Not found or unauthorized"
}
~~~

---

### 6) Delete Curated Service
- **Endpoint:** DELETE https://sidi.mobilegear.co.in/api/mobileapp/beautician/curated-services/:curatedServiceId
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Deleted"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Not found or unauthorized"
}
~~~

---

## Beautician Documents APIs (/api/mobileapp/beautician)

### 1) Get Documents
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/documents
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "documents": [
    {
      "_id": "...",
      "documentType": "certificate",
      "documentName": "Cosmetology Diploma",
      "documentUrl": "/uploads/diploma.pdf",
      "isVerified": true,
      "verifiedAt": "2026-01-12T...",
      "uploadedAt": "2026-01-05T..."
    }
  ]
}
~~~

---

### 2) Add Document
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/beautician/documents
- **Headers:** Authorization: Bearer <token>; Content-Type: multipart/form-data
- **Request Body (form-data):**
~~~
document: <file>
documentType: certificate
documentName: Cosmetology Diploma
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Document uploaded successfully",
  "document": {
    "_id": "...",
    "documentType": "certificate",
    "documentName": "Cosmetology Diploma",
    "documentUrl": "/uploads/1712345678901.pdf",
    "isVerified": false,
    "uploadedAt": "2026-04-08T..."
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "No document file provided"
}
~~~

---

### 3) Delete Document
- **Endpoint:** DELETE https://sidi.mobilegear.co.in/api/mobileapp/beautician/documents/:documentId
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Document deleted successfully"
}
~~~

---

## Beautician Payment Methods APIs (/api/mobileapp/beautician)

### 1) Get Payment Methods
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/beautician/payment-methods
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "paymentMethods": [
    {
      "_id": "...",
      "type": "bank_account",
      "label": "HDFC Bank",
      "details": {
        "accountNumber": "****1234",
        "ifscCode": "HDFC0001234",
        "bankName": "HDFC",
        "accountHolderName": "Riya P"
      },
      "isDefault": true
    },
    {
      "_id": "...",
      "type": "upi",
      "label": "UPI",
      "details": { "upiId": "riya@upi" },
      "isDefault": false
    }
  ]
}
~~~

---

### 2) Add Payment Method
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/beautician/payment-methods
- **Description:** Add a payout method. First method is auto-set as default. Supported types: bank_account, upi, paypal.
- **Headers:** Authorization: Bearer <token>
- **Request Body (bank account):**
~~~json
{
  "type": "bank_account",
  "label": "HDFC Savings",
  "details": {
    "accountNumber": "1234567890",
    "ifscCode": "HDFC0001234",
    "bankName": "HDFC",
    "accountHolder": "Riya P"
  },
  "isDefault": true
}
~~~
- **Request Body (UPI):**
~~~json
{
  "type": "upi",
  "label": "UPI",
  "details": { "upiId": "riya@upi" },
  "isDefault": false
}
~~~
- **Request Body (PayPal):**
~~~json
{
  "type": "paypal",
  "label": "PayPal",
  "details": { "paypalEmail": "riya@paypal.com" },
  "isDefault": false
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Payment method added",
  "paymentMethod": {
    "_id": "...",
    "type": "bank_account",
    "label": "HDFC Savings",
    "details": {
      "accountNumber": "1234567890",
      "ifscCode": "HDFC0001234"
    },
    "isDefault": true
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Payment method type and details are required"
}
~~~

---

### 3) Delete Payment Method
- **Endpoint:** DELETE https://sidi.mobilegear.co.in/api/mobileapp/beautician/payment-methods/:methodId
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "message": "Payment method deleted"
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Payment method not found"
}
~~~

---

## Beautician Payment/Earnings APIs (/api/mobileapp/payment)

### 1) Get Wallet (Beautician)
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/payment/wallet
- **Description:** Get balance, points, and work eligibility (workEligibility included for Beautician role only).
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "wallet": {
    "balance": 1500,
    "points": 35,
    "currency": "INR"
  },
  "workEligibility": {
    "walletBalance": 1500,
    "minimumRequired": 50,
    "isEligibleForWork": true
  }
}
~~~

---

### 2) Earnings Summary
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/payment/earnings
- **Description:** Beautician payout/earnings summary.
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "earnings": {
    "totalEarnings": 25000,
    "pendingPayout": 6000,
    "totalCommissionPaid": 2400,
    "walletBalance": 3700
  },
  "pendingPayouts": []
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

---

## Cosmetics APIs - Beautician (/api/mobileapp/cosmetics)

### 1) Get Cosmetic Items
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/items
- **Query Params:** page, limit, category, search
- **Headers:** Authorization: Bearer <token> (Beautician only)
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "items": [
    {
      "_id": "...",
      "name": "Serum",
      "price": 499,
      "stockQuantity": 20,
      "category": "Skincare"
    }
  ],
  "total": 30,
  "categories": ["Skincare", "Haircare"]
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
~~~

---

### 2) Get Cosmetic Item Detail
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/items/:itemId
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "item": {
    "_id": "...",
    "name": "Serum",
    "price": 499,
    "stockQuantity": 20
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Item not found"
}
~~~

---

### 3) Place Cosmetic Order
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/orders
- **Description:** Place order. Amount deducted from wallet. Stock reduced.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "items": [
    { "itemId": "6654...", "quantity": 2 },
    { "itemId": "6655...", "quantity": 1 }
  ],
  "shippingAddress": "Salon Street, Kochi",
  "deliveryNotes": "Deliver before 6 PM"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Order placed successfully",
  "order": {
    "_id": "...",
    "totalAmount": 1497,
    "status": "Pending"
  },
  "walletBalance": 520
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "required": 1497,
  "available": 500
}
~~~

---

### 4) Get My Cosmetic Orders
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/orders
- **Query Params:** page, limit, status
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "orders": [],
  "total": 5
}
~~~

---

### 5) Get Cosmetic Order Detail
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/orders/:orderId
- **Headers:** Authorization: Bearer <token>
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "order": {
    "_id": "...",
    "items": [],
    "status": "Pending"
  }
}
~~~

---

### 6) Cancel Cosmetic Order
- **Endpoint:** PUT https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/orders/:orderId/cancel
- **Description:** Cancel pending order. Wallet refunded and stock restored.
- **Headers:** Authorization: Bearer <token>
- **Request Body:**
~~~json
{
  "reason": "Ordered by mistake"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Order cancelled and refunded",
  "refundAmount": 1497
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Order not found or cannot be cancelled"
}
~~~

---

# ======================================================
# ADMIN Booking Management APIs
# ======================================================

---

## Admin Booking Management APIs (/api/admin)

### 1) Get Pending Booking Requests
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/admin/bookings/pending
- **Description:** Get all pending booking requests waiting for admin to assign beautician. Status = "Requested"
- **Headers:** Authorization: Bearer <admin_token>
- **Query Params:** page (default 1), limit (default 10), status (default "Requested")
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "bookings": [
    {
      "_id": "...",
      "customer": {
        "_id": "...",
        "fullName": "Customer Name",
        "phoneNumber": "+91...",
        "profileImage": "/uploads/...",
        "email": "customer@email.com"
      },
      "beautician": null,
      "services": [
        {
          "_id": "...",
          "service": {
            "_id": "...",
            "name": "Facial",
            "price": 999,
            "duration": 60
          }
        },
        {
          "_id": "...",
          "service": {
            "_id": "...",
            "name": "Massage",
            "price": 1499,
            "duration": 90
          }
        }
      ],
      "bookingDate": "2026-05-15T00:00:00.000Z",
      "timeSlot": {
        "startTime": "10:00",
        "endTime": "12:30"
      },
      "status": "Requested",
      "totalAmount": 2498,
      "finalAmount": 2498,
      "createdAt": "2026-05-13T10:30:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "totalPages": 1
}
~~~

---

### 2) Assign Beautician & Approve Booking
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/admin/bookings/:bookingId/assign
- **Description:** Assign a beautician to a pending booking and change status to "Assigned". Notifies both beautician and customer.
- **Headers:** Authorization: Bearer <admin_token>
- **Request Body:**
~~~json
{
  "beauticianId": "beautician_id_here"
}
~~~
- **Response:**
~~~json
{
  "success": true,
  "message": "Beautician assigned and booking approved",
  "booking": {
    "_id": "...",
    "customer": "...",
    "beautician": {
      "_id": "...",
      "fullName": "Beautician Name",
      "phoneNumber": "+91...",
      "profileImage": "/uploads/...",
      "rating": 4.5
    },
    "services": [
      {
        "_id": "...",
        "service": {
          "_id": "...",
          "name": "Facial",
          "price": 999,
          "duration": 60
        }
      },
      {
        "_id": "...",
        "service": {
          "_id": "...",
          "name": "Massage",
          "price": 1499,
          "duration": 90
        }
      }
    ],
    "bookingDate": "2026-05-15T00:00:00.000Z",
    "status": "Assigned",
    "totalAmount": 2498,
    "finalAmount": 2498
  }
}
~~~
- **Error Response:**
~~~json
{
  "success": false,
  "message": "Only pending requests can be assigned"
}
~~~

---

### 3) Get Assigned Bookings with Beautician Responses
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/admin/bookings/assigned
- **Description:** Get all bookings that have been assigned to beauticians. Shows their accept/reject responses and current status.
- **Headers:** Authorization: Bearer <admin_token>
- **Query Params:** page (default 1), limit (default 10), beauticianResponse (optional: "accepted" or "rejected")
- **Request Body:** N/A
- **Response:**
~~~json
{
  "success": true,
  "bookings": [
    {
      "_id": "...",
      "customer": {
        "_id": "...",
        "fullName": "Customer Name",
        "phoneNumber": "+91...",
        "profileImage": "/uploads/...",
        "email": "customer@email.com"
      },
      "beautician": {
        "_id": "...",
        "fullName": "Beautician Name",
        "phoneNumber": "+91...",
        "profileImage": "/uploads/...",
        "rating": 4.7
      },
      "services": [
        {
          "_id": "...",
          "service": {
            "_id": "...",
            "name": "Facial",
            "price": 999,
            "duration": 60
          }
        },
        {
          "_id": "...",
          "service": {
            "_id": "...",
            "name": "Massage",
            "price": 1499,
            "duration": 90
          }
        }
      ],
      "bookingDate": "2026-05-15T00:00:00.000Z",
      "timeSlot": {
        "startTime": "10:00",
        "endTime": "12:30"
      },
      "status": "Accepted",
      "totalAmount": 2498,
      "finalAmount": 2498,
      "createdAt": "2026-05-13T10:30:00.000Z",
      "updatedAt": "2026-05-13T10:45:00.000Z"
    }
  ],
  "total": 15,
  "page": 1,
  "totalPages": 2
}
~~~

---

# ======================================================
# SHARED / GENERAL APIs
# ======================================================

---

## Top Beauticians (Public)
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/beauticians/top-rated
- **Query Params:** minRating (default 4), limit (default 10)
- **Headers:** N/A
- **Response:**
~~~json
[
  {
    "_id": "...",
    "fullName": "Riya",
    "rating": 4.7,
    "totalReviews": 40,
    "tier": "Premium",
    "profileImage": "/uploads/riya.jpg",
    "services": [],
    "curatedServices": [],
    "reviews": [
      { "rating": 5, "comment": "Great!", "customer": "...", "createdAt": "..." }
    ],
    "averageRating": 4.7
  }
]
~~~

---

## Payment Webhook
- **Endpoint:** POST https://sidi.mobilegear.co.in/api/mobileapp/payment/webhook
- **Description:** Gateway webhook callback endpoint.
- **Headers:** gateway-defined
- **Request Body:** gateway event payload
- **Response:**
~~~json
{
  "success": true,
  "message": "Webhook received"
}
~~~

---

## Health Check
- **Endpoint:** GET https://sidi.mobilegear.co.in/api/ping
- **Description:** Server heartbeat.
- **Response:**
~~~json
{
  "message": "Salon server is running"
}
~~~

---

# 4. File Upload

Supported file types: jpeg, jpg, png, gif, webp, pdf
Max file size: 5MB

| Endpoint | Field | Notes |
|---|---|---|
| PUT /api/mobileapp/user/profile | profileImage | Single file |
| PUT /api/mobileapp/beautician/profile | profileImage | Single file |
| POST /api/mobileapp/beautician/profile/upload-image | profileImage | Single file |
| POST /api/mobileapp/beautician/documents | document | Single file; optional: documentType, documentName |
| POST /api/mobileapp/auth/beautician/upload-documents | documents | Multiple files, max 5; optional: documentType |
| POST /api/mobileapp/beautician/curated-services | image1, image2 | Two separate files |

Multipart example (Dio):
~~~dart
final formData = FormData.fromMap({
  'documentType': 'certificate',
  'documents': [
    await MultipartFile.fromFile(file1.path),
    await MultipartFile.fromFile(file2.path),
  ]
});
~~~

---

# 5. Common Response Format

Success:
~~~json
{
  "success": true,
  "message": "Optional success message",
  "data": {}
}
~~~

Error:
~~~json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": "validation reason"
  }
}
~~~

---

# 6. HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation / business rule error |
| 401 | Invalid or expired token |
| 403 | Deactivated / suspended / wrong role |
| 404 | Resource not found |
| 500 | Internal server error |

---

# 7. Important Notes

- Send `Authorization: Bearer <token>` header for all protected routes.
- Common mistakes:
  - Wrong base URL (must use https://sidi.mobilegear.co.in)
  - Missing Bearer token
  - Sending JSON for multipart endpoints
  - Using Customer token on Beautician-only routes
- Bookings must be placed for the **next day or later** - same-day bookings are not allowed.
- Bookings after **11:00 PM** are not accepted.
- Travel fee is **Rs.10/km** auto-calculated based on distance.
- Platform commission is **Rs.200 per booking**.
- Beautician payout is released **4 days** after booking completion.
- Beautician must maintain a minimum wallet balance of **Rs.50** to remain eligible for work.
- Recommended client timeouts: Connect 15s, Receive 20s.

---

# 8. Quick Start for Flutter Developer

### Dio setup
~~~dart
final dio = Dio(BaseOptions(
  baseUrl: 'https://sidi.mobilegear.co.in',
  connectTimeout: const Duration(seconds: 15),
  receiveTimeout: const Duration(seconds: 20),
  headers: {'Content-Type': 'application/json'},
));

String? token;

dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) {
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  },
));
~~~

### Customer Login (Dio)
~~~dart
final res = await dio.post(
  '/api/mobileapp/auth/customer/login',
  data: {
    'email': 'asha@example.com',
    'password': 'Pass@123'
  },
);
token = res.data['token'];
~~~

### Beautician Login (Dio)
~~~dart
final res = await dio.post(
  '/api/mobileapp/auth/beautician/login',
  data: {
    'email': 'riya@example.com',
    'password': 'Pass@123'
  },
);
token = res.data['token'];
~~~

### Authenticated request (Dio)
~~~dart
final profileRes = await dio.get('/api/mobileapp/user/profile');
print(profileRes.data);
~~~

### http package example
~~~dart
final loginRes = await http.post(
  Uri.parse('https://sidi.mobilegear.co.in/api/mobileapp/auth/customer/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'email': 'asha@example.com', 'password': 'Pass@123'}),
);

final token = jsonDecode(loginRes.body)['token'];

final profileRes = await http.get(
  Uri.parse('https://sidi.mobilegear.co.in/api/mobileapp/user/profile'),
  headers: {'Authorization': 'Bearer $token'},
);
~~~
