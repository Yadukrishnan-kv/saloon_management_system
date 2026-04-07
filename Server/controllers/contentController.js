const Banner = require("../models/Banner");
const Complaint = require("../models/Complaint");
const Review = require("../models/Review");
const Beautician = require("../models/Beautician");
const StaticContent = require("../models/StaticContent");

const DEFAULT_STATIC_CONTENT = [
  { key: "about", title: "About Us", content: "" },
  { key: "privacy-policy", title: "Privacy Policy", content: "" },
  { key: "terms-and-conditions", title: "Terms & Conditions", content: "" },
  { key: "cancellation-policy", title: "Cancellation Policy", content: "" },
];

const ensureStaticContentSeeds = async () => {
  const existing = await StaticContent.find({}, "key").lean();
  const existingKeys = new Set(existing.map((item) => item.key));
  const missing = DEFAULT_STATIC_CONTENT.filter((item) => !existingKeys.has(item.key));

  if (missing.length > 0) {
    await StaticContent.insertMany(missing, { ordered: false });
  }
};

// ===== BANNERS =====

const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createBanner = async (req, res) => {
  try {
    const { title, description, image, link, isActive, sortOrder, startDate, endDate } = req.body;

    const banner = await Banner.create({
      title,
      description,
      image,
      link,
      isActive,
      sortOrder,
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ===== STATIC CONTENT =====

const getStaticContent = async (req, res) => {
  try {
    await ensureStaticContentSeeds();
    const pages = await StaticContent.find().sort({ title: 1 });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const upsertStaticContent = async (req, res) => {
  try {
    const { key, title, content } = req.body;

    if (!key || !title) {
      return res.status(400).json({ message: "Key and title are required" });
    }

    const page = await StaticContent.findOneAndUpdate(
      { key },
      { key, title, content: content || "", updatedBy: req.user._id },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json(page);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ===== COMPLAINTS =====

const getAllComplaints = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const query = {};

    if (req.user.role === "Customer") {
      query.user = req.user._id;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const complaints = await Complaint.find(query)
      .populate("user", "username email role")
      .populate("booking", "bookingDate status")
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createComplaint = async (req, res) => {
  try {
    const { subject, description, category, booking, priority } = req.body;

    const complaint = await Complaint.create({
      user: req.user._id,
      subject,
      description,
      category,
      booking,
      priority,
    });

    const populated = await Complaint.findById(complaint._id).populate("user", "username email");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const resolveComplaint = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminResponse,
        resolvedBy: req.user._id,
        resolvedAt: status === "Resolved" ? new Date() : undefined,
      },
      { new: true }
    ).populate("user", "username email");

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ===== REVIEWS =====

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("customer", "username")
      .populate("beautician", "fullName")
      .populate("booking", "bookingDate")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createReview = async (req, res) => {
  try {
    const { beauticianId, bookingId, rating, comment, images } = req.body;

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: "Review already submitted for this booking" });
    }

    const review = await Review.create({
      customer: req.user._id,
      beautician: beauticianId,
      booking: bookingId,
      rating,
      comment,
      images,
    });

    // Update beautician rating
    const reviews = await Review.find({ beautician: beauticianId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Beautician.findByIdAndUpdate(beauticianId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });

    const populated = await Review.findById(review._id)
      .populate("customer", "username")
      .populate("beautician", "fullName");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getBeauticianReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ beautician: req.params.beauticianId, isVisible: true })
      .populate("customer", "username profileImage")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getStaticContent,
  upsertStaticContent,
  getAllComplaints,
  createComplaint,
  resolveComplaint,
  getAllReviews,
  createReview,
  getBeauticianReviews,
};
