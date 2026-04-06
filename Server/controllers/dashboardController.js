const Booking = require("../models/Booking");
const User = require("../models/User");
const Beautician = require("../models/Beautician");
const Service = require("../models/Service");
const Review = require("../models/Review");
const Complaint = require("../models/Complaint");

const getMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "Customer" });
    const totalBeauticians = await Beautician.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({
      status: { $in: ["Requested", "Assigned", "Accepted", "InProgress"] },
    });
    const pendingVerifications = await Beautician.countDocuments({ verificationStatus: "Pending" });
    const totalServices = await Service.countDocuments();
    const openComplaints = await Complaint.countDocuments({ status: { $in: ["Open", "InProgress"] } });

    // Revenue
    const completedBookings = await Booking.find({ status: "Completed" });
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.finalAmount, 0);

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await Booking.countDocuments({
      bookingDate: { $gte: today, $lt: tomorrow },
    });

    const todayRevenue = await Booking.find({
      status: "Completed",
      completedAt: { $gte: today, $lt: tomorrow },
    });
    const todayRevenueTotal = todayRevenue.reduce((sum, b) => sum + b.finalAmount, 0);

    res.json({
      totalUsers,
      totalBeauticians,
      totalBookings,
      activeBookings,
      pendingVerifications,
      totalServices,
      openComplaints,
      totalRevenue,
      todayBookings,
      todayRevenue: todayRevenueTotal,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getRevenue = async (req, res) => {
  try {
    const { period = "monthly" } = req.query;

    let groupBy;
    if (period === "daily") {
      groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } };
    } else if (period === "weekly") {
      groupBy = { $isoWeek: "$completedAt" };
    } else {
      groupBy = { $dateToString: { format: "%Y-%m", date: "$completedAt" } };
    }

    const revenue = await Booking.aggregate([
      { $match: { status: "Completed", completedAt: { $exists: true } } },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: "$finalAmount" },
          bookingCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(revenue);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getActivity = async (req, res) => {
  try {
    const recentBookings = await Booking.find()
      .populate("customer", "username")
      .populate("beautician", "fullName")
      .sort({ createdAt: -1 })
      .limit(10);

    const recentReviews = await Review.find()
      .populate("customer", "username")
      .populate("beautician", "fullName")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentComplaints = await Complaint.find()
      .populate("user", "username")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .select("username email role createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      recentBookings,
      recentReviews,
      recentComplaints,
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getBookingsOverview = async (req, res) => {
  try {
    const statusCounts = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const overview = {};
    statusCounts.forEach((item) => {
      overview[item._id] = item.count;
    });

    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getMetrics,
  getRevenue,
  getActivity,
  getBookingsOverview,
};
