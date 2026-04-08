const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const User = require("../models/User");

// ─── CREATE COMPLAINT ─────────────────────────────────────────────────────────
const createComplaint = async (req, res) => {
  try {
    const { subject, description, category, bookingId } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: "Subject and description are required" });
    }

    const complaint = await Complaint.create({
      user: req.user._id,
      booking: bookingId || null,
      subject,
      description,
      category: category || "Other",
    });

    // Notify admin about new complaint
    const admins = await User.find({ role: { $in: ["Admin", "SuperAdmin"] }, isActive: true });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: "New Complaint Received",
        message: `${req.user.username} submitted a complaint: ${subject}`,
        type: "system",
        forAdmin: true,
        data: { actionUrl: `/admin/complaints/${complaint._id}` },
      });
    }

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint: {
        _id: complaint._id,
        subject: complaint.subject,
        status: complaint.status,
        category: complaint.category,
        createdAt: complaint.createdAt,
      },
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET MY COMPLAINTS ────────────────────────────────────────────────────────
const getMyComplaints = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate("booking", "bookingDate status services")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      complaints,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get complaints error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET COMPLAINT BY ID ──────────────────────────────────────────────────────
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.complaintId,
      user: req.user._id,
    }).populate("booking", "bookingDate status services beautician");

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    res.json({ success: true, complaint });
  } catch (error) {
    console.error("Get complaint by ID error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
};
