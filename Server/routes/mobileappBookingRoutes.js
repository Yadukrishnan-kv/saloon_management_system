const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingDetails,
  cancelBooking,
  rescheduleBooking,
  getAvailableSlots,
  customerCompleteBooking,
  beauticianTodayBookings,
  beauticianUpcomingBookings,
  beauticianGetBooking,
  beauticianAcceptBooking,
  beauticianDeclineBooking,
  beauticianStartBooking,
  beauticianCompleteBooking,
  beauticianBookingHistory,
  beauticianBroadcastBookings,
} = require("../controllers/mobileappBookingController");
const { protect, authorizeRoles, attachBeauticianProfile } = require("../middleware/authMiddleware");

// Customer booking routes
router.post("/create", protect, authorizeRoles("Customer"), createBooking);
router.get("/my-bookings", protect, authorizeRoles("Customer"), getMyBookings);
router.get("/available-slots", getAvailableSlots); // Public
router.get("/:bookingId", protect, authorizeRoles("Customer"), getBookingDetails);
router.put("/:bookingId/cancel", protect, authorizeRoles("Customer"), cancelBooking);
router.put("/:bookingId/reschedule", protect, authorizeRoles("Customer"), rescheduleBooking);
router.post("/:bookingId/complete", protect, authorizeRoles("Customer"), customerCompleteBooking);

// Beautician booking routes
router.get(
  "/beautician/today",
  protect,
  authorizeRoles("Beautician"),
  attachBeauticianProfile,
  beauticianTodayBookings
);
router.get(
  "/beautician/broadcast",
  protect,
  authorizeRoles("Beautician"),
  attachBeauticianProfile,
  beauticianBroadcastBookings
);
router.get(
  "/beautician/upcoming",
  protect,
  authorizeRoles("Beautician"),
  attachBeauticianProfile,
  beauticianUpcomingBookings
);
router.get(
  "/beautician/history",
  protect,
  authorizeRoles("Beautician"),
  attachBeauticianProfile,
  beauticianBookingHistory
);
router.get(
  "/beautician/:bookingId",
  protect,
  authorizeRoles("Beautician"),
  attachBeauticianProfile,
  beauticianGetBooking
);
router.put(
  "/beautician/:bookingId/accept",
  protect,
  authorizeRoles("Beautician"),
  attachBeauticianProfile,
  beauticianAcceptBooking
);
router.put(
  "/beautician/:bookingId/decline",
  protect,
  authorizeRoles("Beautician"),
  attachBeauticianProfile,
  beauticianDeclineBooking
);
router.put(
  "/beautician/:bookingId/start",
  protect,
  authorizeRoles("Beautician"),
  attachBeauticianProfile,
  beauticianStartBooking
);
router.put(
  "/beautician/:bookingId/complete",
  protect,
  authorizeRoles("Beautician"),
  attachBeauticianProfile,
  beauticianCompleteBooking
);

module.exports = router;
