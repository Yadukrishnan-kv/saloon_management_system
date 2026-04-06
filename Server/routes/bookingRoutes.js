const express = require("express");
const router = express.Router();
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  assignBeautician,
  acceptBooking,
  completeBooking,
  getBookingsByStatus,
  getTodayBookings,
  reassignBooking,
} = require("../controllers/bookingController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", protect, getAllBookings);
router.get("/today", protect, authorizeRoles("SuperAdmin", "Admin"), getTodayBookings);
router.get("/status/:status", protect, getBookingsByStatus);
router.get("/:id", protect, getBookingById);

router.post("/", protect, authorizeRoles("Customer"), createBooking);
router.put("/:id", protect, updateBookingStatus);
router.delete("/:id", protect, cancelBooking);

router.post("/:id/assign", protect, authorizeRoles("SuperAdmin", "Admin"), assignBeautician);
router.post("/:id/accept", protect, authorizeRoles("Beautician"), acceptBooking);
router.post("/:id/complete", protect, authorizeRoles("Beautician", "Admin"), completeBooking);
router.post("/:id/reassign", protect, authorizeRoles("SuperAdmin", "Admin"), reassignBooking);

module.exports = router;
