const express = require("express");
const router = express.Router();
const {
  getAllServices,
  getServicesByCategory,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");


// ===== Services =====
// ===== Services =====
router.get("/services", getAllServices);
router.get("/services/by-category/:categoryId", getServicesByCategory);
router.post("/services", protect, authorizeRoles("SuperAdmin", "Admin"), upload.array('images', 2), createService);
router.put("/services/:id", protect, authorizeRoles("SuperAdmin", "Admin"), upload.array('images', 2), updateService);
router.delete("/services/:id", protect, authorizeRoles("SuperAdmin", "Admin"), deleteService);

module.exports = router;
