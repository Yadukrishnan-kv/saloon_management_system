

## Unified Search API (New)

### 1) Search by Name (Service, Curated Service, or Beautician)
- **Endpoint URL:** https://sidi.mobilegear.co.in/api/mobileapp/search/all
- **Method:** GET
- **Query:** query (required, must be the exact name)
- **Description:**
  - Enter a name in the search bar. The API will search for an exact match (case-insensitive) in this order:
    1. Service name
    2. Curated Service name
    3. Beautician full name
  - Only the first matching type is returned. If you search a service name, only that service is returned. If not found, it tries curated service, then beautician.
  - Only one result is returned per search.
- **Headers:** N/A
- **Request Example:**
  - `GET /api/mobileapp/search/all?query=Facial`
- **Response Examples:**

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

## NEW & UPDATED REVIEW/RATING APIs (2026-04-23)

### 1) Create Beautician Review (No Booking Required)
- Endpoint: POST /api/mobileapp/reviews/beautician
- Headers: Authorization: Bearer <token>
- Body:
~~~json
{
  "beauticianId": "6653...",
  "rating": 5,
  "reviewText": "Great service"
}
~~~
- Response:
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

### 2) Rate a Service
- Endpoint: POST /api/mobileapp/reviews/service
- Headers: Authorization: Bearer <token>
- Body:
~~~json
{
  "serviceId": "6653...",
  "rating": 4
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Service rated successfully."
}
~~~

### 3) Rate a Curated Service
- Endpoint: POST /api/mobileapp/reviews/curated-service
- Headers: Authorization: Bearer <token>
- Body:
~~~json
{
  "curatedServiceId": "6653...",
  "rating": 5
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Curated service rated successfully."
}
~~~

### 4) Get Beautician Reviews
- Endpoint: GET /api/mobileapp/reviews/beautician/:beauticianId
- Response:
~~~json
{
  "success": true,
  "reviews": [
    { "_id": "...", "customerId": "...", "rating": 5, "reviewText": "Great service" }
  ],
  "averageRating": 4.6,
  "totalReviews": 40
}
~~~

### 5) Get Service Ratings
- Endpoint: GET /api/mobileapp/reviews/service/:serviceId
- Response:
~~~json
{
  "success": true,
  "ratings": [
    { "_id": "...", "customerId": "...", "rating": 4 }
  ],
  "averageRating": 4.3,
  "totalRatings": 18
}
~~~

### 6) Get Curated Service Ratings
- Endpoint: GET /api/mobileapp/reviews/curated-service/:curatedServiceId
- Response:
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

### 7) GET API Response Updates
- Beautician GET API now includes:
~~~json
{
  ...,
  "reviews": [ { "reviewText": "...", "rating": 5 } ],
  "averageRating": 4.6
}
~~~
- Service GET API now includes:
~~~json
{
  ...,
  "ratings": [ { "rating": 4 } ],
  "averageRating": 4.3
}
~~~
- CuratedService GET API now includes:
~~~json
{
  ...,
  "ratings": [ { "rating": 5 } ],
  "averageRating": 4.8
}
~~~

---




### 2) Get Top Beauticians (New)
- Endpoint URL: https://sidi.mobilegear.co.in/api/beauticians/top-rated
- Method: GET
- Query: minRating (default 4), limit (default 10)
- Description: Get beauticians with rating >= minRating, sorted by rating and reviews. Returns enriched beautician objects.
- Response:
~~~json
[
  {
    "_id": "...",
    "fullName": "Riya",
    "rating": 4.7,
    "services": [ /* ... */ ],
    "curatedServices": [ /* ... */ ],
    "reviews": [
      { "rating": 5, "comment": "Great!", "customer": "...", "createdAt": "..." }
    ],
    "averageRating": 4.7,
    ...
  }
]
~~~

### 3) Change Password (New, for Customer & Beautician)
- Endpoint URL: https://sidi.mobilegear.co.in/api/auth/change-password
- Method: POST
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "currentPassword": "Old@123",
  "newPassword": "New@123"
}
~~~
- Response:
~~~json
{
  "message": "Password changed successfully"
}
~~~
- Error Response:
~~~json
{
  "message": "Current password is incorrect"
}
~~~

### 4) Admin Create Beautician (New)
- Endpoint: POST /api/admin/beauticians
- Headers: Authorization: Bearer <Admin|SuperAdmin token>
- Body:
~~~json
{
  "username": "testbeauty1",
  "email": "testbeauty1@example.com",
  "password": "securePass123",
  "phoneNumber": "9745706289",
  "fullName": "Test Beautician",
  "bio": "Beautician",
  "skills": ["Hair", "Makeup"],
  "experience": 12,
  "tier": "Classic",
  "qualifications": "Diploma",
  "isVerified": true,
  "verificationStatus": "Approved",
  "status": "Active"
}
~~~
- Description: Admins can create a beautician and linked user in one step. All fields from the Beautician model are supported. The returned beautician will have a valid `user` field for login.
- Success Response:
~~~json
{
  "success": true,
  "message": "Beautician created successfully",
  "beautician": {
    "_id": "...",
    "user": "...",
    "fullName": "Test Beautician",
    ...
  },
  "user": {
    "_id": "...",
    "username": "testbeauty1",
    "email": "testbeauty1@example.com",
    ...
  }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Username, email, or phone number already in use"
}
~~~

---
# Mobile App API README

## 1. Base URL
Production base URL:
- https://sidi.mobilegear.co.in

API root:
- https://sidi.mobilegear.co.in/api/mobileapp

Example:
- https://sidi.mobilegear.co.in/api/mobileapp/auth/customer/login

## 2. Authentication Flow

### Login APIs
- Customer: POST /api/mobileapp/auth/customer/login
- Beautician: POST /api/mobileapp/auth/beautician/login

