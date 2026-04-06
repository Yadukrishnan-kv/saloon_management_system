const express = require("express");
const router = express.Router();
const {
  createReview,
  getBeauticianReviews,
  getServiceReviews,
  getMyReviews,
  updateReview,
  deleteReview,
} = require("../controllers/mobileappReviewController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Public routes
router.get("/beautician/:beauticianId", getBeauticianReviews);
router.get("/service/:serviceId", getServiceReviews);

// Customer routes (auth required)
router.post("/create", protect, authorizeRoles("Customer"), createReview);
router.get("/my-reviews", protect, authorizeRoles("Customer"), getMyReviews);
router.put("/:reviewId", protect, authorizeRoles("Customer"), updateReview);
router.delete("/:reviewId", protect, authorizeRoles("Customer"), deleteReview);

module.exports = router;
