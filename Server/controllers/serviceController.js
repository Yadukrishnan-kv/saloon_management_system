const Service = require("../models/Service");
const Category = require("../models/Category");

// Helper to get full image URL
const getFullUrl = (req, imagePath) => {
  if (!imagePath) return imagePath;
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  return imagePath.startsWith("/uploads") ? `${baseUrl}${imagePath}` : imagePath;
};

// ===== SERVICES =====


const Review = require("../models/Review");
const getAllServices = async (req, res) => {
  try {
    const { category, active, search } = req.query;
    const query = {};
    if (category) query.category = category;
    if (active !== undefined) query.isActive = active === "true";
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    const CuratedService = require("../models/CuratedService");
    const services = await Service.find(query)
      .populate("category", "name")
      .populate("beautician");
    // For each service, fetch curated services for the beautician and ratings for the service
    const servicesWithCurated = await Promise.all(services.map(async (svc) => {
      const obj = svc.toObject();
      obj.image1 = getFullUrl(req, obj.image1);
      obj.image2 = getFullUrl(req, obj.image2);
      if (obj.beautician && obj.beautician._id) {
        obj.beauticianCuratedServices = await CuratedService.find({ beautician: obj.beautician._id, isActive: true });
      } else {
        obj.beauticianCuratedServices = [];
      }
      // Add ratings for this service
      const ratings = await Review.find({ service: obj._id }).select("rating customer createdAt");
      obj.ratings = ratings;
      obj.averageRating = ratings.length > 0 ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10 : 0;
      return obj;
    }));
    res.json(servicesWithCurated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


const getServicesByCategory = async (req, res) => {
  try {
    const services = await Service.find({
      category: req.params.categoryId,
      isActive: true,
    })
      .populate("category", "name")
      .populate("beautician", "fullName phoneNumber profileImage rating tier");
    // Add ratings for each service
    const Review = require("../models/Review");
    const servicesWithRatings = await Promise.all(services.map(async (svc) => {
      const obj = svc.toObject();
      const ratings = await Review.find({ service: obj._id }).select("rating customer createdAt");
      obj.ratings = ratings;
      obj.averageRating = ratings.length > 0 ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10 : 0;
      return obj;
    }));
    res.json(servicesWithRatings);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createService = async (req, res) => {
  try {
    const { name, description, category, price, pricingType, duration, discount, tags, beautician } = req.body;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category" });
    }
    if (!beautician) {
      return res.status(400).json({ message: "Beautician is required" });
    }

    const serviceData = {
      name,
      description,
      category,
      price,
      pricingType,
      duration,
      discount,
      tags,
      beautician,
    };

    if (req.files && req.files.length > 0) {
      serviceData.image1 = `/uploads/${req.files[0].filename}`;
      if (req.files.length > 1) {
        serviceData.image2 = `/uploads/${req.files[1].filename}`;
      }
    }

    const service = await Service.create(serviceData);
    const populated = await Service.findById(service._id)
      .populate("category", "name")
      .populate("beautician", "fullName phoneNumber profileImage rating tier");
    // Map image fields to full URLs and include beautician details
    const obj = populated.toObject();
    obj.image1 = getFullUrl(req, obj.image1);
    obj.image2 = getFullUrl(req, obj.image2);
    res.status(201).json(obj);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateService = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.files && req.files.length > 0) {
      updateData.image1 = `/uploads/${req.files[0].filename}`;
      if (req.files.length > 1) {
        updateData.image2 = `/uploads/${req.files[1].filename}`;
      }
    }
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("category", "name").populate("beautician", "fullName phoneNumber profileImage rating tier");
    if (!service) return res.status(404).json({ message: "Service not found" });
    // Map image fields to full URLs and include beautician details
    if (!service) return res.status(404).json({ message: "Service not found" });
    const obj = service.toObject();
    obj.image1 = getFullUrl(req, obj.image1);
    obj.image2 = getFullUrl(req, obj.image2);
    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllServices,
  getServicesByCategory,
  createService,
  updateService,
  deleteService,
};
