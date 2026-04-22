const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategoryServices,
  getAllServices,
  getServiceById,
  searchServices,
  getPopularServices,
  getOffers,
  getSubCategories,
  getServiceAddons,
  getHomeDashboard,
  getLocationFromCoordinates,
} = require("../controllers/mobileappServiceController");

// Home dashboard (aggregate: banners + categories + popular + offers)
router.get("/home", getHomeDashboard);

// Location
router.get("/location", getLocationFromCoordinates);

// Public routes (no auth required for browsing)
router.get("/categories", getCategories);
router.get("/categories/:categoryId", getCategoryServices);
router.get("/categories/:categoryId/subcategories", getSubCategories);
router.get("/search", searchServices);
router.get("/popular", getPopularServices);
router.get("/offers", getOffers);
router.get("/:serviceId/addons", getServiceAddons);
router.get("/", getAllServices);
router.get("/:serviceId", getServiceById);

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Beautician CRUD for their own services
router.post("/", protect, upload.array('images', 2), require("../controllers/mobileappServiceController").createBeauticianService);
router.put("/:serviceId", protect, upload.array('images', 2), require("../controllers/mobileappServiceController").updateBeauticianService);
router.delete("/:serviceId", protect, require("../controllers/mobileappServiceController").deleteBeauticianService);

module.exports = router;