### Token response format
Success login returns a JWT token in response body.

Example:
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
- Mobile module does not expose a dedicated refresh endpoint.
- On 401 Invalid or expired token, login again.

## 3. API Modules

Notes:
- Full URL format: https://sidi.mobilegear.co.in + Endpoint
- Protected = requires Authorization Bearer token
- For GET/DELETE endpoints, Request Body = N/A

---

## Auth APIs (/api/mobileapp/auth)


### 1) Customer Register
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/auth/customer/register
- Method: POST
- Description: Register customer and trigger OTP verification via email.
- Headers: Content-Type: application/json
- Request Body:
~~~json
{
  "name": "Asha",
  "email": "asha@example.com",
  "password": "Pass@123",
  "confirmPassword": "Pass@123"
}
~~~
- Note: Only email is required for OTP verification. OTP will be sent to the provided email address. Phone is not required.
- Response:
~~~json
{
  "success": true,
  "message": "Registration successful. Please verify your account.",
  "userId": "6650...",
  "requiresOTP": true
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Email already in use"
}
~~~


### 2) Verify OTP
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/auth/customer/verify-otp
- Method: POST
- Description: Verify OTP sent to email and return JWT token.
- Headers: Content-Type: application/json
- Request Body:
~~~json
{
  "userId": "6650...",
  "otp": "123456",
  "type": "email"
}
~~~
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
~~~

### 3) Customer Login
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/auth/customer/login
- Method: POST
- Description: Login with email, username, or phone + password.
- Headers: Content-Type: application/json
- Request Body (send either email, username, or phone):
~~~json
{
  "email": "asha@example.com",
  "password": "Pass@123"
}
~~~
- Alternative (username):
~~~json
{
  "username": "Asha",
  "password": "Pass@123"
}
~~~
- Alternative (phone):
~~~json
{
  "phone": "9876543210",
  "password": "Pass@123"
}
~~~
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Invalid credentials"
}
~~~


### 4) Customer Resend OTP
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/auth/customer/resend-otp
- Method: POST
- Description: Resend verification OTP to email.
- Headers: Content-Type: application/json
- Request Body:
~~~json
{
  "userId": "6650..."
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "OTP sent to your email"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "userId is required"
}
~~~


### 5) Beautician Register (Automated User+Beautician Creation)
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/auth/beautician/register
- Method: POST
- Description: Register beautician account (creates both User and Beautician, links them automatically; pending admin verification). OTP will be sent to email. All fields required by admin are supported. **Profile image is NOT required at registration and can be updated later from the profile page.**
- Headers:
  - Content-Type: multipart/form-data
- Request Body (all fields except profileImage and tier):
  - name: string (required)
  - email: string (required)
  - password: string (required)
  - phoneNumber: string (required)
  - skills: string[] (required)
  - experience: number (required)
  - bio: string (optional)
  - qualifications: string (optional)
  - location[address]: string (optional)
  - location[city]: string (optional)
  - location[state]: string (optional)
  - location[pincode]: string (optional)
  - professionalTitle: string (optional)
  - documents: file[] (optional, max 5)
  - documentType: string (optional, applies to all uploaded documents)

Example (FormData):
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
- Required fields: name, email, password, phoneNumber, skills, experience
- Note: `profileImage` and `tier` should NOT be sent at registration. Beauticians can upload or update their profile image after registration from their profile page (like customers).
- Note: `documents` and `documentType` are optional but recommended for admin verification. Multiple documents can be uploaded; all will use the same `documentType` value.
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Email already in use"
}
~~~

### 6) Beautician Login
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/auth/beautician/login
- Method: POST
- Description: Beautician login with email or phoneNumber and password.
- Headers: Content-Type: application/json
- Request Body (use either email or phoneNumber):
~~~json
{
  "email": "riya@example.com",
  "password": "Pass@123"
}
~~~
or
~~~json
{
  "phoneNumber": "9123456789",
  "password": "Pass@123"
}
~~~
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Account is deactivated. Contact support."
}
~~~

### 7) Beautician Upload Documents
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/auth/beautician/upload-documents
- Method: POST
- Description: Upload beautician verification documents.
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: multipart/form-data
- Request Body (form-data):
  - documents: file[] (max 5)
  - documentType: string (example: certificate)
- Response:
~~~json
{
  "success": true,
  "message": "Documents uploaded successfully"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "No files uploaded"
}
~~~

### 8) Logout
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/auth/logout
- Method: POST
- Description: Logout current user.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Logged out successfully"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Invalid or expired token"
}
~~~


### 9) Forgot Password
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/auth/forgot-password
- Method: POST
- Description: Send password reset OTP to email.
- Headers: Content-Type: application/json
- Request Body:
~~~json
{
  "email": "asha@example.com"
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Password reset OTP sent to your email",
  "userId": "6650..."
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "No account found with this credential"
}
~~~

### 10) Reset Password
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/auth/reset-password
- Method: POST
- Description: Reset password using OTP received from forgot-password endpoint.
- Headers: Content-Type: application/json
- Request Body:
~~~json
{
  "userId": "6650...",
  "otp": "123456",
  "newPassword": "NewPass@123",
  "confirmPassword": "NewPass@123"
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
~~~

---

## User APIs (/api/mobileapp/user) [Customer only]

### 1) Get Profile
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/profile
- Method: GET
- Description: Get current customer profile with stats and favorite stylists.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
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
- Note: The profileImage field will be a full URL if an image has been uploaded, or empty string if no image is set.

### 2) Update Profile
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/profile
- Method: PUT
- Description: Update customer profile; supports profile image upload.
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: multipart/form-data (when uploading image) OR application/json (when updating only text fields)
- Request Body (FormData with file):
~~~
name: "Asha K"
email: "asha.k@example.com"
phone: "9876543210"
profileImage: <file object> (optional - only include if uploading a new image)
~~~
- Request Body (JSON - text fields only):
~~~json
{
  "name": "Asha K",
  "email": "asha.k@example.com",
  "phone": "9876543210"
}
~~~
- Response (with image URL):
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Email already in use"
}
~~~
- Notes:
  - Profile image is optional. Only send the profileImage field if you're uploading a new image.
  - The returned profileImage will be a full URL pointing to the uploaded file.
  - Only update the fields you want to change; other fields will remain unchanged.

