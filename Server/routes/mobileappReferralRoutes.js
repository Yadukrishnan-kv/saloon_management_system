const express = require("express");
const router = express.Router();
const {
  getReferralCode,
  getReferralStats,
  getReferralHistory,
  validateReferralCode,
} = require("../controllers/mobileappReferralController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Get user's referral code
router.get("/code", getReferralCode);

// Get referral statistics
router.get("/stats", getReferralStats);

// Get referral history (paginated)
router.get("/history", getReferralHistory);

// Validate referral code
router.post("/validate", validateReferralCode);

module.exports = router;
