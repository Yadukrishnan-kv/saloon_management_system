const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Beautician = require("../models/Beautician");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { validateReview } = require("../utils/validators");

// ─── HELPER: Create admin notification ────────────────────────────────────────
const createAdminNotification = async (title, message, type, data) => {
  const admins = await User.find({ role: { $in: ["Admin", "SuperAdmin"] }, isActive: true });
  for (const admin of admins) {
    await Notification.create({
      user: admin._id,
      title,
      message,
      type,
      forAdmin: true,
      data,
    });
  }
};

// ─── HELPER: Recalculate beautician rating (only approved reviews) ────────────
const recalculateBeauticianRating = async (beauticianId) => {
  const beautician = await Beautician.findById(beauticianId);
  if (!beautician) return;

  const approvedReviews = await Review.find({
    beautician: beauticianId,
    isVisible: true,
    adminApproval: "Approved",
  });

  if (approvedReviews.length > 0) {
    const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
    beautician.rating = Math.round(avgRating * 10) / 10;
    beautician.totalReviews = approvedReviews.length;
  } else {
    beautician.rating = 0;
    beautician.totalReviews = 0;
  }
  await beautician.save();
};

// ─── CREATE REVIEW ────────────────────────────────────────────────────────────
const createReview = async (req, res) => {
  try {
    const { isValid, errors } = validateReview(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const { bookingId, rating, reviewText, serviceRating, beauticianRating } = req.body;

    // Verify booking belongs to customer and is completed
    const booking = await Booking.findOne({
      _id: bookingId,
      customer: req.user._id,
      status: "Completed",
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found or not completed" });
    }

    if (!booking.beautician) {
      return res.status(400).json({ success: false, message: "No beautician assigned to this booking" });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: "Review already submitted for this booking" });
    }

    const review = await Review.create({
      customer: req.user._id,
      beautician: booking.beautician,
      booking: bookingId,
      rating: beauticianRating || rating,
      comment: reviewText || "",
      adminApproval: "Pending", // Reviews need admin approval
    });

    // ── Notify admin about new review for approval ──
    await createAdminNotification(
      "New Review Pending Approval",
      `A new ${review.rating}-star review has been submitted and needs your approval.`,
      "review",
      { reviewId: review._id, bookingId, beauticianId: booking.beautician }
    );

    // NOTE: Rating is NOT updated here - only after admin approval

    res.status(201).json({
      success: true,
      message: "Review submitted successfully. It will be visible after admin approval.",
      review,
    });
  } catch (error) {
    console.error("Create review error:", error);
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

    const reviews = await Review.find({ beautician: beauticianId, isVisible: true, adminApproval: "Approved" })
      .populate("customer", "username profileImage")
      .populate("booking", "services bookingDate")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({ beautician: beauticianId, isVisible: true, adminApproval: "Approved" });

    // Calculate rating distribution (only approved)
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = await Review.countDocuments({
        beautician: beauticianId,
        isVisible: true,
        adminApproval: "Approved",
        rating: i,
      });
    }

    // Calculate average (only approved)
    const allRatings = await Review.find({ beautician: beauticianId, isVisible: true, adminApproval: "Approved" }).select("rating");
    const averageRating =
      allRatings.length > 0
        ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 10) / 10
        : 0;

    res.json({
      success: true,
      reviews,
      averageRating,
      totalReviews,
      ratingDistribution,
    });
  } catch (error) {
    console.error("Get beautician reviews error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET SERVICE REVIEWS ──────────────────────────────────────────────────────
const getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find bookings with this service, then get reviews
    const bookingsWithService = await Booking.find({
      "services.service": serviceId,
      status: "Completed",
    }).select("_id");

    const bookingIds = bookingsWithService.map((b) => b._id);

    const reviews = await Review.find({ booking: { $in: bookingIds }, isVisible: true, adminApproval: "Approved" })
      .populate("customer", "username profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({
      booking: { $in: bookingIds },
      isVisible: true,
      adminApproval: "Approved",
    });

    const allRatings = await Review.find({
      booking: { $in: bookingIds },
      isVisible: true,
      adminApproval: "Approved",
    }).select("rating");

    const averageRating =
      allRatings.length > 0
        ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 10) / 10
        : 0;

    res.json({ success: true, reviews, averageRating, totalReviews });
  } catch (error) {
    console.error("Get service reviews error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET MY REVIEWS ───────────────────────────────────────────────────────────
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.user._id })
      .populate("beautician", "fullName profileImage")
      .populate("booking", "services bookingDate")
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
    // Reset approval status when review is updated
    review.adminApproval = "Pending";
    review.adminApprovedBy = undefined;
    review.adminApprovedAt = undefined;
    await review.save();

    // Recalculate beautician rating (only approved reviews)
    await recalculateBeauticianRating(review.beautician);

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

    const beauticianId = review.beautician;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate beautician rating (only approved reviews)
    await recalculateBeauticianRating(beauticianId);

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createReview,
  getBeauticianReviews,
  getServiceReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
