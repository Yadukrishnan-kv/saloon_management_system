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
} = require("../controllers/mobileappServiceController");

// Public routes (no auth required for browsing)
router.get("/categories", getCategories);
router.get("/categories/:categoryId", getCategoryServices);
router.get("/search", searchServices);
router.get("/popular", getPopularServices);
router.get("/offers", getOffers);
router.get("/", getAllServices);
router.get("/:serviceId", getServiceById);

module.exports = router;
