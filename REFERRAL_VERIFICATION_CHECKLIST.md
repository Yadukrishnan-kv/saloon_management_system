# Referral System - Quick Verification Checklist

Use this checklist to verify the referral system implementation.

---

## ✅ Backend Setup

### Database Models
- [ ] User model has `referralCode`, `referredBy`, `referralCount` fields
  - **File:** `Server/models/User.js`
  - **Command:** Search for "referralCode" in User.js

- [ ] Referral model exists with all required fields
  - **File:** `Server/models/Referral.js`
  - **Check:** File exists and contains referrer/referredUser/rewardStatus

- [ ] ReferralSettings singleton model exists
  - **File:** `Server/models/ReferralSettings.js`
  - **Check:** Has pointsPerReferral, pointsRedemptionLimit fields

### Utilities
- [ ] Referral code generator utility exists
  - **File:** `Server/utils/referralCodeGenerator.js`
  - **Check:** Has `generateReferralCode()` and `validateReferralCode()` functions

### Controllers
- [ ] Auth controller has referral support
  - **File:** `Server/controllers/authController.js`
  - **Search:** Look for referralCode handling in register/registerBeautician

- [ ] Mobile app auth controller has referral logic
  - **File:** `Server/controllers/mobileappAuthController.js`
  - **Search:** Look for ReferralSettings fetch and point allocation

- [ ] Admin referral controller exists
  - **File:** `Server/controllers/adminReferralController.js`
  - **Check:** Has getReferralSettings, updateReferralSettings, getReferralStatisticsAdmin

- [ ] User controller profile updated
  - **File:** `Server/controllers/userController.js`
  - **Search:** getMyProfile should return referralCode, referralCount, walletPoints

- [ ] Mobile app user controller profile updated
  - **File:** `Server/controllers/mobileappUserController.js`
  - **Search:** getProfile should return referralCode, referralCount, walletPoints

### Routes
- [ ] Mobile app referral routes exist
  - **File:** `Server/routes/mobileappUserRoutes.js`
  - **Check:** Routes for /code, /stats, /history, /validate

- [ ] Admin referral routes exist
  - **File:** `Server/routes/adminReferralRoutes.js`
  - **Check:** GET/PUT /settings, GET /statistics endpoints

- [ ] Routes registered in server.js
  - **File:** `Server/server.js`
  - **Search:** "adminReferralRoutes" should be imported and used

---

## ✅ Frontend Setup

### Customer Registration
- [ ] Referral code input field added
  - **File:** `Client/src/pages/Auth/Register/Register.jsx`
  - **Check:** Has optional referral code input field with FiGift icon

### Admin Settings Page
- [ ] ReferralSettings component exists
  - **File:** `Client/src/pages/Admin/ReferralManagement/Settings/ReferralSettings.jsx`
  - **Check:** Form with pointsPerReferral, pointsRedemptionLimit, description, isActive

- [ ] ReferralSettings CSS exists
  - **File:** `Client/src/pages/Admin/ReferralManagement/Settings/ReferralSettings.css`
  - **Check:** File has styles for form inputs and buttons

### Admin Analytics
- [ ] ReferralStatistics component exists
  - **File:** `Client/src/pages/Admin/ReferralManagement/Statistics/ReferralStatistics.jsx`
  - **Check:** Dashboard with stat cards and tables

- [ ] ReferralStatistics CSS exists
  - **File:** `Client/src/pages/Admin/ReferralManagement/Statistics/ReferralStatistics.css`
  - **Check:** File has responsive styling for tables and cards

---

## ✅ API Documentation

- [ ] Mobile App API README updated
  - **File:** `Server/MOBILE_APP_API_README.md`
  - **Check:** Has Admin APIs section with referral endpoints documentation

- [ ] Referral System Summary document exists
  - **File:** `REFERRAL_SYSTEM_SUMMARY.md`
  - **Check:** Complete system overview and examples

---

## 🧪 Functional Testing

### 1. Referral Code Generation
```
Test: Register new user
Expected: Response includes referralCode (format: Sidi + 4 chars)
Command:
  POST /api/mobileapp/auth/customer/register
  Body: { username, email, password, ... }
```

### 2. Referral with Points
```
Test: Register with referral code
Expected: Referrer gets points in wallet, referral record created
Command:
  POST /api/mobileapp/auth/customer/register
  Body: { ..., referralCode: "SALONXYZ789AB" }
```

### 3. Get User Profile
```
Test: Check profile includes referral data
Expected: Response has referralCode, referralCount, walletPoints
Command:
  GET /api/user/profile
  or
  GET /api/mobileapp/user/profile
  Headers: Authorization: Bearer <token>
```

