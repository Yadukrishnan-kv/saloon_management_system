const Service = require("../models/Service");
const Category = require("../models/Category");

// Helper to get full image URL
const getFullUrl = (req, imagePath) => {
  if (!imagePath) return imagePath;
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  return imagePath.startsWith("/uploads") ? `${baseUrl}${imagePath}` : imagePath;
};

// ===== SERVICES =====

const getAllServices = async (req, res) => {
  try {
    const { category, active, search } = req.query;

    const query = {};
    if (category) query.category = category;
    if (active !== undefined) query.isActive = active === "true";
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const services = await Service.find(query)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    // Map image fields to full URLs
    const servicesWithFullImages = services.map((svc) => {
      const obj = svc.toObject();
      obj.image1 = getFullUrl(req, obj.image1);
      obj.image2 = getFullUrl(req, obj.image2);
      return obj;
    });

    res.json(servicesWithFullImages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getServicesByCategory = async (req, res) => {
  try {
    const services = await Service.find({
      category: req.params.categoryId,
      isActive: true,
    }).populate("category", "name");

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createService = async (req, res) => {
  try {
    const { name, description, category, price, pricingType, duration, discount, tags } = req.body;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category" });
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
    };

    if (req.files && req.files.length > 0) {
      serviceData.image1 = `/uploads/${req.files[0].filename}`;
      if (req.files.length > 1) {
        serviceData.image2 = `/uploads/${req.files[1].filename}`;
      }
    }

    const service = await Service.create(serviceData);
    const populated = await Service.findById(service._id).populate("category", "name");
    res.status(201).json(populated);
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
    
    const service = await Service.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("category", "name");

    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
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
