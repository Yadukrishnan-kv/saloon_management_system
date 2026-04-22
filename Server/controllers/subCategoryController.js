const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category');

// Get all subcategories, optionally filter by category
exports.getAllSubCategories = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const subcategories = await SubCategory.find(filter)
      .populate('category', 'name')
      .sort({ sortOrder: 1, name: 1 });
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new subcategory
exports.createSubCategory = async (req, res) => {
  try {
    const { name, category, sortOrder } = req.body;
    const existing = await SubCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'SubCategory already exists' });
    }
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Parent category not found' });
    }
    const subcategory = await SubCategory.create({
      name,
      category,
      sortOrder
    });
    res.status(201).json(subcategory);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a subcategory
exports.updateSubCategory = async (req, res) => {
  try {
    const { name, isActive, sortOrder, category } = req.body;
    const updateData = { name, isActive, sortOrder, category };
    const subcategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!subcategory) return res.status(404).json({ message: 'SubCategory not found' });
    res.json(subcategory);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a subcategory
exports.deleteSubCategory = async (req, res) => {
  try {
    const subcategory = await SubCategory.findByIdAndDelete(req.params.id);
    if (!subcategory) return res.status(404).json({ message: 'SubCategory not found' });
    res.json({ message: 'SubCategory deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
