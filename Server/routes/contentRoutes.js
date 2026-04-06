const express = require("express");
const router = express.Router();
const {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllComplaints,
  createComplaint,
  resolveComplaint,
  getAllReviews,
  createReview,
  getBeauticianReviews,
} = require("../controllers/contentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ===== Banners =====
router.get("/banners", getAllBanners);
router.post("/banners", protect, authorizeRoles("SuperAdmin", "Admin"), createBanner);
router.put("/banners/:id", protect, authorizeRoles("SuperAdmin", "Admin"), updateBanner);
router.delete("/banners/:id", protect, authorizeRoles("SuperAdmin", "Admin"), deleteBanner);

// ===== Complaints =====
router.get("/complaints", protect, getAllComplaints);
router.post("/complaints", protect, createComplaint);
router.put("/complaints/:id", protect, authorizeRoles("SuperAdmin", "Admin"), resolveComplaint);

// ===== Reviews =====
router.get("/reviews", getAllReviews);
router.post("/reviews", protect, authorizeRoles("Customer"), createReview);
router.get("/reviews/beautician/:beauticianId", getBeauticianReviews);

module.exports = router;
