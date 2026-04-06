const ServiceCategory = require("../models/ServiceCategory");
const Service = require("../models/Service");

// ===== CATEGORIES =====

const getAllCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find().sort({ sortOrder: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, image, sortOrder } = req.body;

    const existing = await ServiceCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await ServiceCategory.create({ name, description, image, sortOrder });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description, image, isActive, sortOrder } = req.body;

    const category = await ServiceCategory.findByIdAndUpdate(
      req.params.id,
      { name, description, image, isActive, sortOrder },
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    // Check if services exist under this category
    const serviceCount = await Service.countDocuments({ category: req.params.id });
    if (serviceCount > 0) {
      return res.status(400).json({
        message: "Cannot delete category with existing services. Remove services first.",
      });
    }

    const category = await ServiceCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
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

    res.json(services);
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
    const { name, description, category, price, pricingType, duration, image, discount, tags } = req.body;

    const categoryExists = await ServiceCategory.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const service = await Service.create({
      name,
      description,
      category,
      price,
      pricingType,
      duration,
      image,
      discount,
      tags,
    });

    const populated = await Service.findById(service._id).populate("category", "name");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
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
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllServices,
  getServicesByCategory,
  createService,
  updateService,
  deleteService,
};
