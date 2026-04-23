const CuratedService = require('../models/CuratedService');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// Create Curated Service
exports.createCuratedService = async (req, res) => {
  try {
    const data = req.body;
    if (req.files) {
      if (req.files.image1) data.image1 = req.files.image1[0].filename;
      if (req.files.image2) data.image2 = req.files.image2[0].filename;
    }
    const curatedService = await CuratedService.create(data);
    const populated = await CuratedService.findById(curatedService._id)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('beautician', 'fullName phoneNumber profileImage rating tier');
    // Map image fields to full URLs and include beautician details
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const obj = populated.toObject();
    obj.image1 = obj.image1 ? (obj.image1.startsWith("/uploads") ? `${baseUrl}${obj.image1}` : obj.image1) : obj.image1;
    obj.image2 = obj.image2 ? (obj.image2.startsWith("/uploads") ? `${baseUrl}${obj.image2}` : obj.image2) : obj.image2;
    res.status(201).json({ success: true, curatedService: obj });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


const Review = require('../models/Review');
exports.getAllCuratedServices = async (req, res) => {
  try {
    const curatedServices = await CuratedService.find()
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('beautician', 'fullName phoneNumber profileImage rating tier');
    // Add ratings for each curated service
    const withRatings = await Promise.all(curatedServices.map(async (svc) => {
      const obj = svc.toObject();
      const ratings = await Review.find({ curatedService: obj._id }).select('rating customer createdAt');
      obj.ratings = ratings;
      obj.averageRating = ratings.length > 0 ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10 : 0;
      return obj;
    }));
    res.json({ success: true, curatedServices: withRatings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getCuratedServiceById = async (req, res) => {
  try {
    const curatedService = await CuratedService.findById(req.params.id)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('beautician', 'fullName phoneNumber profileImage rating tier');
    if (!curatedService) return res.status(404).json({ success: false, message: 'Not found' });
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const obj = curatedService.toObject();
    obj.image1 = obj.image1 ? (obj.image1.startsWith("/uploads") ? `${baseUrl}${obj.image1}` : obj.image1) : obj.image1;
    obj.image2 = obj.image2 ? (obj.image2.startsWith("/uploads") ? `${baseUrl}${obj.image2}` : obj.image2) : obj.image2;
    // Add ratings for this curated service
    const ratings = await Review.find({ curatedService: obj._id }).select('rating customer createdAt');
    obj.ratings = ratings;
    obj.averageRating = ratings.length > 0 ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10 : 0;
    res.json({ success: true, curatedService: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Curated Service
exports.updateCuratedService = async (req, res) => {
  try {
    const data = req.body;
    if (req.files) {
      if (req.files.image1) data.image1 = req.files.image1[0].filename;
      if (req.files.image2) data.image2 = req.files.image2[0].filename;
    }
    const curatedService = await CuratedService.findByIdAndUpdate(req.params.id, data, { new: true })
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('beautician', 'fullName phoneNumber profileImage rating tier');
    if (!curatedService) return res.status(404).json({ success: false, message: 'Not found' });
    // Map image fields to full URLs and include beautician details
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const obj = curatedService.toObject();
    obj.image1 = obj.image1 ? (obj.image1.startsWith("/uploads") ? `${baseUrl}${obj.image1}` : obj.image1) : obj.image1;
    obj.image2 = obj.image2 ? (obj.image2.startsWith("/uploads") ? `${baseUrl}${obj.image2}` : obj.image2) : obj.image2;
    res.json({ success: true, curatedService: obj });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Curated Service
exports.deleteCuratedService = async (req, res) => {
  try {
    const curatedService = await CuratedService.findByIdAndDelete(req.params.id);
    if (!curatedService) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