### 3) Change Password
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/change-password
- Method: PUT
- Description: Change account password.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "currentPassword": "Old@123",
  "newPassword": "New@123",
  "confirmPassword": "New@123"
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Password changed successfully"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Current password is incorrect"
}
~~~

### 4) Add Address
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/add-address
- Method: POST
- Description: Add customer address.
- Headers: Authorization: Bearer <token>
- Request Body:
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
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Address and city are required"
}
~~~

### 5) Get Addresses
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/addresses
- Method: GET
- Description: List saved addresses.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 6) Update Address
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/address/:id
- Method: PUT
- Description: Update a saved address.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "label": "Office",
  "address": "Infopark",
  "city": "Kochi",
  "isDefault": false
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Address updated successfully"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Address not found"
}
~~~

### 7) Delete Address
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/address/:id
- Method: DELETE
- Description: Delete saved address.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Address deleted successfully"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Address not found"
}
~~~

### 8) Booking History
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/booking-history
- Method: GET
- Description: Customer booking history with pagination/filter.
- Headers: Authorization: Bearer <token>
- Query: page, limit, status
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "bookings": [],
  "total": 12,
  "currentPage": 1,
  "totalPages": 2
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 9) Booking By ID
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/booking/:id
- Method: GET
- Description: Get one customer booking detail.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "booking": {
    "_id": "...",
    "status": "Completed"
  }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Booking not found"
}
~~~


### 10) Get Favorite Stylists
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/favorites
- Method: GET
- Description: Get customer's favorite beauticians list.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 11) Add Favorite Stylist
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/favorites
- Method: POST
- Description: Add a beautician to favorites.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "beauticianId": "6651..."
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Added to favorites"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Already in favorites"
}
~~~

### 12) Remove Favorite Stylist
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/favorites/:beauticianId
- Method: DELETE
- Description: Remove a beautician from favorites.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Removed from favorites"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Not in favorites"
}
~~~

### 13) Get Favorite Services
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/favorite-services
- Method: GET
- Description: Get customer's favorite services list.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 14) Add Favorite Service
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/favorite-services
- Method: POST
- Description: Add a service to favorites.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "serviceId": "6652..."
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Added to favorites"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Already in favorites"
}
~~~

### 15) Remove Favorite Service
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/favorite-services/:serviceId
- Method: DELETE
- Description: Remove a service from favorites.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Removed from favorites"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Not in favorites"
}
~~~

### 16) Get All Favorites (Beauticians & Services)
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/user/favorites/all
- Method: GET
- Description: Get both favorite beauticians and favorite services in a single response.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 17) Get All Beauticians (Public)
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/all
- Method: GET
- Description: Get all beauticians (public endpoint, supports search, pagination, status filter).
- Query: page, limit, search, status
- Headers: N/A
- Request Body: N/A
- Response:
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
      "isVerified": true
    }
  ],
  "total": 1,
  "currentPage": 1,
  "totalPages": 1
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

---

## Services APIs (/api/mobileapp/services)

### 1) Home Dashboard
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/services/home
- Method: GET
- Description: Aggregate home screen data — banners, categories, popular services, offers.
- Headers: N/A
- Request Body: N/A
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 2) Get Location from Coordinates
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/services/location?lat=<latitude>&lng=<longitude>
- Method: GET
- Description: Get location details from latitude and longitude coordinates.
- Headers: N/A
- Request Body: N/A
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Latitude and longitude are required"
}
~~~


### Category APIs

#### 1) Get All Categories
- Endpoint URL: https://sidi.mobilegear.co.in/api/categories
- Method: GET
- Description: Get all top-level categories (no parent).
- Headers: N/A
- Response:
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

#### 2) Create Category
- Endpoint URL: https://sidi.mobilegear.co.in/api/categories
- Method: POST
- Description: Create a new top-level category (with optional image).
- Headers: Content-Type: multipart/form-data
- Body:
  - name: string (required)
  - image: file (optional)
  - sortOrder: number (optional)

#### 3) Update Category
- Endpoint URL: https://sidi.mobilegear.co.in/api/categories/:id
- Method: PUT
- Description: Update a category (with optional image).
- Headers: Content-Type: multipart/form-data
- Body: Same as create

#### 4) Delete Category
- Endpoint URL: https://sidi.mobilegear.co.in/api/categories/:id
- Method: DELETE
- Description: Delete a category.

### SubCategory APIs

#### 1) Get All SubCategories
- Endpoint URL: https://sidi.mobilegear.co.in/api/subcategories
- Method: GET
- Description: Get all subcategories with parent category reference.
- Headers: N/A
- Response:
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

#### 2) Create SubCategory
- Endpoint URL: https://sidi.mobilegear.co.in/api/subcategories
- Method: POST
- Description: Create a new subcategory (no image field).
- Headers: Content-Type: application/json
- Body:
  - name: string (required)
  - category: string (parent category _id, required)
  - sortOrder: number (optional)

#### 3) Update SubCategory
- Endpoint URL: https://sidi.mobilegear.co.in/api/subcategories/:id
- Method: PUT
- Description: Update a subcategory.
- Headers: Content-Type: application/json
- Body: Same as create

