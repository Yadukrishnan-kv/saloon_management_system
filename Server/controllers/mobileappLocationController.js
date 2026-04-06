const Beautician = require("../models/Beautician");
const Availability = require("../models/Availability");
const Service = require("../models/Service");
const { calculateDistance, estimateTravelDuration, isWithinRadius } = require("../utils/geolocation");

// ─── NEARBY BEAUTICIANS ──────────────────────────────────────────────────────
const getNearbyBeauticians = async (req, res) => {
  try {
    const { latitude, longitude, serviceId, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required" });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    // Find active, verified beauticians
    const query = {
      isVerified: true,
      status: "Active",
      "location.coordinates.lat": { $exists: true },
      "location.coordinates.lng": { $exists: true },
    };

    const beauticians = await Beautician.find(query)
      .populate("user", "username profileImage")
      .select("fullName rating totalReviews profileImage skills location availability");

    // Filter by distance and calculate
    const nearbyBeauticians = beauticians
      .map((b) => {
        const distance = calculateDistance(
          lat,
          lng,
          b.location.coordinates.lat,
          b.location.coordinates.lng
        );
        return {
          _id: b._id,
          name: b.fullName,
          profileImage: b.profileImage || b.user?.profileImage,
          rating: b.rating,
          totalReviews: b.totalReviews,
          skills: b.skills,
          distance: Math.round(distance * 10) / 10,
          availability: b.availability,
        };
      })
      .filter((b) => b.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({ success: true, beauticians: nearbyBeauticians });
  } catch (error) {
    console.error("Nearby beauticians error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── SERVICE AVAILABILITY ────────────────────────────────────────────────────
const getServiceAvailability = async (req, res) => {
  try {
    const { latitude, longitude, serviceId, date, time } = req.query;

    if (!latitude || !longitude || !serviceId) {
      return res.status(400).json({
        success: false,
        message: "Latitude, longitude, and serviceId are required",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Find nearest available beautician
    const beauticians = await Beautician.find({
      isVerified: true,
      status: "Active",
      "location.coordinates.lat": { $exists: true },
      "location.coordinates.lng": { $exists: true },
    }).select("fullName location rating");

    let nearestBeautician = null;
    let minDistance = Infinity;

    for (const b of beauticians) {
      const dist = calculateDistance(lat, lng, b.location.coordinates.lat, b.location.coordinates.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestBeautician = {
          _id: b._id,
          name: b.fullName,
          distance: Math.round(dist * 10) / 10,
          rating: b.rating,
        };
      }
    }

    const estimatedArrival = nearestBeautician
      ? estimateTravelDuration(minDistance)
      : null;

    res.json({
      success: true,
      available: !!nearestBeautician,
      nearestBeautician,
      estimatedArrival: estimatedArrival ? `${estimatedArrival} minutes` : null,
    });
  } catch (error) {
    console.error("Service availability error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── CALCULATE DISTANCE ──────────────────────────────────────────────────────
const calculateDistanceAPI = async (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return res.status(400).json({
        success: false,
        message: "Origin and destination coordinates are required",
      });
    }

    const distance = calculateDistance(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    const duration = estimateTravelDuration(distance);

    // Estimated travel cost (configurable rate per km)
    const ratePerKm = 10; // INR per km
    const estimatedCost = Math.round(distance * ratePerKm);

    res.json({
      success: true,
      distance: Math.round(distance * 10) / 10,
      duration: `${duration} minutes`,
      estimatedCost,
    });
  } catch (error) {
    console.error("Calculate distance error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET SERVICE AREAS ────────────────────────────────────────────────────────
const getServiceAreas = async (req, res) => {
  try {
    // Get unique cities/pincodes from active beauticians
    const beauticians = await Beautician.find({
      isVerified: true,
      status: "Active",
    }).select("location.city location.pincode");

    const areasMap = new Map();
    beauticians.forEach((b) => {
      if (b.location?.city) {
        const key = `${b.location.city}-${b.location.pincode || ""}`;
        if (!areasMap.has(key)) {
          areasMap.set(key, {
            name: b.location.city,
            pincode: b.location.pincode || "",
            serviceAvailable: true,
          });
        }
      }
    });

    const areas = Array.from(areasMap.values());

    res.json({ success: true, areas });
  } catch (error) {
    console.error("Get service areas error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getNearbyBeauticians,
  getServiceAvailability,
  calculateDistanceAPI,
  getServiceAreas,
};
