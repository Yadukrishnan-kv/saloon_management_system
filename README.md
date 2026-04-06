# SalonPro - Complete Salon Management System

A full-stack **Salon Management System** built with the MERN stack (MongoDB, Express.js, React.js, Node.js). The platform includes a **web-based admin panel** and **mobile app backend APIs** for Customer and Beautician apps (React Native / Flutter).

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
  - [Web Admin Panel](#web-admin-panel-features)
  - [Mobile App APIs](#mobile-app-api-features)
- [Database Models](#database-models)
- [API Documentation](#api-documentation)
  - [Web Admin APIs](#web-admin-apis)
  - [Mobile App APIs](#mobile-app-apis)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [User Roles](#user-roles)
- [Booking Lifecycle](#booking-lifecycle)

---

## Overview

SalonPro provides an end-to-end solution for salon businesses:

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Web Admin Panel** | React.js (CRA) | Admin/SuperAdmin management dashboard |
| **Backend Server** | Node.js + Express.js | REST API for web and mobile clients |
| **Database** | MongoDB + Mongoose | Data persistence |
| **Mobile APIs** | Express.js routes (prefixed `mobileapp`) | Backend for React Native / Flutter apps |

---

## Tech Stack

### Frontend (Client)

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI framework |
| React Router DOM | 6.26.1 | Client-side routing |
| Axios | 1.7.5 | HTTP client |
| React Icons | 5.3.0 | Icon library (Feather icons) |
| React Hot Toast | 2.4.1 | Toast notifications |

### Backend (Server)

| Package | Version | Purpose |
|---------|---------|---------|
| Express | 4.21.0 | Web framework |
| Mongoose | 8.6.0 | MongoDB ODM |
| JSON Web Token | 9.0.2 | Authentication |
| bcryptjs | 2.4.3 | Password hashing |
| Multer | 1.4.5 | File uploads |
| Nodemailer | 6.9.14 | Email sending |
| Helmet | 7.1.0 | Security headers |
| CORS | 2.8.5 | Cross-origin support |
| Express Rate Limit | 7.4.0 | API rate limiting |
| Validator | 13.12.0 | Input validation |

---

## Project Structure

```
Saloon_Mern/
├── Client/                              # React Web Admin Panel
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx                      # Main routing configuration
│   │   ├── DOM.jsx                      # Root component wrapper
│   │   ├── index.js                     # Entry point
│   │   ├── index.css                    # Global styles
│   │   ├── components/
│   │   │   ├── beautician/
│   │   │   │   ├── BeauticianCard/      # Beautician profile card
│   │   │   │   └── ServiceList/         # Service listing component
│   │   │   ├── common/
│   │   │   │   ├── Button/              # Reusable button
│   │   │   │   ├── Card/               # Dashboard card widget
│   │   │   │   ├── Input/              # Form input component
│   │   │   │   ├── Loading/            # Loading spinner
│   │   │   │   ├── Modal/              # Modal dialog
│   │   │   │   └── Table/              # Data table
│   │   │   └── layout/
│   │   │       ├── Header/             # App header with user menu
│   │   │       ├── ProtectedRoute/     # Role-based route guard
│   │   │       └── Sidebar/            # Navigation sidebar
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Authentication state
│   │   │   └── BookingContext.jsx       # Booking flow state
│   │   ├── hooks/
│   │   │   ├── useAuth.js              # Auth context hook
│   │   │   └── useFetch.js             # Data fetching hook
│   │   ├── pages/
│   │   │   ├── Admin/
│   │   │   │   ├── Dashboard/           # Admin dashboard with metrics
│   │   │   │   ├── UserManagement/      # User CRUD (UserList, CreateUser)
│   │   │   │   ├── BeauticianManagement/# Add, list, verify beauticians
│   │   │   │   ├── BookingManagement/   # View and manage all bookings
│   │   │   │   ├── ContentManagement/   # Categories, pricing, banners
│   │   │   │   ├── ReviewManagement/    # Admin review approval/rejection
│   │   │   │   ├── CosmeticManagement/  # Cosmetic items & order management
│   │   │   │   ├── PayoutManagement/    # Beautician payout processing
│   │   │   │   ├── AdminNotifications/  # In-app admin notifications
│   │   │   │   └── Reports/            # Revenue reports, complaints
│   │   │   ├── Auth/
│   │   │   │   ├── Login/              # Login page
│   │   │   │   └── Register/           # Customer registration
│   │   │   ├── Beautician/
│   │   │   │   ├── BeauticianDashboard/ # Beautician home
│   │   │   │   ├── MySchedule/         # Schedule management
│   │   │   │   ├── ServiceRequests/    # Accept/decline bookings
│   │   │   │   └── Earnings/           # Earnings overview
│   │   │   └── Customer/
│   │   │       ├── CustomerDashboard/   # Customer home
│   │   │       ├── BrowseServices/     # Browse service catalog
│   │   │       ├── BookService/        # Multi-step booking wizard
│   │   │       ├── MyBookings/         # Booking history
│   │   │       └── Profile/            # Profile management
│   │   └── utils/
│   │       ├── api.js                   # Axios instance with interceptors
│   │       ├── constants.js             # App-wide constants & enums
│   │       └── helpers.js              # Formatting utilities
│   └── package.json
│
├── Server/                              # Node.js Backend
│   ├── server.js                        # Express app entry point
│   ├── config/
│   │   ├── db.js                        # MongoDB connection
│   │   └── seedAdmin.js                 # Auto-seed SuperAdmin user
│   ├── middleware/
│   │   ├── authMiddleware.js            # Web panel JWT auth
│   │   └── uploadMiddleware.js          # Multer file upload config
│   ├── models/
│   │   ├── User.js                      # User accounts (all roles)
│   │   ├── Beautician.js               # Beautician profiles
│   │   ├── Service.js                   # Salon services
│   │   ├── ServiceCategory.js           # Service categories
│   │   ├── Booking.js                   # Booking records
│   │   ├── Review.js                    # Customer reviews
│   │   ├── Banner.js                    # Promotional banners
│   │   ├── Complaint.js                 # Customer complaints
│   │   ├── OTP.js                       # OTP verification (mobile)
│   │   ├── Notification.js              # Push notifications (mobile)
│   │   ├── Wallet.js                    # Payment wallet (mobile)
│   │   ├── Availability.js             # Beautician availability (mobile)
│   │   ├── CosmeticItem.js             # Cosmetic product catalog
│   │   └── CosmeticOrder.js            # Beautician cosmetic orders
│   ├── controllers/
│   │   ├── authController.js            # Web auth (login/register/reset)
│   │   ├── userController.js            # Web user management
│   │   ├── beauticianController.js      # Web beautician management
│   │   ├── serviceController.js         # Web service CRUD
│   │   ├── bookingController.js         # Web booking management
│   │   ├── contentController.js         # Web content (banners, categories)
│   │   ├── dashboardController.js       # Web dashboard metrics
│   │   ├── mobileappAuthController.js           # Mobile auth + OTP
│   │   ├── mobileappUserController.js           # Mobile customer profile
│   │   ├── mobileappServiceController.js        # Mobile service browsing
│   │   ├── mobileappBookingController.js        # Mobile booking lifecycle
│   │   ├── mobileappBeauticianController.js     # Mobile beautician features
│   │   ├── mobileappReviewController.js         # Mobile reviews & ratings
│   │   ├── mobileappPaymentController.js        # Mobile wallet & payments
│   │   ├── mobileappNotificationController.js   # Mobile push notifications
│   │   ├── mobileappLocationController.js       # Mobile geolocation
│   │   ├── mobileappCosmeticController.js       # Mobile cosmetic ordering
│   │   └── adminExtendedController.js           # Admin reviews, cosmetics, payouts, notifications
│   ├── routes/
│   │   ├── authRoutes.js                # /api/auth/*
│   │   ├── userRoutes.js                # /api/users/*
│   │   ├── beauticianRoutes.js          # /api/beauticians/*
│   │   ├── serviceRoutes.js             # /api/services/*
│   │   ├── bookingRoutes.js             # /api/bookings/*
│   │   ├── contentRoutes.js             # /api/content/*
│   │   ├── dashboardRoutes.js           # /api/dashboard/*
│   │   ├── mobileappAuthRoutes.js               # /api/mobileapp/auth/*
│   │   ├── mobileappUserRoutes.js               # /api/mobileapp/user/*
│   │   ├── mobileappServiceRoutes.js            # /api/mobileapp/services/*
│   │   ├── mobileappBookingRoutes.js            # /api/mobileapp/bookings/*
│   │   ├── mobileappBeauticianRoutes.js         # /api/mobileapp/beautician/*
│   │   ├── mobileappReviewRoutes.js             # /api/mobileapp/reviews/*
│   │   ├── mobileappPaymentRoutes.js            # /api/mobileapp/payment/*
│   │   ├── mobileappNotificationRoutes.js       # /api/mobileapp/notifications/*
│   │   ├── mobileappLocationRoutes.js           # /api/mobileapp/location/*
│   │   ├── mobileappCosmeticRoutes.js           # /api/mobileapp/cosmetics/*
│   │   └── adminExtendedRoutes.js               # /api/admin/* (reviews, cosmetics, payouts)
│   ├── utils/
│   │   ├── emailSender.js              # Nodemailer email utility
│   │   ├── validators.js               # Shared input validators
│   │   ├── tokenHelper.js              # JWT token generation helpers
│   │   ├── otpGenerator.js             # Cryptographic OTP generation
│   │   ├── smsSender.js                # SMS sending (Twilio-ready)
│   │   ├── pushNotification.js         # FCM push notifications
│   │   └── geolocation.js             # Haversine distance calculations
│   └── package.json
│
└── README.md
```

---

## Features

### Web Admin Panel Features

#### Authentication
- Email & password login
- JWT token with refresh token rotation
- Auto token refresh via Axios interceptor
- Role-based redirect after login

#### Admin Dashboard
- Key metrics: total customers, beauticians, bookings, revenue
- Recent activity feed
- Quick stats with trend indicators

#### User Management
- List all users with pagination
- Create new users (Admin, Customer, Beautician)
- Activate/deactivate/suspend accounts

#### Beautician Management
- Add new beauticians with skills, experience, documents
- View and manage beautician list
- Verification workflow (Pending → Approved/Rejected)
- Document verification

#### Service & Content Management
- CRUD operations for service categories
- Service pricing configuration (fixed, hourly, package)
- Promotional banner management
- Discount management

#### Booking Management
- View all bookings across the system
- Filter by status, date, beautician
- Assign beauticians to bookings
- Reassign beauticians
- Track booking lifecycle

#### Reports
- Revenue reports with date filtering
- Complaint management and resolution

#### Review Moderation (NEW)
- Admin-approved star ratings — all new reviews go to "Pending" status
- Approve or reject reviews before they become visible
- Reject/delete negative reviews with reason
- Only approved reviews affect beautician ratings
- Filter reviews by status (Pending, Approved, Rejected)

#### Cosmetic Management (NEW)
- CRUD cosmetic item catalog (name, category, brand, price, stock)
- View and manage beautician cosmetic orders
- Update order status (Confirmed → Shipped → Delivered)
- Cancel orders with automatic wallet refund and stock restoration
- Image upload for cosmetic items

#### Payout Management (NEW)
- View all pending beautician payouts
- Platform collects payment — beautician payout after 4 days
- ₹200 platform commission per booking
- Process individual payouts (credits beautician wallet)
- Track overdue payouts
- Total pending amount overview

#### Admin In-App Notifications (NEW)
- Real-time notification center with unread count
- Auto-notifications for: new bookings, completed bookings, new reviews, cosmetic orders, payouts due
- Mark individual or all notifications as read
- Filter by notification type (booking, payment, review, payout, cosmetic_order)

#### Customer Web Portal
- Browse salon service catalog
- Multi-step booking wizard
- Booking history with status tracking
- Profile management

#### Beautician Web Portal
- Dashboard with today's stats
- Schedule and availability management
- Accept/decline service requests
- Earnings overview

---

### Mobile App API Features

#### 1. Authentication (OTP-based)
- Customer registration with email + phone OTP verification
- Beautician registration with admin approval workflow
- Phone/email dual-channel OTP delivery
- Document upload for beautician verification
- **PCC (Police Clearance Certificate) upload on beautician registration** (NEW)
- Separate login flows for customers and beauticians

#### 2. Customer Profile Management
- Profile CRUD with image upload
- Password change
- Multiple saved addresses with lat/lng coordinates
- Default address management
- Booking history with pagination

#### 3. Service Browsing
- Browse categories with service counts
- Search services by name, description, tags
- Filter by category, price range
- Sort by price, popularity, duration
- View popular services and active offers
- Discounted services and promotional banners

#### 4. Booking Management
- Create bookings with service, date, time, location
- Choose beautician or auto-assign
- **Multi-beautician broadcast**: When no beautician selected, booking is sent to 3-4 nearby beauticians simultaneously — first to accept wins (NEW)
- **Advance booking only**: Bookings must be for next day or later — no same-day bookings (NEW)
- **11 PM booking restriction**: No bookings accepted after 11:00 PM (NEW)
- **5 km area restriction**: Beautician must be within 5 km of service location (NEW)
- **30-minute buffer**: Ensures 30-min gap between beautician's tasks (NEW)
- Location types: home, office, salon
- View available time slots (respects beautician schedule + buffer)
- **₹200 cancellation fee**: Deducted from customer wallet on cancellation (NEW)
- Cancel bookings with refund minus cancellation fee
- Reschedule bookings
- Customer confirms service completion
- **Platform payment collection**: Sidi collects payment, pays beautician in 4 days with ₹200 commission deducted (NEW)
- Full beautician booking lifecycle:
  - View today's bookings
  - View upcoming bookings
  - **View broadcast booking requests** — accept from available pool (NEW)
  - Accept/decline assigned bookings (with 30-min buffer check)
  - Mark bookings as in-progress
  - Complete bookings with earnings tracking + platform commission deduction
  - Booking history with earnings aggregation

#### 5. Beautician Features
- Profile management with skills, bio, experience
- Availability management (working days, hours, breaks)
- Block unavailable dates
- Dashboard stats (today, upcoming, earnings)
- Earnings breakdown with date filtering
- **₹1,000 initial wallet balance** on registration (NEW)
- **₹200 commission deducted per completed booking** from wallet (NEW)
- **Beautician wallet with transaction history** — track commission deductions, payouts, cosmetic purchases (NEW)
- **Classic/Premium tier system** for users and beauticians (NEW)

#### 6. Reviews & Ratings
- Submit reviews for completed bookings (1-5 stars)
- **Admin-approved reviews**: All reviews go to "Pending" — admin must approve before visible (NEW)
- **Only approved reviews affect beautician ratings** (NEW)
- Rating distribution (1★ to 5★ counts)
- Average rating auto-calculation (on admin approval)
- Service reviews and beautician reviews
- Edit reviews (resets approval status to Pending)
- Delete own reviews
- Beautician rating auto-updates on review approval/deletion

#### 7. Wallet & Payments
- Wallet balance and points tracking
- Add money to wallet
- Redeem points for discounts (1 point = ₹1)
- Pay for bookings (wallet + other payment methods)
- Transaction history with pagination
- Payment receipts
- Points reward on payments (1% cashback)
- Payment gateway webhook endpoint
- **Beautician earnings summary** with pending payouts, commission paid, next payout date (NEW)
- **Platform payment flow**: Platform collects → ₹200 commission → beautician payout in 4 days (NEW)

#### 8. Push Notifications
- Notification list with pagination and unread count
- Mark as read (single and bulk)
- Device token registration (iOS/Android)
- Notification settings (booking updates, promotional, reminders)
- Auto-notifications for:
  - Booking assigned to beautician
  - Booking accepted/declined
  - Service started/completed
  - Booking cancelled

#### 9. Geolocation Services
- Find nearby beauticians by coordinates + radius
- Check service availability at a location
- Calculate distance between two points (Haversine formula)
- Estimate travel duration
- List active service areas

#### 10. Cosmetic Item Ordering (NEW)
- Browse cosmetic product catalog with search and category filter
- View item details (name, brand, price, stock)
- Place cosmetic orders (multiple items) — deducted from beautician wallet
- View order history with status tracking
- Cancel pending orders with automatic wallet refund
- Stock management — auto-deduct on order, restore on cancellation

---

## Database Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| **User** | All user accounts | username, email, password, role, **tier (Classic/Premium)**, phoneNumber, addresses[], deviceTokens[], notificationSettings |
| **Beautician** | Beautician profiles linked to User | user (ref), fullName, skills[], experience, documents[], **pccDocument**, **tier**, rating, availability[], location, earnings, **commissionPerBooking (₹200)** |
| **Service** | Salon services | name, category (ref), price, pricingType, duration, discount, tags[] |
| **ServiceCategory** | Service groupings | name, image, isActive, sortOrder |
| **Booking** | Service bookings | customer (ref), beautician (ref), services[], bookingDate, timeSlot, status, amounts, address, **broadcastedTo[]**, **platformPayment**, **cancellationFee** |
| **Review** | Customer reviews | customer (ref), beautician (ref), booking (ref), rating (1-5), comment, **adminApproval (Pending/Approved/Rejected)**, **adminApprovedBy**, **adminRejectionReason** |
| **Banner** | Promotional banners | title, image, link, isActive, startDate, endDate |
| **Complaint** | Customer complaints | Customer complaints with status tracking |
| **OTP** | Mobile OTP verification | user (ref), otp, type (email/phone), purpose, expiresAt, attempts, maxAttempts |
| **Notification** | Push notification records | user (ref), title, message, type, isRead, **forAdmin**, data |
| **Wallet** | User wallet with transactions | user (ref), balance, points, currency, transactions[], **initialBalanceLoaded** |
| **Availability** | Beautician schedule config | beautician (ref), workingDays[], workingHours, breakTime, unavailableDates[] |
| **CosmeticItem** | Cosmetic product catalog (NEW) | name, description, category, brand, price, image, inStock, stockQuantity, isActive |
| **CosmeticOrder** | Beautician cosmetic orders (NEW) | beautician (ref), user (ref), items[], totalAmount, status, shippingAddress, timestamps |

---

## API Documentation

### Web Admin APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/refresh-token` | No | Refresh JWT |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Reset password |
| GET | `/api/users` | Admin | List users |
| GET | `/api/beauticians` | Admin | List beauticians |
| GET | `/api/bookings` | Yes | List bookings |
| POST | `/api/bookings` | Customer | Create booking |
| GET | `/api/dashboard/metrics` | Admin | Dashboard metrics |
| GET | `/api/dashboard/activity` | Admin | Recent activity |

### Admin Extended APIs — `/api/admin` (NEW)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reviews/pending` | Admin | Pending reviews for approval |
| GET | `/reviews` | Admin | All reviews (filter by status) |
| PUT | `/reviews/:reviewId/approve` | Admin | Approve a review |
| PUT | `/reviews/:reviewId/reject` | Admin | Reject a review |
| DELETE | `/reviews/:reviewId` | Admin | Delete review permanently |
| GET | `/cosmetics/items` | Admin | List cosmetic items |
| POST | `/cosmetics/items` | Admin | Create cosmetic item |
| PUT | `/cosmetics/items/:itemId` | Admin | Update cosmetic item |
| DELETE | `/cosmetics/items/:itemId` | Admin | Delete cosmetic item |
| GET | `/cosmetics/orders` | Admin | List cosmetic orders |
| PUT | `/cosmetics/orders/:orderId/status` | Admin | Update order status |
| GET | `/payouts/pending` | Admin | Pending beautician payouts |
| POST | `/payouts/:bookingId/process` | Admin | Process a payout |
| GET | `/notifications` | Admin | Admin notification feed |
| PUT | `/notifications/:id/read` | Admin | Mark notification read |
| PUT | `/notifications/read-all` | Admin | Mark all notifications read |

### Mobile App APIs

#### Authentication — `/api/mobileapp/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/customer/register` | No | Customer registration + OTP |
| POST | `/customer/verify-otp` | No | Verify OTP |
| POST | `/customer/login` | No | Customer login |
| POST | `/customer/resend-otp` | No | Resend OTP |
| POST | `/beautician/register` | No | Beautician registration |
| POST | `/beautician/login` | No | Beautician login |
| POST | `/beautician/upload-documents` | Beautician | Upload verification docs |
| POST | `/logout` | Yes | Logout |

#### Customer Profile — `/api/mobileapp/user`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | Customer | Get profile |
| PUT | `/profile` | Customer | Update profile |
| PUT | `/change-password` | Customer | Change password |
| POST | `/add-address` | Customer | Add new address |
| GET | `/addresses` | Customer | List addresses |
| PUT | `/address/:id` | Customer | Update address |
| DELETE | `/address/:id` | Customer | Delete address |
| GET | `/booking-history` | Customer | Paginated booking history |
| GET | `/booking/:id` | Customer | Single booking details |

#### Services — `/api/mobileapp/services`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | No | All categories with counts |
| GET | `/categories/:categoryId` | No | Category with its services |
| GET | `/` | No | All services (filter, sort) |
| GET | `/:serviceId` | No | Service details + beauticians |
| GET | `/search` | No | Search services |
| GET | `/popular` | No | Popular services |
| GET | `/offers` | No | Active discounts & banners |

#### Bookings — `/api/mobileapp/bookings`

**Customer endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create` | Customer | Create booking |
| GET | `/my-bookings` | Customer | My bookings (filter by status) |
| GET | `/available-slots` | No | Available time slots |
| GET | `/:bookingId` | Customer | Booking details + timeline |
| PUT | `/:bookingId/cancel` | Customer | Cancel booking |
| PUT | `/:bookingId/reschedule` | Customer | Reschedule booking |
| POST | `/:bookingId/complete` | Customer | Confirm completion |

**Beautician endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/beautician/today` | Beautician | Today's bookings |
| GET | `/beautician/upcoming` | Beautician | Upcoming bookings |
| GET | `/beautician/history` | Beautician | Booking history + earnings |
| GET | `/beautician/:bookingId` | Beautician | Booking details |
| PUT | `/beautician/:bookingId/accept` | Beautician | Accept booking |
| PUT | `/beautician/:bookingId/decline` | Beautician | Decline booking |
| PUT | `/beautician/:bookingId/start` | Beautician | Start service |
| PUT | `/beautician/:bookingId/complete` | Beautician | Complete service |

**Beautician broadcast (NEW):**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/beautician/broadcast` | Beautician | View available broadcast bookings |

#### Beautician Management — `/api/mobileapp/beautician`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | Beautician | Get beautician profile |
| PUT | `/profile` | Beautician | Update profile |
| GET | `/availability` | Beautician | Get availability + slots |
| PUT | `/availability` | Beautician | Update working schedule |
| POST | `/availability/add-unavailable` | Beautician | Block a date |
| DELETE | `/availability/unavailable/:id` | Beautician | Unblock a date |
| GET | `/services` | Beautician | List available services |
| PUT | `/services/:serviceId` | Beautician | Update service preferences |
| GET | `/dashboard-stats` | Beautician | Dashboard statistics |
| GET | `/earnings` | Beautician | Earnings with breakdown |

#### Reviews — `/api/mobileapp/reviews`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create` | Customer | Submit review |
| GET | `/beautician/:beauticianId` | No | Beautician reviews + ratings |
| GET | `/service/:serviceId` | No | Service reviews |
| GET | `/my-reviews` | Customer | My submitted reviews |
| PUT | `/:reviewId` | Customer | Edit review |
| DELETE | `/:reviewId` | Customer | Delete review |

#### Payments — `/api/mobileapp/payment`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wallet` | Yes | Wallet balance & points |
| POST | `/wallet/add` | Yes | Add money to wallet |
| POST | `/wallet/use-points` | Yes | Redeem points |
| GET | `/transactions` | Yes | Transaction history |
| POST | `/booking/:bookingId/pay` | Yes | Pay for booking |
| GET | `/booking/:bookingId/receipt` | Yes | Payment receipt |
| POST | `/webhook` | No | Payment gateway webhook |

**Beautician earnings (NEW):**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/earnings` | Beautician | Earnings summary + pending payouts |

#### Cosmetic Ordering — `/api/mobileapp/cosmetics` (NEW)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/items` | Beautician | Browse cosmetic catalog |
| GET | `/items/:itemId` | Beautician | Item details |
| POST | `/orders` | Beautician | Place cosmetic order |
| GET | `/orders` | Beautician | My cosmetic orders |
| GET | `/orders/:orderId` | Beautician | Order details |
| PUT | `/orders/:orderId/cancel` | Beautician | Cancel pending order |

#### Notifications — `/api/mobileapp/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List notifications |
| PUT | `/:notificationId/read` | Yes | Mark as read |
| PUT | `/read-all` | Yes | Mark all as read |
| POST | `/register-device` | Yes | Register device token |
| DELETE | `/unregister-device` | Yes | Unregister device |
| GET | `/settings` | Yes | Notification preferences |
| PUT | `/settings` | Yes | Update preferences |

#### Geolocation — `/api/mobileapp/location`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/beauticians-nearby` | No | Find nearby beauticians |
| GET | `/service-availability` | No | Check service at location |
| POST | `/calculate-distance` | No | Distance between points |
| GET | `/areas` | No | List service areas |

---

## Getting Started

### Prerequisites

- **Node.js** >= 16.x
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Saloon_Mern

# Install server dependencies
cd Server
npm install

# Install client dependencies
cd ../Client
npm install
```

### Running the Application

```bash
# Start the backend server
cd Server
npm run dev          # Development (with nodemon)
npm start            # Production

# Start the frontend (separate terminal)
cd Client
npm start            # Runs on http://localhost:3000
```

### Building for Production

```bash
# Build the React frontend
cd Client
npm run build

# Copy build to server (the server serves static files from /build)
# The server.js already serves the React build folder
```

---

## Environment Variables

Create a `.env` file in the `Server/` directory:

```env
# Server
PORT=5000

# MongoDB
MONGODB_URL=mongodb://localhost:27017/salon_db

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRE=30d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
REACT_APP_BACKEND_IP=http://localhost:5000
```

Create a `.env` file in the `Client/` directory:

```env
REACT_APP_BACKEND_IP=http://localhost:5000
```

---

## User Roles

| Role | Access Level | Description |
|------|-------------|-------------|
| **SuperAdmin** | Full system access | Created by seed script. Can manage everything. |
| **Admin** | Admin panel access | Manages users, beauticians, services, bookings |
| **Customer** | Customer features | Can browse, book, review, manage profile |
| **Beautician** | Beautician features | Can manage schedule, accept bookings, view earnings |

---

## Booking Lifecycle

```
┌──────────┐    Admin assigns    ┌──────────┐    Beautician    ┌──────────┐
│ Requested │ ─────────────────→ │ Assigned │ ──── accepts ──→ │ Accepted │
└──────────┘                     └──────────┘                   └──────────┘
                                       │                              │
                                  Beautician                   Beautician
                                  declines                     starts service
                                       │                              │
                                       ▼                              ▼
                                 ┌──────────┐                  ┌────────────┐
                                 │ Requested │ (re-enters pool) │ InProgress │
                                 └──────────┘                  └────────────┘
                                                                      │
                                                               Beautician /
                                                              Customer completes
                                                                      │
                                                                      ▼
                                                              ┌───────────┐
                                                              │ Completed │
                                                              └───────────┘

Customer can cancel at any stage before InProgress → status becomes "Cancelled"
```

### Payment Statuses

- **Pending** → Payment not yet made
- **Paid** → Payment received
- **Refunded** → Full refund after cancellation
- **PartialRefund** → Partial refund

### Beautician Verification Flow

```
Registration → Pending → (Admin reviews documents) → Approved / Rejected
                                                          ↓
                                                   Status: Active (can receive bookings)
```

---

## Security

- **JWT Authentication** with token refresh mechanism
- **Password Hashing** using bcrypt (12 salt rounds)
- **Helmet.js** for HTTP security headers
- **CORS** configured for cross-origin requests
- **Input Validation** on all endpoints
- **Rate Limiting** via express-rate-limit
- **File Upload Restrictions** (5MB max, allowed types only)
- **OTP Brute Force Protection** (max 5 attempts per OTP)
- **OTP Auto-expiry** (TTL index, 10 minutes)
- **Role-based Access Control** on all protected routes

---

## Integration Points (Ready for Configuration)

| Feature | Status | Integration |
|---------|--------|-------------|
| Email (OTP, notifications) | ✅ Active | Nodemailer (SMTP) |
| SMS (OTP delivery) | 🔌 Stub ready | Twilio / AWS SNS / MSG91 |
| Push Notifications | 🔌 Stub ready | Firebase Cloud Messaging |
| Payment Gateway | 🔌 Stub ready | Razorpay / Stripe / PayU |
| File Storage | ✅ Active | Local disk (multer) — swap to S3/Cloudinary |

---

## License

This project is proprietary software developed by **CodeCarrot**.
