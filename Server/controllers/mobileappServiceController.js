const Service = require("../models/Service");
const ServiceCategory = require("../models/ServiceCategory");
const ServiceAddon = require("../models/ServiceAddon");
const Beautician = require("../models/Beautician");
const Review = require("../models/Review");
const Banner = require("../models/Banner");

// ─── GET ALL CATEGORIES ───────────────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find({ isActive: true }).sort({ sortOrder: 1 });

    // Get service count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const serviceCount = await Service.countDocuments({ category: cat._id, isActive: true });
        return {
          _id: cat._id,
          name: cat.name,
          description: cat.description,
          icon: cat.image,
          image: cat.image,
          serviceCount,
        };
      })
    );

    res.json({ success: true, categories: categoriesWithCount });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET CATEGORY WITH SERVICES ───────────────────────────────────────────────
const getCategoryServices = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await ServiceCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const services = await Service.find({ category: categoryId, isActive: true }).sort({ name: 1 });

    res.json({ success: true, category, services });
  } catch (error) {
    console.error("Get category services error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET ALL SERVICES ─────────────────────────────────────────────────────────
const getAllServices = async (req, res) => {
  try {
    const { categoryId, search, minPrice, maxPrice, sortBy } = req.query;
    const query = { isActive: true };

    if (categoryId) query.category = categoryId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sortOption = { name: 1 };
    if (sortBy === "price_low") sortOption = { price: 1 };
    else if (sortBy === "price_high") sortOption = { price: -1 };
    else if (sortBy === "popular") sortOption = { createdAt: -1 };
    else if (sortBy === "duration") sortOption = { duration: 1 };

    const services = await Service.find(query)
      .populate("category", "name")
      .sort(sortOption);

    const total = await Service.countDocuments(query);

    res.json({ success: true, services, total });
  } catch (error) {
    console.error("Get all services error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET SINGLE SERVICE ──────────────────────────────────────────────────────
const getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId).populate("category", "name");
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Get beauticians who offer this service skill
    const beauticians = await Beautician.find({
      isVerified: true,
      status: "Active",
    })
      .select("fullName rating totalReviews profileImage experience skills")
      .limit(10);

    res.json({
      success: true,
      service: {
        _id: service._id,
        name: service.name,
        description: service.description,
        price: service.price,
        pricingType: service.pricingType,
        duration: service.duration,
        image: service.image,
        category: service.category,
        discount: service.discount,
        tags: service.tags,
        beauticians,
      },
    });
  } catch (error) {
    console.error("Get service error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── SEARCH SERVICES ──────────────────────────────────────────────────────────
const searchServices = async (req, res) => {
  try {
    const { query: searchQuery, location, date, time } = req.query;

    if (!searchQuery) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const services = await Service.find({
      isActive: true,
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { tags: { $regex: searchQuery, $options: "i" } },
      ],
    })
      .populate("category", "name")
      .limit(20);

    // Get available beauticians
    const availableBeauticians = await Beautician.find({
      isVerified: true,
      status: "Active",
    })
      .select("fullName rating totalReviews profileImage skills location")
      .limit(10);

    res.json({ success: true, services, availableBeauticians });
  } catch (error) {
    console.error("Search services error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── POPULAR SERVICES ─────────────────────────────────────────────────────────
const getPopularServices = async (req, res) => {
  try {
    // Get services with most bookings
    const services = await Service.find({ isActive: true })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, popularServices: services });
  } catch (error) {
    console.error("Popular services error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── ACTIVE OFFERS ────────────────────────────────────────────────────────────
const getOffers = async (req, res) => {
  try {
    // Services with active discounts
    const services = await Service.find({
      isActive: true,
      discount: { $gt: 0 },
    })
      .populate("category", "name")
      .sort({ discount: -1 });

    // Active promotional banners
    const banners = await Banner.find({
      isActive: true,
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: null },
      ],
    }).sort({ sortOrder: 1 });

    res.json({
      success: true,
      activeOffers: {
        discountedServices: services,
        banners,
      },
    });
  } catch (error) {
    console.error("Get offers error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET SUB-CATEGORIES ───────────────────────────────────────────────────────
const getSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const parentCategory = await ServiceCategory.findById(categoryId);
    if (!parentCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const subCategories = await ServiceCategory.find({
      parentCategory: categoryId,
      isActive: true,
    }).sort({ sortOrder: 1 });

    res.json({ success: true, parentCategory, subCategories });
  } catch (error) {
    console.error("Get sub-categories error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET SERVICE ADD-ONS ──────────────────────────────────────────────────────
const getServiceAddons = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Find add-ons that apply to this service or its category (or all services)
    const addons = await ServiceAddon.find({
      isActive: true,
      $or: [
        { applicableServices: serviceId },
        { applicableCategories: service.category },
        { applicableServices: { $size: 0 }, applicableCategories: { $size: 0 } },
      ],
    }).sort({ sortOrder: 1 });

    res.json({ success: true, addons });
  } catch (error) {
    console.error("Get service addons error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── HOME DASHBOARD (Aggregate endpoint) ─────────────────────────────────────
const getHomeDashboard = async (req, res) => {
  try {
    // Active banners
    const banners = await Banner.find({
      isActive: true,
      $or: [{ endDate: { $gte: new Date() } }, { endDate: null }],
    })
      .sort({ sortOrder: 1 })
      .limit(5);

    // Service categories
    const categories = await ServiceCategory.find({
      isActive: true,
      parentCategory: null,
    }).sort({ sortOrder: 1 });

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const serviceCount = await Service.countDocuments({ category: cat._id, isActive: true });
        return {
          _id: cat._id,
          name: cat.name,
          description: cat.description,
          image: cat.image,
          serviceCount,
        };
      })
    );

    // Popular / curated services
    const popularServices = await Service.find({ isActive: true })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    // Active offers
    const offers = await Service.find({ isActive: true, discount: { $gt: 0 } })
      .populate("category", "name")
      .sort({ discount: -1 })
      .limit(5);

    res.json({
      success: true,
      dashboard: {
        banners,
        categories: categoriesWithCount,
        popularServices,
        offers,
      },
    });
  } catch (error) {
    console.error("Home dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET LOCATION FROM COORDINATES ────────────────────────────────────────────
const getLocationFromCoordinates = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required" });
    }

    // For now, return a mock location. In production, use a geocoding service.
    const location = {
      address: "Mock Address, City, State, Country",
      city: "City",
      state: "State",
      country: "Country",
      postalCode: "123456"
    };

    res.json({ success: true, location });
  } catch (error) {
    console.error("Get location error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
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
};
