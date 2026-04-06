const Beautician = require("../models/Beautician");
const Availability = require("../models/Availability");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const User = require("../models/User");

// ─── GET BEAUTICIAN PROFILE ──────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id }).populate(
      "user",
      "username email phoneNumber profileImage"
    );

    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    res.json({
      success: true,
      beautician: {
        user: beautician.user,
        fullName: beautician.fullName,
        skills: beautician.skills,
        experience: beautician.experience,
        bio: beautician.bio,
        rating: beautician.rating,
        totalReviews: beautician.totalReviews,
        verificationStatus: beautician.verificationStatus,
        status: beautician.status,
        documents: beautician.documents,
        location: beautician.location,
        portfolio: beautician.portfolio,
        profileImage: beautician.profileImage,
      },
    });
  } catch (error) {
    console.error("Get beautician profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE BEAUTICIAN PROFILE ────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, experience, skills, bio, profileImage } = req.body;
    const beautician = await Beautician.findOne({ user: req.user._id });

    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    if (name) beautician.fullName = name;
    if (experience !== undefined) beautician.experience = experience;
    if (skills) beautician.skills = skills;
    if (bio) beautician.bio = bio;

    if (req.file) {
      beautician.profileImage = `/uploads/${req.file.filename}`;
    } else if (profileImage) {
      beautician.profileImage = profileImage;
    }

    await beautician.save();

    // Also update user name if changed
    if (name) {
      await User.findByIdAndUpdate(req.user._id, { username: name });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      beautician,
    });
  } catch (error) {
    console.error("Update beautician profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET AVAILABILITY ─────────────────────────────────────────────────────────
const getAvailability = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    let availability = await Availability.findOne({ beautician: beautician._id });

    if (!availability) {
      // Return defaults
      availability = {
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        workingHours: { start: "09:00", end: "18:00" },
        breakTime: null,
        slotDuration: 60,
        unavailableDates: [],
      };
    }

    // Generate time slots
    const timeSlots = [];
    let current = parseTimeToMinutes(availability.workingHours.start);
    const end = parseTimeToMinutes(availability.workingHours.end);
    const breakStart = availability.breakTime?.start
      ? parseTimeToMinutes(availability.breakTime.start)
      : null;
    const breakEnd = availability.breakTime?.end
      ? parseTimeToMinutes(availability.breakTime.end)
      : null;

    while (current < end) {
      if (breakStart && breakEnd && current >= breakStart && current < breakEnd) {
        current += availability.slotDuration || 60;
        continue;
      }
      timeSlots.push(formatMinutesToTime(current));
      current += availability.slotDuration || 60;
    }

    res.json({
      success: true,
      availability: {
        workingDays: availability.workingDays,
        workingHours: availability.workingHours,
        breakTime: availability.breakTime,
        timeSlots,
        unavailableDates: availability.unavailableDates,
      },
    });
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE AVAILABILITY ──────────────────────────────────────────────────────
const updateAvailability = async (req, res) => {
  try {
    const { workingDays, workingHours, breakTime } = req.body;

    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    let availability = await Availability.findOne({ beautician: beautician._id });

    if (!availability) {
      availability = new Availability({ beautician: beautician._id });
    }

    if (workingDays) availability.workingDays = workingDays;
    if (workingHours) availability.workingHours = workingHours;
    if (breakTime !== undefined) availability.breakTime = breakTime;

    await availability.save();

    // Also update beautician model availability
    if (workingDays) {
      beautician.availability = workingDays.map((day) => ({
        day,
        startTime: workingHours?.start || availability.workingHours.start,
        endTime: workingHours?.end || availability.workingHours.end,
        isAvailable: true,
      }));
      await beautician.save();
    }

    res.json({ success: true, message: "Availability updated successfully" });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── ADD UNAVAILABLE DATE ─────────────────────────────────────────────────────
const addUnavailableDate = async (req, res) => {
  try {
    const { date, reason, isRecurring } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    let availability = await Availability.findOne({ beautician: beautician._id });
    if (!availability) {
      availability = new Availability({
        beautician: beautician._id,
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        workingHours: { start: "09:00", end: "18:00" },
      });
    }

    availability.unavailableDates.push({
      date: new Date(date),
      reason: reason || "",
      isRecurring: isRecurring || false,
    });

    await availability.save();

    res.json({ success: true, message: "Unavailable date added" });
  } catch (error) {
    console.error("Add unavailable date error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── REMOVE UNAVAILABLE DATE ──────────────────────────────────────────────────
const removeUnavailableDate = async (req, res) => {
  try {
    const { id } = req.params;

    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const availability = await Availability.findOne({ beautician: beautician._id });
    if (!availability) {
      return res.status(404).json({ success: false, message: "Availability not found" });
    }

    availability.unavailableDates = availability.unavailableDates.filter(
      (ud) => ud._id.toString() !== id
    );
    await availability.save();

    res.json({ success: true, message: "Unavailable date removed" });
  } catch (error) {
    console.error("Remove unavailable date error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET BEAUTICIAN SERVICES ──────────────────────────────────────────────────
const getServices = async (req, res) => {
  try {
    // Get all active services (beautician can view what they can offer based on skills)
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const services = await Service.find({ isActive: true })
      .populate("category", "name")
      .sort({ name: 1 });

    res.json({
      success: true,
      services: services.map((s) => ({
        serviceId: s._id,
        name: s.name,
        price: s.price,
        duration: s.duration,
        category: s.category,
      })),
    });
  } catch (error) {
    console.error("Get beautician services error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE BEAUTICIAN SERVICE PRICING ────────────────────────────────────────
const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { price, duration } = req.body;

    // Note: This could be extended to support per-beautician pricing
    // For now, just validate the service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    res.json({
      success: true,
      message: "Service preferences noted. Admin controls base pricing.",
    });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's bookings
    const todayBookings = await Booking.countDocuments({
      beautician: beautician._id,
      bookingDate: { $gte: today, $lt: tomorrow },
      status: { $nin: ["Cancelled", "Rejected"] },
    });

    // Upcoming bookings
    const upcomingBookings = await Booking.countDocuments({
      beautician: beautician._id,
      bookingDate: { $gte: tomorrow },
      status: { $in: ["Assigned", "Accepted"] },
    });

    // Completed today
    const completedToday = await Booking.countDocuments({
      beautician: beautician._id,
      completedAt: { $gte: today, $lt: tomorrow },
      status: "Completed",
    });

    // Earnings calculations
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayEarnings] = await Booking.aggregate([
      {
        $match: {
          beautician: beautician._id,
          status: "Completed",
          completedAt: { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ]);

    const [weekEarnings] = await Booking.aggregate([
      {
        $match: {
          beautician: beautician._id,
          status: "Completed",
          completedAt: { $gte: weekStart, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ]);

    const [monthEarnings] = await Booking.aggregate([
      {
        $match: {
          beautician: beautician._id,
          status: "Completed",
          completedAt: { $gte: monthStart, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ]);

    res.json({
      success: true,
      stats: {
        todayBookings,
        upcomingBookings,
        completedToday,
        earnings: {
          today: todayEarnings?.total || 0,
          week: weekEarnings?.total || 0,
          month: monthEarnings?.total || 0,
        },
        rating: beautician.rating,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── EARNINGS ─────────────────────────────────────────────────────────────────
const getEarnings = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const { startDate, endDate } = req.query;
    const match = {
      beautician: beautician._id,
      status: "Completed",
    };

    if (startDate && endDate) {
      match.completedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const earnings = await Booking.find(match)
      .select("services finalAmount completedAt")
      .populate("services.service", "name")
      .sort({ completedAt: -1 });

    const total = earnings.reduce((sum, b) => sum + b.finalAmount, 0);

    res.json({
      success: true,
      earnings: earnings.map((b) => ({
        bookingId: b._id,
        amount: b.finalAmount,
        date: b.completedAt,
        services: b.services.map((s) => s.serviceName),
      })),
      total,
      breakdown: {
        serviceCharges: total,
        tips: 0,
        bonuses: 0,
      },
    });
  } catch (error) {
    console.error("Get earnings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
const parseTimeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const formatMinutesToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

module.exports = {
  getProfile,
  updateProfile,
  getAvailability,
  updateAvailability,
  addUnavailableDate,
  removeUnavailableDate,
  getServices,
  updateService,
  getDashboardStats,
  getEarnings,
};
