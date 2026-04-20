const Category = require('../models/Category');

// Get all categories
// Helper to get full image URL
const getFullUrl = (req, imagePath) => {
  if (!imagePath) return imagePath;
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  return imagePath.startsWith("/uploads") ? `${baseUrl}${imagePath}` : imagePath;
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    // Map image field to full URL
    const categoriesWithFullImages = categories.map(cat => {
      const obj = cat.toObject();
      obj.image = getFullUrl(req, obj.image);
      return obj;
    });
    res.json(categoriesWithFullImages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, sortOrder } = req.body;
    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    const category = await Category.create({
      name,
      image: req.file ? `/uploads/${req.file.filename}` : undefined,
      sortOrder
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { name, isActive, sortOrder } = req.body;
    const updateData = { name, isActive, sortOrder };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
