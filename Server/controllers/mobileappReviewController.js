const Review = require("../models/Review");
const Beautician = require("../models/Beautician");
const Service = require("../models/Service");
const CuratedService = require("../models/CuratedService");



// ─── HELPER: Recalculate average rating for beautician/service/curatedService ─
const recalculateAverageRating = async (type, id) => {
  let filter = {};
  if (type === 'beautician') filter = { beautician: id };
  if (type === 'service') filter = { service: id };
  if (type === 'curatedService') filter = { curatedService: id };
  const reviews = await Review.find(filter);
  const avg = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;
  const rounded = Math.round(avg * 10) / 10;
  if (type === 'beautician') await Beautician.findByIdAndUpdate(id, { rating: rounded });
  if (type === 'service') await Service.findByIdAndUpdate(id, { rating: rounded });
  if (type === 'curatedService') await CuratedService.findByIdAndUpdate(id, { rating: rounded });
};


// ─── CREATE BEAUTICIAN REVIEW ────────────────────────────────────────────────
const createBeauticianReview = async (req, res) => {
  try {
    const { beauticianId, rating, reviewText } = req.body;
    if (!beauticianId || !rating) {
      return res.status(400).json({ success: false, message: "BeauticianId and rating are required" });
    }
    // Only one review per customer per beautician
    const exists = await Review.findOne({ beautician: beauticianId, customer: req.user._id });
    if (exists) {
      return res.status(400).json({ success: false, message: "You have already reviewed this beautician" });
    }
    const review = await Review.create({
      customer: req.user._id,
      beautician: beauticianId,
      rating,
      comment: reviewText || ""
    });
    await recalculateAverageRating('beautician', beauticianId);
    res.status(201).json({ success: true, message: "Review submitted successfully.", review });
  } catch (error) {
    console.error("Create beautician review error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── RATE SERVICE ────────────────────────────────────────────────────────────
const rateService = async (req, res) => {
  try {
    const { serviceId, rating } = req.body;
    if (!serviceId || !rating) {
      return res.status(400).json({ success: false, message: "ServiceId and rating are required" });
    }
    // Only one rating per customer per service
    const exists = await Review.findOne({ service: serviceId, customer: req.user._id });
    if (exists) {
      return res.status(400).json({ success: false, message: "You have already rated this service" });
    }
    const review = await Review.create({
      customer: req.user._id,
      service: serviceId,
      rating
    });
    await recalculateAverageRating('service', serviceId);
    res.status(201).json({ success: true, message: "Service rated successfully.", review });
  } catch (error) {
    console.error("Rate service error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── RATE CURATED SERVICE ────────────────────────────────────────────────────
const rateCuratedService = async (req, res) => {
  try {
    const { curatedServiceId, rating } = req.body;
    if (!curatedServiceId || !rating) {
      return res.status(400).json({ success: false, message: "CuratedServiceId and rating are required" });
    }
    // Only one rating per customer per curated service
    const exists = await Review.findOne({ curatedService: curatedServiceId, customer: req.user._id });
    if (exists) {
      return res.status(400).json({ success: false, message: "You have already rated this curated service" });
    }
    const review = await Review.create({
      customer: req.user._id,
      curatedService: curatedServiceId,
      rating
    });
    await recalculateAverageRating('curatedService', curatedServiceId);
    res.status(201).json({ success: true, message: "Curated service rated successfully.", review });
  } catch (error) {
    console.error("Rate curated service error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ─── GET BEAUTICIAN REVIEWS ──────────────────────────────────────────────────
const getBeauticianReviews = async (req, res) => {
  try {
    const { beauticianId } = req.params;
    const { page = 1, limit = 10, sortBy } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let sortOption = { createdAt: -1 };
    if (sortBy === "rating_high") sortOption = { rating: -1 };
    else if (sortBy === "rating_low") sortOption = { rating: 1 };
    else if (sortBy === "oldest") sortOption = { createdAt: 1 };
    const reviews = await Review.find({ beautician: beauticianId })
      .populate("customer", "username profileImage")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    const totalReviews = await Review.countDocuments({ beautician: beauticianId });
    // Calculate average
    const allRatings = await Review.find({ beautician: beauticianId }).select("rating");
    const averageRating =
      allRatings.length > 0
        ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 10) / 10
        : 0;
    res.json({
      success: true,
      reviews,
      averageRating,
      totalReviews
    });
  } catch (error) {
    console.error("Get beautician reviews error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ─── GET SERVICE RATINGS ─────────────────────────────────────────────────────
const getServiceRatings = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const ratings = await Review.find({ service: serviceId })
      .populate("customer", "username profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const totalRatings = await Review.countDocuments({ service: serviceId });
    const allRatings = await Review.find({ service: serviceId }).select("rating");
    const averageRating =
      allRatings.length > 0
        ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 10) / 10
        : 0;
    res.json({ success: true, ratings, averageRating, totalRatings });
  } catch (error) {
    console.error("Get service ratings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET CURATED SERVICE RATINGS ─────────────────────────────────────────────
const getCuratedServiceRatings = async (req, res) => {
  try {
    const { curatedServiceId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const ratings = await Review.find({ curatedService: curatedServiceId })
      .populate("customer", "username profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const totalRatings = await Review.countDocuments({ curatedService: curatedServiceId });
    const allRatings = await Review.find({ curatedService: curatedServiceId }).select("rating");
    const averageRating =
      allRatings.length > 0
        ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 10) / 10
        : 0;
    res.json({ success: true, ratings, averageRating, totalRatings });
  } catch (error) {
    console.error("Get curated service ratings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ─── GET MY REVIEWS ───────────────────────────────────────────────────────────
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.user._id })
      .populate("beautician", "fullName profileImage")
      .populate("service", "name")
      .populate("curatedService", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    console.error("Get my reviews error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ─── UPDATE REVIEW ────────────────────────────────────────────────────────────
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;

    const review = await Review.findOne({ _id: reviewId, customer: req.user._id });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (rating) review.rating = rating;
    if (reviewText !== undefined) review.comment = reviewText;

    await review.save();

    // Recalculate average rating for the correct type
    if (review.beautician) await recalculateAverageRating('beautician', review.beautician);
    if (review.service) await recalculateAverageRating('service', review.service);
    if (review.curatedService) await recalculateAverageRating('curatedService', review.curatedService);

    res.json({ success: true, message: "Review updated successfully", review });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ─── DELETE REVIEW ────────────────────────────────────────────────────────────
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({ _id: reviewId, customer: req.user._id });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Save reference for recalculation before deleting
    const beauticianId = review.beautician;
    const serviceId = review.service;
    const curatedServiceId = review.curatedService;

    await Review.findByIdAndDelete(reviewId);

    // Recalculate average rating for the correct type
    if (beauticianId) await recalculateAverageRating('beautician', beauticianId);
    if (serviceId) await recalculateAverageRating('service', serviceId);
    if (curatedServiceId) await recalculateAverageRating('curatedService', curatedServiceId);

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createBeauticianReview,
  rateService,
  rateCuratedService,
  getBeauticianReviews,
  getServiceRatings,
  getCuratedServiceRatings,
  getMyReviews,
  updateReview,
  deleteReview,
};