#### 4) Delete SubCategory
- Endpoint URL: https://sidi.mobilegear.co.in/api/subcategories/:id
- Method: DELETE
- Description: Delete a subcategory.

### 5) Search Services
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/services/search
- Method: GET
- Description: Search services by query.
- Headers: N/A
- Query: query, location, date, time
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "services": [],
  "availableBeauticians": []
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Search query is required"
}
~~~

### 6) Popular Services
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/services/popular
- Method: GET
- Description: Get popular services.
- Headers: N/A
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "popularServices": []
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 7) Offers
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/services/offers
- Method: GET
- Description: Get discounted services and active banners.
- Headers: N/A
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "activeOffers": {
    "discountedServices": [],
    "banners": []
  }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 8) Get Service Addons
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/services/:serviceId/addons
- Method: GET
- Description: Get add-ons applicable to a specific service or its category.
- Headers: N/A
- Request Body: N/A
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Service not found"
}
~~~

### 9) Get All Services
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/services
- Method: GET
- Description: List services with filters and multiple images.
- Headers: N/A
- Query: categoryId, search, minPrice, maxPrice, sortBy
- Request Body: N/A
- Response:
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
      "category": {
        "_id": "...",
        "name": "Skin"
      }
    }
  ],
  "total": 25
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 10) Get Service By ID
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/services/:serviceId
- Method: GET
- Description: Service detail with beautician suggestions and multiple images.
- Headers: N/A
- Request Body: N/A
- Response:
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
    "category": {
      "_id": "...",
      "name": "Skin"
    },
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Service not found"
}
~~~

---

## Booking APIs (/api/mobileapp/bookings)

### Customer APIs

### 1) Create Booking
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/create
- Method: POST
- Description: Create booking (assigned or broadcast flow). Supports service add-ons and calculates travel fee.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "serviceId": "6652...",
  "beauticianId": null,
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
  "preferredGender": "Female",
  "addonIds": ["6654...", "6655..."]
}
~~~
- Note: `addonIds` is optional. `address.unit` and `address.gateCode` are optional. Travel fee is ₹10/km auto-calculated.
- Response:
~~~json
{
  "success": true,
  "message": "Booking created. Waiting for beautician to accept.",
  "booking": { "_id": "...", "status": "Requested", "jobId": "A1B2C3-BK" },
  "estimatedPrice": 899,
  "addonsAmount": 650,
  "travelFee": 30,
  "assignedBeautician": null,
  "broadcastedCount": 4
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Bookings are not accepted after 11:00 PM"
}
~~~

### 2) My Bookings
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/my-bookings
- Method: GET
- Description: Get customer bookings.
- Headers: Authorization: Bearer <token>
- Query: page, limit, status (upcoming/completed/cancelled)
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "bookings": [],
  "total": 8,
  "currentPage": 1
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 3) Booking Details
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/:bookingId
- Method: GET
- Description: Get one booking with timeline.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "booking": {
    "_id": "...",
    "status": "Accepted",
    "timeline": [
      { "status": "Requested", "date": "2026-04-08T10:00:00.000Z" }
    ]
  }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Booking not found"
}
~~~

### 4) Cancel Booking
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/:bookingId/cancel
- Method: PUT
- Description: Cancel booking (cancellation fee applies).
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "reason": "Plan changed"
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "refundAmount": 699
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Cannot cancel a booking that is InProgress"
}
~~~

### 5) Reschedule Booking
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/:bookingId/reschedule
- Method: PUT
- Description: Reschedule date/time.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "newDate": "2026-04-12",
  "newTime": "11:00"
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Booking rescheduled successfully",
  "booking": { "_id": "..." }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "New date and time are required"
}
~~~

### 6) Available Slots
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/available-slots
- Method: GET
- Description: Get available slots by service/date/beautician.
- Headers: N/A
- Query: serviceId, date, beauticianId(optional)
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "availableSlots": ["09:00", "10:00", "11:00"]
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Service ID and date are required"
}
~~~

### 7) Customer Complete Booking
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/:bookingId/complete
- Method: POST
- Description: Customer confirms completion.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Booking marked as completed"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Booking not found or not in progress"
}
~~~

### Beautician APIs

### 8) Today Bookings
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/today
- Method: GET
- Description: Today non-cancelled bookings.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "bookings": []
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 9) Broadcast Bookings
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/broadcast
- Method: GET
- Description: Pending broadcast booking offers.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "bookings": []
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 10) Upcoming Bookings
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/upcoming
- Method: GET
- Description: Upcoming accepted/assigned bookings.
- Headers: Authorization: Bearer <token>
- Query: page, limit
- Response:
~~~json
{
  "success": true,
  "bookings": [],
  "total": 5
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 11) Booking History
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/history
- Method: GET
- Description: Beautician booking history and earnings.
- Headers: Authorization: Bearer <token>
- Query: page, limit, month, year
- Response:
~~~json
{
  "success": true,
  "bookings": [],
  "total": 20,
  "totalEarnings": 15000
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 12) Beautician Booking Detail
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId
- Method: GET
- Description: Booking detail for assigned beautician. Includes customer contact info and add-ons.
- Headers: Authorization: Bearer <token>
- Response:
~~~json
{
  "success": true,
  "booking": {
    "_id": "...",
    "jobId": "A1B2C3-BK",
    "status": "Assigned",
    "addons": [
      { "addonName": "Aromatherapy Oil", "price": 250 }
    ],
    "address": {
      "street": "12 MG Road",
      "unit": "Apt 4B",
      "gateCode": "1234",
      "city": "Kochi"
    },
    "biometricVerification": {
      "startVerified": false,
      "completeVerified": false
    }
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Booking not found"
}
~~~

### 13) Accept Booking
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId/accept
- Method: PUT
- Description: Accept assigned/broadcast booking.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Booking accepted"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "This booking has already been accepted by another beautician"
}
~~~