### 4. Admin Settings
```
Test: Get current settings
Expected: Returns pointsPerReferral, pointsRedemptionLimit
Command:
  GET /api/admin/referral/settings
  Headers: Authorization: Bearer <admin_token>
```

### 5. Update Settings
```
Test: Change points per referral
Expected: Settings updated, used for next referrals
Command:
  PUT /api/admin/referral/settings
  Headers: Authorization: Bearer <admin_token>
  Body: { pointsPerReferral: 15, pointsRedemptionLimit: 150 }
```

### 6. Admin Statistics
```
Test: Get referral analytics
Expected: Shows total users, referrers, top referrers list
Command:
  GET /api/admin/referral/statistics
  Headers: Authorization: Bearer <admin_token>
```

### 7. Referral Stats
```
Test: Get user's referral statistics
Expected: Shows referral code, count, wallet points
Command:
  GET /api/mobileapp/referral/stats
  Headers: Authorization: Bearer <user_token>
```

### 8. Validate Referral Code
```
Test: Check if code exists before registration
Expected: Returns true if valid, false if not/self
Command:
  POST /api/mobileapp/referral/validate
  Body: { referralCode: "SALONXYZ789AB" }
```

---

## 🔍 Verification Commands (Terminal)

### Check Files Exist
```bash
# Models
test -f "Server/models/Referral.js" && echo "✓ Referral.js exists"
test -f "Server/models/ReferralSettings.js" && echo "✓ ReferralSettings.js exists"

# Utils
test -f "Server/utils/referralCodeGenerator.js" && echo "✓ Generator exists"

# Controllers
test -f "Server/controllers/adminReferralController.js" && echo "✓ Admin controller exists"

# Routes
test -f "Server/routes/adminReferralRoutes.js" && echo "✓ Admin routes exist"

# Frontend
test -f "Client/src/pages/Admin/ReferralManagement/Settings/ReferralSettings.jsx" && echo "✓ Admin settings component exists"
test -f "Client/src/pages/Admin/ReferralManagement/Statistics/ReferralStatistics.jsx" && echo "✓ Admin stats component exists"
```

### Check Code Presence
```bash
# Check referralCode in User model
grep -n "referralCode" "Server/models/User.js" | head -3

# Check admin controller referral logic
grep -n "adminReferralController" "Server/server.js"

# Check mobile routes
grep -n "referral/code\|referral/stats" "Server/routes/mobileappUserRoutes.js"
```

---

## 🚀 Next Steps After Verification

1. **Frontend Routing**
   - Add menu items in admin sidebar for Settings and Statistics
   - Link components in admin routes
   - Test navigation

2. **Manual Testing**
   - Create test accounts and verify referral flow
   - Change admin settings and verify points update
   - Check admin dashboard shows correct statistics

3. **Integration Testing**
   - Test across mobile app and web app
   - Verify Wallet integration working
   - Test with different point configurations

4. **Production Deployment**
   - Run all migrations on production DB
   - Test with real data sample
   - Monitor admin statistics accuracy

---

## 📞 Troubleshooting

### Referral code not generating
- Check: `Server/utils/referralCodeGenerator.js` is imported in auth controllers
- Check: User model has referralCode field with unique: true

### Points not adding to wallet
- Check: Wallet model exists and is imported in mobileappAuthController
- Check: `pointsPerReferral` > 0 in ReferralSettings
- Check: Referral record created successfully before wallet update

### Admin statistics not showing
- Check: adminReferralRoutes registered in server.js
- Check: Admin role check in middleware
- Check: Aggregation pipeline in `getReferralStatisticsAdmin()`

### Referral validation failing
- Check: Referral code format matches /^Sidi[A-Z0-9]{4}$/
- Check: User not using their own referral code
- Check: Code exists in User collection

---

## 📊 Success Indicators

When everything is working correctly, you should see:

1. **Registration Response**
   ```json
   {
     "success": true,
     "referralCode": "SALONXYZ789AB",
     ...
   }
   ```

2. **Profile Response**
   ```json
   {
     ...
     "referralCode": "SALONXYZ789AB",
     "referralCount": 5,
     "walletPoints": 50
   }
   ```

3. **Admin Settings Response**
   ```json
   {
     "success": true,
     "settings": {
       "pointsPerReferral": 10,
       "pointsRedemptionLimit": 100,
       "isActive": true
     }
   }
   ```

4. **Admin Statistics Response**
   ```json
   {
     "success": true,
     "statistics": {
       "totalUsers": 500,
       "totalReferrals": 245,
       "topReferrers": [...]
     }
   }
   ```

---

