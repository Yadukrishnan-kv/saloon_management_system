const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  // Review management
  getPendingReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReviewByAdmin,
  // Cosmetic management
  getAdminCosmeticItems,
  createCosmeticItem,
  updateCosmeticItem,
  deleteCosmeticItem,
  getAdminCosmeticOrders,
  updateCosmeticOrderStatus,
  // Payout management
  getPendingPayouts,
  processPayout,
  // Admin notifications
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} = require("../controllers/adminExtendedController");

// ── Review Management ──
router.get("/reviews/pending", protect, authorizeRoles("Admin", "SuperAdmin"), getPendingReviews);
router.get("/reviews", protect, authorizeRoles("Admin", "SuperAdmin"), getAllReviews);
router.put("/reviews/:reviewId/approve", protect, authorizeRoles("Admin", "SuperAdmin"), approveReview);
router.put("/reviews/:reviewId/reject", protect, authorizeRoles("Admin", "SuperAdmin"), rejectReview);
router.delete("/reviews/:reviewId", protect, authorizeRoles("Admin", "SuperAdmin"), deleteReviewByAdmin);

// ── Cosmetic Item Management ──
router.get("/cosmetics/items", protect, authorizeRoles("Admin", "SuperAdmin"), getAdminCosmeticItems);
router.post("/cosmetics/items", protect, authorizeRoles("Admin", "SuperAdmin"), upload.single("image"), createCosmeticItem);
router.put("/cosmetics/items/:itemId", protect, authorizeRoles("Admin", "SuperAdmin"), upload.single("image"), updateCosmeticItem);
router.delete("/cosmetics/items/:itemId", protect, authorizeRoles("Admin", "SuperAdmin"), deleteCosmeticItem);

// ── Cosmetic Order Management ──
router.get("/cosmetics/orders", protect, authorizeRoles("Admin", "SuperAdmin"), getAdminCosmeticOrders);
router.put("/cosmetics/orders/:orderId/status", protect, authorizeRoles("Admin", "SuperAdmin"), updateCosmeticOrderStatus);

// ── Payout Management ──
router.get("/payouts/pending", protect, authorizeRoles("Admin", "SuperAdmin"), getPendingPayouts);
router.post("/payouts/:bookingId/process", protect, authorizeRoles("Admin", "SuperAdmin"), processPayout);

// ── Admin Notifications ──
router.get("/notifications", protect, authorizeRoles("Admin", "SuperAdmin"), getAdminNotifications);
router.put("/notifications/:notificationId/read", protect, authorizeRoles("Admin", "SuperAdmin"), markAdminNotificationRead);
router.put("/notifications/read-all", protect, authorizeRoles("Admin", "SuperAdmin"), markAllAdminNotificationsRead);

module.exports = router;