### 14) Decline Booking
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId/decline
- Method: PUT
- Description: Decline assigned booking.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "reason": "Unavailable"
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Booking declined"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Booking not found or already processed"
}
~~~

### 15) On The Way
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId/on-the-way
- Method: PUT
- Description: Mark accepted booking as en route. Notifies customer.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Status updated to on the way"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Booking not found or not accepted"
}
~~~

### 16) Start Booking
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId/start
- Method: PUT
- Description: Mark booking in progress. Supports biometric verification token and professional notes. Accepts bookings in "Accepted" or "OnTheWay" status.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "biometricToken": "face_verify_token_abc",
  "professionalNotes": "Client has sensitive skin"
}
~~~
- Note: `biometricToken` and `professionalNotes` are optional. Token acts as client-side biometric confirmation.
- Response:
~~~json
{
  "success": true,
  "message": "Booking marked as in-progress",
  "biometricVerified": true
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Booking not found or not accepted"
}
~~~

### 17) Complete Booking
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/bookings/beautician/:bookingId/complete
- Method: PUT
- Description: Complete service, trigger payout metadata. Supports biometric verification. Returns jobId.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "notes": "Service completed",
  "biometricToken": "face_verify_token_xyz"
}
~~~
- Note: `biometricToken` is optional. Token acts as client-side biometric confirmation for completion.
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Booking not found or not in progress"
}
~~~

---

## Beautician APIs (/api/mobileapp/beautician) [Beautician only]

### 1) Get Profile
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/profile
- Method: GET
- Description: Beautician profile details including verification steps, professional title, and accepting status.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "beautician": {
    "fullName": "Riya",
    "professionalTitle": "Senior Hair Stylist",
    "skills": ["Facial"],
    "verificationStatus": "Approved",
    "isAcceptingBookings": true,
    "tier": "Premium",
    "verificationSteps": {
      "identityVerified": { "status": "completed", "timestamp": "2026-01-10T..." },
      "portfolioReview": { "status": "completed", "timestamp": "2026-01-12T..." },
      "finalApproval": { "status": "completed", "timestamp": "2026-01-15T..." }
    },
    "paymentMethods": [
      { "type": "bank_account", "label": "HDFC Bank", "isDefault": true }
    ]
  }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 2) Update Profile
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/profile
- Method: PUT
- Description: Update profile and optional profile image.
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: multipart/form-data or application/json
- Request Body:
~~~json
{
  "name": "Riya P",
  "experience": 4,
  "skills": ["Facial", "Makeup"],
  "bio": "Certified stylist",
  "professionalTitle": "Senior Hair Stylist",
  "location": {
    "coordinates": { "lat": 9.9312, "lng": 76.2673 },
    "address": "Infopark, Kochi"
  }
}
~~~
- Multipart field: profileImage (file)
- Note: `professionalTitle` and `location` are optional fields.
- Response:
~~~json
{
  "success": true,
  "message": "Profile updated successfully",
  "beautician": {}
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 3) Get Availability
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/availability
- Method: GET
- Description: Working days/hours/break and generated slots.
- Headers: Authorization: Bearer <token>
- Response:
~~~json
{
  "success": true,
  "availability": {
    "workingDays": ["Monday", "Tuesday"],
    "workingHours": { "start": "09:00", "end": "18:00" },
    "timeSlots": ["09:00", "10:00"]
  }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 4) Update Availability
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/availability
- Method: PUT
- Description: Update working days/hours/break.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "workingDays": ["Monday", "Tuesday", "Wednesday"],
  "workingHours": { "start": "10:00", "end": "19:00" },
  "breakTime": { "start": "13:00", "end": "14:00" }
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Availability updated successfully"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 5) Add Unavailable Date
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/availability/add-unavailable
- Method: POST
- Description: Add blocked date.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "date": "2026-04-20",
  "reason": "Leave",
  "isRecurring": false
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Unavailable date added"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Date is required"
}
~~~

### 6) Remove Unavailable Date
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/availability/unavailable/:id
- Method: DELETE
- Description: Remove blocked date.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Unavailable date removed"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Availability not found"
}
~~~

### 7) Get Services
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/services
- Method: GET
- Description: List active services beautician can offer.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "services": [
    {
      "serviceId": "...",
      "name": "Facial",
      "price": 999,
      "duration": 60
    }
  ]
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 8) Update Service Preference
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/services/:serviceId
- Method: PUT
- Description: Update service preference placeholder.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "price": 1099,
  "duration": 75
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Service preferences noted. Admin controls base pricing."
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Service not found"
}
~~~

### 9) Dashboard Stats
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/dashboard-stats
- Method: GET
- Description: Today/upcoming counts and earnings summary.
- Headers: Authorization: Bearer <token>
- Response:
~~~json
{
  "success": true,
  "stats": {
    "todayBookings": 3,
    "upcomingBookings": 4,
    "completedToday": 2,
    "earnings": { "today": 1200, "week": 7000, "month": 23000 },
    "rating": 4.7
  }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 10) Earnings
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/earnings
- Method: GET
- Description: Earnings list with total and breakdown.
- Headers: Authorization: Bearer <token>
- Query: startDate, endDate
- Response:
~~~json
{
  "success": true,
  "earnings": [],
  "total": 12500,
  "breakdown": {
    "serviceCharges": 12500,
    "tips": 0,
    "bonuses": 0
  }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 11) Home Dashboard
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/home
- Method: GET
- Description: Beautician home screen data — upcoming booking, weekly earnings, work eligibility.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "dashboard": {
    "beautician": {
      "fullName": "Riya",
      "profileImage": "/uploads/riya.jpg",
      "isAcceptingBookings": true,
      "verificationStatus": "Approved",
      "location": {}
    },
    "upcomingBooking": {
      "_id": "...",
      "bookingDate": "2026-04-08T...",
      "status": "Accepted",
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 12) Upload Profile Image
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/profile/upload-image
- Method: POST
- Description: Upload or update beautician profile image.
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: multipart/form-data
- Request Body (form-data):
  - profileImage: file
- Response:
~~~json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "profileImage": "/uploads/1712345678901.jpg"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "No image file provided"
}
~~~

