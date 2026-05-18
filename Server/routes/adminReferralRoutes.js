const express = require("express");
const router = express.Router();
const {
  getReferralSettings,
  updateReferralSettings,
  getReferralStatisticsAdmin,
} = require("../controllers/adminReferralController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// All routes require authentication and Admin/SuperAdmin role
router.use(protect, authorizeRoles("SuperAdmin", "Admin"));

// Get referral settings
router.get("/settings", getReferralSettings);

// Update referral settings
router.put("/settings", updateReferralSettings);

// Get referral statistics
router.get("/statistics", getReferralStatisticsAdmin);

module.exports = router;
