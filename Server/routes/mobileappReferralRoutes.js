const express = require("express");
const router = express.Router();
const {
  getComprehensiveReferralDetails,
} = require("../controllers/mobileappReferralController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Get comprehensive referral details (works for both Customer & Beautician)
router.get("/details", getComprehensiveReferralDetails);

module.exports = router;