### 13) Get Verification Status
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/verification-status
- Method: GET
- Description: Get multi-step verification status (identity, portfolio, final approval).
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "verificationStatus": "Pending",
  "steps": {
    "identityVerified": { "status": "completed", "timestamp": "2026-01-10T..." },
    "portfolioReview": { "status": "in_progress" },
    "finalApproval": { "status": "pending" }
  },
  "isProfileLive": false,
  "estimatedReviewTime": "24-48 hours"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 14) Toggle Accepting Bookings
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/toggle-accepting
- Method: PUT
- Description: Toggle whether beautician is accepting new bookings (online/offline toggle).
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "isAccepting": true
}
~~~
- Note: If `isAccepting` is omitted, it toggles the current value.
- Response:
~~~json
{
  "success": true,
  "message": "Now accepting bookings",
  "isAcceptingBookings": true
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 15) Get Work Eligibility
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/work-eligibility
- Method: GET
- Description: Check if wallet balance meets minimum required to accept bookings.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
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
- Error Response (low balance):
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

### 16) Toggle Slot Availability
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/availability/toggle-slot
- Method: PUT
- Description: Block or unblock a specific time slot on a specific date.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "date": "2026-04-10",
  "time": "14:00",
  "isAvailable": false
}
~~~
- Note: `isAvailable: false` blocks the slot, `isAvailable: true` unblocks it.
- Response:
~~~json
{
  "success": true,
  "message": "Slot blocked successfully"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Date and time are required"
}
~~~

### 17) Get Documents
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/documents
- Method: GET
- Description: List all uploaded certificates/documents.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
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
      "uploadedAt": "2026-01-05T..."
    }
  ]
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 18) Add Document
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/documents
- Method: POST
- Description: Upload a certificate or verification document.
- Headers:
  - Authorization: Bearer <token>
  - Content-Type: multipart/form-data
- Request Body (form-data):
  - document: file
  - documentType: string (example: certificate, id_proof, license)
  - documentName: string (optional, defaults to filename)
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "No document file provided"
}
~~~

### 19) Delete Document
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/documents/:documentId
- Method: DELETE
- Description: Delete an uploaded document.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Document deleted successfully"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Document not found"
}
~~~

### 20) Get Payment Methods
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/payment-methods
- Method: GET
- Description: List beautician's saved payment/payout methods.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
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
        "ifscCode": "HDFC0001234"
      },
      "isDefault": true
    },
    {
      "_id": "...",
      "type": "upi",
      "label": "UPI",
      "details": {
        "upiId": "riya@upi"
      },
      "isDefault": false
    }
  ]
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 21) Add Payment Method
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/payment-methods
- Method: POST
- Description: Add a payout method (bank account, UPI, PayPal).
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "type": "bank_account",
  "label": "HDFC Savings",
  "details": {
    "accountNumber": "1234567890",
    "ifscCode": "HDFC0001234",
    "accountHolder": "Riya P"
  },
  "isDefault": true
}
~~~
- Note: First payment method is auto-set as default. If `isDefault: true`, other methods are unset.
- Response:
~~~json
{
  "success": true,
  "message": "Payment method added",
  "paymentMethod": {
    "_id": "...",
    "type": "bank_account",
    "label": "HDFC Savings",
    "isDefault": true
  }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Payment method type and details are required"
}
~~~

### 22) Delete Payment Method
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/payment-methods/:methodId
- Method: DELETE
- Description: Delete a saved payment method.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Payment method deleted"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Payment method not found"
}
~~~

### 23) Get Clients
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/clients
- Method: GET
- Description: List unique customers from completed bookings with stats.
- Headers: Authorization: Bearer <token>
- Query: page, limit
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 24) Get Schedule By Date
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/beautician/schedule
- Method: GET
- Description: Get all bookings for a specific date.
- Headers: Authorization: Bearer <token>
- Query: date (required, format: YYYY-MM-DD)
- Request Body: N/A
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Date parameter is required"
}
~~~

---

## Reviews APIs (/api/mobileapp/reviews)


### 2) Beautician Reviews (Public)
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/reviews/beautician/:beauticianId
- Method: GET
- Description: Get approved public reviews of a beautician.
- Headers: N/A
- Query: page, limit, sortBy
- Response:
~~~json
{
  "success": true,
  "reviews": [],
  "averageRating": 4.6,
  "totalReviews": 40,
  "ratingDistribution": { "1": 1, "2": 2, "3": 4, "4": 10, "5": 23 }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 3) Service Reviews (Public)
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/reviews/service/:serviceId
- Method: GET
- Description: Get approved reviews linked to bookings containing the service.
- Headers: N/A
- Query: page, limit
- Response:
~~~json
{
  "success": true,
  "reviews": [],
  "averageRating": 4.3,
  "totalReviews": 18
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 4) My Reviews
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/reviews/my-reviews
- Method: GET
- Description: Get reviews created by current customer.
- Headers: Authorization: Bearer <token>
- Response:
~~~json
{
  "success": true,
  "reviews": []
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 5) Update Review
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/reviews/:reviewId
- Method: PUT
- Description: Update rating/comment; approval resets to Pending.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "rating": 4,
  "reviewText": "Updated review"
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Review updated successfully",
  "review": { "_id": "...", "adminApproval": "Pending" }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Review not found"
}
~~~

