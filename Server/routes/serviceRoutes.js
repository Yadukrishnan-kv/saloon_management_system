const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllServices,
  getServicesByCategory,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ===== Categories =====
router.get("/categories", getAllCategories);
router.post("/categories", protect, authorizeRoles("SuperAdmin", "Admin"), createCategory);
router.put("/categories/:id", protect, authorizeRoles("SuperAdmin", "Admin"), updateCategory);
router.delete("/categories/:id", protect, authorizeRoles("SuperAdmin", "Admin"), deleteCategory);

// ===== Services =====
router.get("/services", getAllServices);
router.get("/services/by-category/:categoryId", getServicesByCategory);
router.post("/services", protect, authorizeRoles("SuperAdmin", "Admin"), createService);
router.put("/services/:id", protect, authorizeRoles("SuperAdmin", "Admin"), updateService);
router.delete("/services/:id", protect, authorizeRoles("SuperAdmin", "Admin"), deleteService);

module.exports = router;
