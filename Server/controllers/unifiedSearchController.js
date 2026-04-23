const Service = require("../models/Service");
const CuratedService = require("../models/CuratedService");
const Beautician = require("../models/Beautician");

// Unified search for services, curated services, and beauticians
const unifiedSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    // Only search by name fields, and only return the first matching result for the type that matches
    // 1. Try Service name
    const service = await Service.findOne({
      isActive: true,
      name: { $regex: `^${query}$`, $options: "i" }
    })
      .populate("category", "name")
      .populate("subCategory", "name")
      .populate("beautician");

    if (service) {
      return res.json({ success: true, type: "service", service });
    }

    // 2. Try CuratedService name
    const curatedService = await CuratedService.findOne({
      isActive: true,
      curatedServiceName: { $regex: `^${query}$`, $options: "i" }
    })
      .populate("category", "name")
      .populate("subCategory", "name")
      .populate("beautician", "fullName phoneNumber profileImage rating tier");

    if (curatedService) {
      return res.json({ success: true, type: "curatedService", curatedService });
    }

    // 3. Try Beautician name
    const beautician = await Beautician.findOne({
      fullName: { $regex: `^${query}$`, $options: "i" },
      isVerified: true,
      status: "Active",
    })
      .populate("user", "username email");

    if (beautician) {
      return res.json({ success: true, type: "beautician", beautician });
    }

    // If nothing found
    return res.json({ success: false, message: "No result found for the given name" });
  } catch (error) {
    console.error("Unified search error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { unifiedSearch };