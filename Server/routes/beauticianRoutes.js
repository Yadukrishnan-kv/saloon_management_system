const express = require("express");
const router = express.Router();
const {
  getAllBeauticians,
  getBeauticianById,
  createBeautician,
  updateBeautician,
  deleteBeautician,
  verifyDocuments,
  setBeauticianVerificationStatus,
  updateBeauticianStatus,
  uploadBeauticianDocuments,
  getBeauticianSkills,
  updateBeauticianSkills,
  getAvailableBeauticians,
  getNearbyBeauticians,
  getTopBeauticians,
} = require("../controllers/beauticianController");
// Top-rated beauticians (public)
router.get("/top-rated", getTopBeauticians);
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Public / Customer routes
router.get("/available", protect, getAvailableBeauticians);
router.get("/nearby", protect, getNearbyBeauticians);

// General
router.get("/", protect, getAllBeauticians);
router.get("/:id", protect, getBeauticianById);
router.get("/:id/skills", protect, getBeauticianSkills);

// Admin only
router.post("/", protect, authorizeRoles("SuperAdmin", "Admin"), createBeautician);
router.put("/:id", protect, authorizeRoles("SuperAdmin", "Admin"), updateBeautician);
router.delete("/:id", protect, authorizeRoles("SuperAdmin", "Admin"), deleteBeautician);
router.post("/:id/verify", protect, authorizeRoles("SuperAdmin", "Admin"), verifyDocuments);
router.put("/:id/verify", protect, authorizeRoles("SuperAdmin", "Admin"), setBeauticianVerificationStatus);
router.put("/:id/status", protect, authorizeRoles("SuperAdmin", "Admin"), updateBeauticianStatus);
router.post("/:id/documents", protect, authorizeRoles("SuperAdmin", "Admin"), upload.array("documents", 5), uploadBeauticianDocuments);
router.put("/:id/skills", protect, authorizeRoles("SuperAdmin", "Admin"), updateBeauticianSkills);

module.exports = router;