### 6) Delete Review
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/reviews/:reviewId
- Method: DELETE
- Description: Delete own review.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Review deleted successfully"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Review not found"
}
~~~

---

## Payment APIs (/api/mobileapp/payment)

### 1) Webhook
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/payment/webhook
- Method: POST
- Description: Gateway webhook callback endpoint.
- Headers: gateway-defined
- Request Body: gateway event payload
- Response:
~~~json
{
  "success": true,
  "message": "Webhook received"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 2) Get Wallet
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/payment/wallet
- Method: GET
- Description: Get balance/points/currency. For beauticians, also returns work eligibility.
- Headers: Authorization: Bearer <token>
- Response:
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
- Note: `workEligibility` is only included for Beautician role.
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 3) Add Wallet Money
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/payment/wallet/add
- Method: POST
- Description: Add amount to wallet.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "amount": 500,
  "paymentMethod": "UPI"
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Amount added to wallet",
  "transactionId": "TXN_ABC123",
  "paymentUrl": null
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Valid amount is required"
}
~~~

### 4) Use Points
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/payment/wallet/use-points
- Method: POST
- Description: Redeem points.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "points": 100
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Points redeemed successfully",
  "discountAmount": 100,
  "remainingPoints": 20
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Insufficient points"
}
~~~

### 5) Transactions
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/payment/transactions
- Method: GET
- Description: Wallet transactions list. Supports period filter for weekly/monthly grouping.
- Headers: Authorization: Bearer <token>
- Query: page, limit, type, period (weekly|monthly)
- Response:
~~~json
{
  "success": true,
  "transactions": [],
  "total": 14
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 6) Pay Booking
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/payment/booking/:bookingId/pay
- Method: POST
- Description: Pay booking (wallet and/or payment method).
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "paymentMethod": "wallet",
  "walletAmount": 500
}
~~~
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Insufficient wallet balance"
}
~~~

### 7) Booking Receipt
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/payment/booking/:bookingId/receipt
- Method: GET
- Description: Receipt for booking payment.
- Headers: Authorization: Bearer <token>
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Booking not found"
}
~~~

### 8) Beautician Earnings Summary
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/payment/earnings
- Method: GET
- Description: Beautician payout/earnings summary.
- Headers: Authorization: Bearer <token>
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

---

## Notification APIs (/api/mobileapp/notifications)

### 1) Get Notifications
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/notifications
- Method: GET
- Description: Paginated notifications list.
- Headers: Authorization: Bearer <token>
- Query: page, limit, type
- Response:
~~~json
{
  "success": true,
  "notifications": [],
  "unreadCount": 5
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 2) Mark Notification Read
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/notifications/:notificationId/read
- Method: PUT
- Description: Mark one notification as read.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Notification marked as read"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Notification not found"
}
~~~

### 3) Mark All Read
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/notifications/read-all
- Method: PUT
- Description: Mark all unread notifications as read.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "All notifications marked as read"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 4) Register Device
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/notifications/register-device
- Method: POST
- Description: Register FCM/APNS token.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "deviceToken": "fcm_token_here",
  "deviceType": "android"
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Device registered for notifications"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Device token and type are required"
}
~~~

### 5) Unregister Device
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/notifications/unregister-device
- Method: DELETE
- Description: Remove device tokens for user.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "message": "Device unregistered from notifications"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 6) Get Notification Settings
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/notifications/settings
- Method: GET
- Description: Get notification preference flags.
- Headers: Authorization: Bearer <token>
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 7) Update Notification Settings
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/notifications/settings
- Method: PUT
- Description: Update notification preferences.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "bookingUpdates": true,
  "promotional": false,
  "reminders": true
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Notification settings updated"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

---

## Location APIs (/api/mobileapp/location)

### 1) Nearby Beauticians
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/location/beauticians-nearby
- Method: GET
- Description: Get nearby active verified beauticians.
- Headers: N/A
- Query: latitude, longitude, serviceId(optional), radius(optional)
- Response:
~~~json
{
  "success": true,
  "beauticians": [
    {
      "_id": "...",
      "name": "Riya",
      "distance": 2.4,
      "rating": 4.7
    }
  ]
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Latitude and longitude are required"
}
~~~

### 2) Service Availability
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/location/service-availability
- Method: GET
- Description: Find nearest beautician and ETA.
- Headers: N/A
- Query: latitude, longitude, serviceId, date(optional), time(optional)
- Response:
~~~json
{
  "success": true,
  "available": true,
  "nearestBeautician": {
    "_id": "...",
    "name": "Riya",
    "distance": 1.9,
    "rating": 4.8
  },
  "estimatedArrival": "14 minutes"
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Latitude, longitude, and serviceId are required"
}
~~~

### 3) Calculate Distance
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/location/calculate-distance
- Method: POST
- Description: Calculate distance, ETA, estimated cost.
- Headers: Content-Type: application/json
- Request Body:
~~~json
{
  "origin": { "lat": 9.9312, "lng": 76.2673 },
  "destination": { "lat": 9.9500, "lng": 76.3000 }
}
~~~
- Response:
~~~json
{
  "success": true,
  "distance": 4.2,
  "duration": "12 minutes",
  "estimatedCost": 42
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Origin and destination coordinates are required"
}
~~~

### 4) Service Areas
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/location/areas
- Method: GET
- Description: List available service areas.
- Headers: N/A
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "areas": [
    {
      "name": "Kochi",
      "pincode": "682001",
      "serviceAvailable": true
    }
  ]
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

---

## Cosmetics APIs (/api/mobileapp/cosmetics) [Beautician only]

