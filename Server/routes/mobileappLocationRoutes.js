const express = require("express");
const router = express.Router();
const {
  getNearbyBeauticians,
  getServiceAvailability,
  calculateDistanceAPI,
  getServiceAreas,
} = require("../controllers/mobileappLocationController");

// Public routes (no auth required)
router.get("/beauticians-nearby", getNearbyBeauticians);
router.get("/service-availability", getServiceAvailability);
router.post("/calculate-distance", calculateDistanceAPI);
router.get("/areas", getServiceAreas);

module.exports = router;
