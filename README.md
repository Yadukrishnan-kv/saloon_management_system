# Saloon_Mern

## Overview
Saloon_Mern is a MERN-based salon platform with:
- React web app for Admin, Beautician, and Customer web flows
- Node.js + Express backend APIs for web and mobile clients
- MongoDB with Mongoose models
- Role and permission based access control

## Tech Stack
- Client: React 18, React Router, Axios, React Hot Toast, React Icons
- Server: Node.js, Express, Mongoose, JWT, bcryptjs, multer
- Database: MongoDB

## Current Folder Structure

```text
Saloon_Mern/
|-- Client/
|   |-- public/
|   |-- build/
|   |-- src/
|   |   |-- App.jsx
|   |   |-- index.js
|   |   |-- index.css
|   |   |-- dom/
|   |   |   `-- Dom.jsx
|   |   |-- Assets/
|   |   |-- constants/
|   |   |   `-- constants.js
|   |   |-- components/
|   |   |   |-- common/
|   |   |   |-- layout/
|   |   |   `-- beautician/
|   |   |-- context/
|   |   |   |-- AuthContext.jsx
|   |   |   `-- BookingContext.jsx
|   |   |-- hooks/
|   |   |   |-- useAuth.js
|   |   |   `-- useFetch.js
|   |   |-- pages/
|   |   |   |-- Admin/
|   |   |   |   |-- Dashboard/
|   |   |   |   |-- UserManagement/
|   |   |   |   |-- RoleManagement/
|   |   |   |   |-- CustomerManagement/
|   |   |   |   |-- BeauticianManagement/
|   |   |   |   |-- BookingManagement/
|   |   |   |   |-- ContentManagement/
|   |   |   |   |-- ReviewManagement/
|   |   |   |   |-- CosmeticManagement/
|   |   |   |   |-- PayoutManagement/
|   |   |   |   |-- AdminNotifications/
|   |   |   |   `-- Reports/
|   |   |   |-- Auth/
|   |   |   |-- Beautician/
|   |   |   `-- Customer/
|   |   `-- utils/
|   |       `-- helpers.js
|   `-- package.json
|-- Server/
|   |-- server.js
|   |-- config/
|   |   |-- db.js
|   |   `-- seedAdmin.js
|   |-- middleware/
|   |   |-- authMiddleware.js
|   |   `-- uploadMiddleware.js
|   |-- models/
|   |   |-- User.js
|   |   |-- Role.js
|   |   |-- Beautician.js
|   |   |-- Booking.js
|   |   |-- Service.js
|   |   |-- ServiceCategory.js
|   |   |-- Review.js
|   |   |-- Complaint.js
|   |   |-- Banner.js
|   |   |-- CosmeticItem.js
|   |   |-- CosmeticOrder.js
|   |   |-- Notification.js
|   |   |-- OTP.js
|   |   `-- Wallet.js
|   |-- controllers/
|   |-- routes/
|   |-- utils/
|   |-- POSTMAN_ADMIN_README.md
|   `-- package.json
`-- README.md
```

## Update Notes (Latest)

### 1) API Handling Refactor (Client)
- Removed shared client API abstraction (`Client/src/utils/api.js`).
- Each refactored page now uses direct Axios calls.
- URLs are now explicit in files using:
  - `const backendUrl = process.env.REACT_APP_BACKEND_IP;`
  - Example: `axios.post(`${backendUrl}/api/users/createUser`, formData)`
- Global axios `baseURL` usage was removed from startup.
- Axios request/response interceptors for auth token and refresh token handling remain active in `Client/src/index.js`.

### 2) Dynamic Role and Permission System
- Added dynamic role model and role management APIs.
- Added role CRUD pages in Admin.
- Menu and route access use permission checks.
- Static role enum behavior was removed in favor of DB-driven roles.

### 3) Customer Management Separation
- Customer management is separate from web user management.
- Added dedicated customer endpoints and Admin pages (`CustomerList`, `AddCustomer`).
- Web user create/update filters exclude direct web assignment for Customer/Beautician where applicable.

### 4) Beautician Flow Rules
- Admin-created beautician profile can be created without creating a web `User` record.
- Admin-created beautician is auto-verified.
- Mobile beautician signup stays pending for admin verification.
- Mobile signup can link to existing beautician profile by phone.

### 5) Admin Modules Added/Updated
- Role management
- Customer management
- Review moderation
- Cosmetic management
- Payout management
- Admin notifications

## Environment
Create `Client/.env`:

```env
REACT_APP_BACKEND_IP=http://localhost:5000
```

Create `Server/.env` based on your server needs (Mongo URI, JWT secrets, mail/SMS keys, etc.).

## Run Locally

### Client
```bash
cd Client
npm install
npm start
```

### Server
```bash
cd Server
npm install
npm start
```

## Notes
- After changing `.env`, restart the client dev server.
- If API calls fail, first verify `REACT_APP_BACKEND_IP` and server port.