### 1) Get Cosmetic Items
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/items
- Method: GET
- Description: Browse active, in-stock cosmetic catalog.
- Headers: Authorization: Bearer <token>
- Query: page, limit, category, search
- Response:
~~~json
{
  "success": true,
  "items": [],
  "total": 30,
  "categories": ["Skincare", "Haircare"]
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
~~~

### 2) Get Cosmetic Item Detail
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/items/:itemId
- Method: GET
- Description: Get single item detail.
- Headers: Authorization: Bearer <token>
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Item not found"
}
~~~

### 3) Place Cosmetic Order
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/orders
- Method: POST
- Description: Place order and deduct from wallet.
- Headers: Authorization: Bearer <token>
- Request Body:
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
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "required": 1497,
  "available": 500
}
~~~

### 4) Get My Cosmetic Orders
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/orders
- Method: GET
- Description: List own cosmetic orders.
- Headers: Authorization: Bearer <token>
- Query: page, limit, status
- Response:
~~~json
{
  "success": true,
  "orders": [],
  "total": 5
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Beautician profile not found"
}
~~~

### 5) Get Cosmetic Order Detail
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/orders/:orderId
- Method: GET
- Description: Get one order detail.
- Headers: Authorization: Bearer <token>
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Order not found"
}
~~~

### 6) Cancel Cosmetic Order
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/cosmetics/orders/:orderId/cancel
- Method: PUT
- Description: Cancel pending order, refund wallet, restore stock.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "reason": "Ordered by mistake"
}
~~~
- Response:
~~~json
{
  "success": true,
  "message": "Order cancelled and refunded",
  "refundAmount": 1497
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Order not found or cannot be cancelled"
}
~~~

---

## Complaint APIs (/api/mobileapp/complaints)

### 1) Create Complaint
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/complaints/create
- Method: POST
- Description: Submit a complaint. Notifies admin.
- Headers: Authorization: Bearer <token>
- Request Body:
~~~json
{
  "subject": "Late arrival",
  "description": "The beautician arrived 30 minutes late for my booking.",
  "category": "Service",
  "bookingId": "6653..."
}
~~~
- Note: `category` defaults to "Other" if omitted. `bookingId` is optional.
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Subject and description are required"
}
~~~

### 2) Get My Complaints
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/complaints/my-complaints
- Method: GET
- Description: List complaints submitted by current user with pagination.
- Headers: Authorization: Bearer <token>
- Query: status, page, limit
- Response:
~~~json
{
  "success": true,
  "complaints": [
    {
      "_id": "...",
      "subject": "Late arrival",
      "status": "Open",
      "category": "Service",
      "booking": {
        "bookingDate": "2026-04-05T...",
        "status": "Completed"
      },
      "createdAt": "2026-04-08T..."
    }
  ],
  "total": 3,
  "currentPage": 1,
  "totalPages": 1
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

### 3) Get Complaint By ID
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/complaints/:complaintId
- Method: GET
- Description: Get complaint detail.
- Headers: Authorization: Bearer <token>
- Request Body: N/A
- Response:
~~~json
{
  "success": true,
  "complaint": {
    "_id": "...",
    "subject": "Late arrival",
    "description": "The beautician arrived 30 minutes late for my booking.",
    "status": "Open",
    "category": "Service",
    "booking": {
      "bookingDate": "2026-04-05T...",
      "status": "Completed",
      "beautician": "..."
    },
    "createdAt": "2026-04-08T..."
  }
}
~~~
- Error Response:
~~~json
{
  "success": false,
  "message": "Complaint not found"
}
~~~


---

## Curated Services APIs (/api/mobileapp/curated-services)

### 1) Get All Curated Services
- Endpoint URL: https://sidi.mobilegear.co.in/api/mobileapp/curated-services
- Method: GET
- Description: List all curated services with images, category, and details.
- Headers: N/A
- Query: categoryId (optional), search (optional)
- Response:
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
- Error Response:
~~~json
{
  "success": false,
  "message": "Server error"
}
~~~

---

## 4. File Upload

Supported file types:
- jpeg, jpg, png, gif, webp, pdf
- Max file size: 5MB

Upload endpoints:
- PUT /api/mobileapp/user/profile
  - form-data key: profileImage
- PUT /api/mobileapp/beautician/profile
  - form-data key: profileImage
- POST /api/mobileapp/beautician/profile/upload-image
  - form-data key: profileImage
- POST /api/mobileapp/beautician/documents
  - form-data key: document (single file)
  - optional keys: documentType, documentName
- POST /api/mobileapp/auth/beautician/upload-documents
  - form-data key: documents (multiple, max 5)
  - optional key: documentType

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

## 5. Common Response Format

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

## 6. Important Notes (Real World)
- Send Authorization header for all protected routes.
- Common mistakes:
  - Wrong base URL (must use https://sidi.mobilegear.co.in)
  - Missing Bearer token
  - Sending JSON for multipart endpoints
  - Wrong role token (Customer token on Beautician routes)
- Handle these statuses in app:
  - 400 validation/business rule errors
  - 401 invalid/expired token
  - 403 deactivated/suspended/forbidden role
  - 404 not found
  - 500 server error
- Set client timeout and retry policy for unstable network.

Recommended timeout:
- Connect timeout: 15s
- Receive timeout: 20s

## 7. Quick Start for Flutter Developer

### Option A: Dio setup
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

### Login request (Dio)
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

### Authenticated request (Dio)
~~~dart
final profileRes = await dio.get('/api/mobileapp/user/profile');
print(profileRes.data);
~~~

### Option B: http package
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

## 8. Health Check API
- Endpoint URL: https://sidi.mobilegear.co.in/api/ping
- Full URL: https://sidi.mobilegear.co.in/api/ping
- Method: GET
- Description: Server heartbeat endpoint.

Response:
~~~json
{
  "message": "Salon server is running 🚀"
}
~~~
