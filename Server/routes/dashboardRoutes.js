const express = require("express");
const router = express.Router();
const {
  getMetrics,
  getRevenue,
  getActivity,
  getBookingsOverview,
} = require("../controllers/dashboardController");
const { protect, authorizePermission } = require("../middleware/authMiddleware");

router.get("/metrics", protect, authorizePermission("Dashboard"), getMetrics);
router.get("/revenue", protect, authorizePermission("Dashboard"), getRevenue);
router.get("/activity", protect, authorizePermission("Dashboard"), getActivity);
router.get("/bookings-overview", protect, authorizePermission("Dashboard"), getBookingsOverview);

module.exports = router;
