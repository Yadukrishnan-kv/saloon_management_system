const ServiceCategory = require("../models/ServiceCategory");
const Service = require("../models/Service");

// ===== CATEGORIES =====

const getAllCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find()
      .populate("parentCategory", "name")
      .sort({ parentCategory: 1, sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, sortOrder, parentCategory } = req.body;

    const existing = await ServiceCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    if (parentCategory) {
      const parentExists = await ServiceCategory.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({ message: "Parent category not found" });
      }
    }

    const category = await ServiceCategory.create({
      name,
      image: req.file ? `/uploads/${req.file.filename}` : undefined,
      sortOrder,
      parentCategory: parentCategory || null,
    });
    const populated = await ServiceCategory.findById(category._id).populate("parentCategory", "name");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, isActive, sortOrder, parentCategory } = req.body;

    if (parentCategory) {
      if (parentCategory === req.params.id) {
        return res.status(400).json({ message: "A category cannot be its own parent" });
      }

      const parentExists = await ServiceCategory.findById(parentCategory);
      if (!parentExists) {
        return res.status(400).json({ message: "Parent category not found" });
      }
    }

    const updateData = { name, isActive, sortOrder, parentCategory: parentCategory || null };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const category = await ServiceCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("parentCategory", "name");

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

    const childCategoryCount = await ServiceCategory.countDocuments({ parentCategory: req.params.id });
    if (childCategoryCount > 0) {
      return res.status(400).json({
        message: "Cannot delete category with subcategories. Remove or reassign subcategories first.",
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
    const { name, description, category, price, pricingType, duration, discount, tags } = req.body;

    const categoryExists = await ServiceCategory.findById(category);
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
