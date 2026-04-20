const express = require("express");
const router = express.Router();
const {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getStaticContent,
  upsertStaticContent,
  getAllComplaints,
  createComplaint,
  resolveComplaint,
  getAllReviews,
  createReview,
  getBeauticianReviews,
} = require("../controllers/contentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ===== Banners =====
router.get("/banners", getAllBanners);
router.post("/banners", protect, authorizeRoles("SuperAdmin", "Admin"), upload.single('image'), createBanner);
router.put("/banners/:id", protect, authorizeRoles("SuperAdmin", "Admin"), upload.single('image'), updateBanner);
router.delete("/banners/:id", protect, authorizeRoles("SuperAdmin", "Admin"), deleteBanner);

// ===== Static Content =====
router.get("/static-content", protect, authorizeRoles("SuperAdmin", "Admin"), getStaticContent);
router.put("/static-content", protect, authorizeRoles("SuperAdmin", "Admin"), upsertStaticContent);

// ===== Complaints =====
router.get("/complaints", protect, getAllComplaints);
router.post("/complaints", protect, createComplaint);
router.put("/complaints/:id", protect, authorizeRoles("SuperAdmin", "Admin"), resolveComplaint);

// ===== Reviews =====
router.get("/reviews", getAllReviews);
router.post("/reviews", protect, authorizeRoles("Customer"), createReview);
router.get("/reviews/beautician/:beauticianId", getBeauticianReviews);

module.exports = router;
