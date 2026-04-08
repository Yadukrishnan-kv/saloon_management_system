const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  getAvailability,
  updateAvailability,
  addUnavailableDate,
  removeUnavailableDate,
  toggleSlotAvailability,
  getServices,
  updateService,
  getDashboardStats,
  getEarnings,
  getVerificationStatus,
  toggleAcceptingBookings,
  getWorkEligibility,
  addDocument,
  deleteDocument,
  getDocuments,
  addPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  getClients,
  getScheduleByDate,
  getBeauticianHomeDashboard,
} = require("../controllers/mobileappBeauticianController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// All routes require authentication and Beautician role
router.use(protect, authorizeRoles("Beautician"));

// Home dashboard (aggregate)
router.get("/home", getBeauticianHomeDashboard);

// Profile
router.get("/profile", getProfile);
router.put("/profile", upload.single("profileImage"), updateProfile);
router.post("/profile/upload-image", upload.single("profileImage"), uploadProfileImage);

// Verification status (multi-step)
router.get("/verification-status", getVerificationStatus);

// Booking acceptance toggle
router.put("/toggle-accepting", toggleAcceptingBookings);

// Work eligibility / wallet check
router.get("/work-eligibility", getWorkEligibility);

// Availability
router.get("/availability", getAvailability);
router.put("/availability", updateAvailability);
router.post("/availability/add-unavailable", addUnavailableDate);
router.delete("/availability/unavailable/:id", removeUnavailableDate);
router.put("/availability/toggle-slot", toggleSlotAvailability);

// Documents / Certificates
router.get("/documents", getDocuments);
router.post("/documents", upload.single("document"), addDocument);
router.delete("/documents/:documentId", deleteDocument);

// Payment methods
router.get("/payment-methods", getPaymentMethods);
router.post("/payment-methods", addPaymentMethod);
router.delete("/payment-methods/:methodId", deletePaymentMethod);

// Services
router.get("/services", getServices);
router.put("/services/:serviceId", updateService);

// Clients
router.get("/clients", getClients);

// Schedule by date
router.get("/schedule", getScheduleByDate);

// Dashboard & Earnings
router.get("/dashboard-stats", getDashboardStats);
router.get("/earnings", getEarnings);

module.exports = router;
