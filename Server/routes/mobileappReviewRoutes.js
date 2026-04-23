const express = require("express");
const router = express.Router();
const {
  createBeauticianReview,
  rateService,
  rateCuratedService,
  getBeauticianReviews,
  getServiceRatings,
  getCuratedServiceRatings,
  getMyReviews,
  updateReview,
  deleteReview,
} = require("../controllers/mobileappReviewController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Public routes
router.get("/beautician/:beauticianId", getBeauticianReviews);
router.get("/service/:serviceId", getServiceRatings);
router.get("/curated-service/:curatedServiceId", getCuratedServiceRatings);

// Customer routes (auth required)
router.post("/beautician", protect, authorizeRoles("Customer"), createBeauticianReview);
router.post("/service", protect, authorizeRoles("Customer"), rateService);
router.post("/curated-service", protect, authorizeRoles("Customer"), rateCuratedService);
router.get("/my-reviews", protect, authorizeRoles("Customer"), getMyReviews);
router.put("/:reviewId", protect, authorizeRoles("Customer"), updateReview);
router.delete("/:reviewId", protect, authorizeRoles("Customer"), deleteReview);

module.exports = router;
