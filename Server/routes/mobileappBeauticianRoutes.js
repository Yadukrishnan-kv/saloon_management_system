const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getAvailability,
  updateAvailability,
  addUnavailableDate,
  removeUnavailableDate,
  getServices,
  updateService,
  getDashboardStats,
  getEarnings,
} = require("../controllers/mobileappBeauticianController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// All routes require authentication and Beautician role
router.use(protect, authorizeRoles("Beautician"));

// Profile
router.get("/profile", getProfile);
router.put("/profile", upload.single("profileImage"), updateProfile);

// Availability
router.get("/availability", getAvailability);
router.put("/availability", updateAvailability);
router.post("/availability/add-unavailable", addUnavailableDate);
router.delete("/availability/unavailable/:id", removeUnavailableDate);

// Services
router.get("/services", getServices);
router.put("/services/:serviceId", updateService);

// Dashboard & Earnings
router.get("/dashboard-stats", getDashboardStats);
router.get("/earnings", getEarnings);

module.exports = router;
