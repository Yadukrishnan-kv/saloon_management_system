const express = require("express");
const router = express.Router();
const {
  getMetrics,
  getRevenue,
  getActivity,
  getBookingsOverview,
} = require("../controllers/dashboardController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/metrics", protect, authorizeRoles("SuperAdmin", "Admin"), getMetrics);
router.get("/revenue", protect, authorizeRoles("SuperAdmin", "Admin"), getRevenue);
router.get("/activity", protect, authorizeRoles("SuperAdmin", "Admin"), getActivity);
router.get("/bookings-overview", protect, authorizeRoles("SuperAdmin", "Admin"), getBookingsOverview);

module.exports = router;
