// ─── GET ALL BEAUTICIANS (PUBLIC) ───────────────────────────────────────────
const getAllBeauticians = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", status } = req.query;
    const query = {};
    if (search) {
      query.fullName = { $regex: search, $options: "i" };
    }
    if (status) {
      query.status = status;
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const beauticians = await Beautician.find(query)
      .select("fullName profileImage rating tier skills experience status isVerified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Beautician.countDocuments(query);
    res.json({
      success: true,
      beauticians,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get all beauticians error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const Beautician = require("../models/Beautician");
const Availability = require("../models/Availability");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const User = require("../models/User");
const Wallet = require("../models/Wallet");

const MIN_WALLET_BALANCE = 50; // Minimum $50 to remain eligible for bookings

// ─── GET BEAUTICIAN PROFILE ──────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id }).populate(
      "user",
      "username email phoneNumber profileImage tier"
    );

    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    res.json({
      success: true,
      beautician: {
        user: beautician.user,
        fullName: beautician.fullName,
        professionalTitle: beautician.professionalTitle,
        skills: beautician.skills,
        experience: beautician.experience,
        bio: beautician.bio,
        rating: beautician.rating,
        totalReviews: beautician.totalReviews,
        verificationStatus: beautician.verificationStatus,
        verificationSteps: beautician.verificationSteps,
        isAcceptingBookings: beautician.isAcceptingBookings,
        status: beautician.status,
        documents: beautician.documents,
        location: beautician.location,
        portfolio: beautician.portfolio,
        profileImage: beautician.profileImage,
        tier: beautician.tier,
        paymentMethods: beautician.paymentMethods,
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
    const { name, experience, skills, bio, profileImage, professionalTitle, location } = req.body;
    const beautician = await Beautician.findOne({ user: req.user._id });

    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    if (name) beautician.fullName = name;
    if (experience !== undefined) beautician.experience = experience;
    if (skills) beautician.skills = skills;
    if (bio) beautician.bio = bio;
    if (professionalTitle) beautician.professionalTitle = professionalTitle;
    if (location) {
      if (location.address) beautician.location.address = location.address;
      if (location.city) beautician.location.city = location.city;
      if (location.state) beautician.location.state = location.state;
      if (location.pincode) beautician.location.pincode = location.pincode;
      if (location.coordinates) beautician.location.coordinates = location.coordinates;
    }

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

// ─── UPLOAD PROFILE IMAGE ─────────────────────────────────────────────────────
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    beautician.profileImage = `/uploads/${req.file.filename}`;
    await beautician.save();

    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      profileImage: beautician.profileImage,
    });
  } catch (error) {
    console.error("Upload profile image error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET VERIFICATION STATUS (Multi-step) ─────────────────────────────────────
const getVerificationStatus = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    res.json({
      success: true,
      verificationStatus: beautician.verificationStatus,
      steps: {
        identityVerified: beautician.verificationSteps?.identityVerified || { status: "pending" },
        portfolioReview: beautician.verificationSteps?.portfolioReview || { status: "pending" },
        finalApproval: beautician.verificationSteps?.finalApproval || { status: "pending" },
      },
      isProfileLive: beautician.verificationStatus === "Approved" && beautician.status === "Active",
      estimatedReviewTime: "24-48 hours",
    });
  } catch (error) {
    console.error("Get verification status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── TOGGLE ACCEPTING BOOKINGS ────────────────────────────────────────────────
const toggleAcceptingBookings = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const { isAccepting } = req.body;
    beautician.isAcceptingBookings = isAccepting !== undefined ? isAccepting : !beautician.isAcceptingBookings;
    await beautician.save();

    res.json({
      success: true,
      message: beautician.isAcceptingBookings ? "Now accepting bookings" : "Paused accepting bookings",
      isAcceptingBookings: beautician.isAcceptingBookings,
    });
  } catch (error) {
    console.error("Toggle accepting bookings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── WORK ELIGIBILITY CHECK ───────────────────────────────────────────────────
const getWorkEligibility = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });
    const balance = wallet?.balance || 0;
    const isEligible = balance >= MIN_WALLET_BALANCE;

    res.json({
      success: true,
      walletBalance: balance,
      minimumRequired: MIN_WALLET_BALANCE,
      isEligibleForWork: isEligible,
      currency: wallet?.currency || "INR",
      message: isEligible
        ? "Eligible for work"
        : `Maintain a minimum balance of $${MIN_WALLET_BALANCE} to continue receiving bookings.`,
    });
  } catch (error) {
    console.error("Work eligibility error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── TOGGLE PER-SLOT AVAILABILITY ─────────────────────────────────────────────
const toggleSlotAvailability = async (req, res) => {
  try {
    const { date, time, isAvailable } = req.body;

    if (!date || !time) {
      return res.status(400).json({ success: false, message: "Date and time are required" });
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

    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);

    if (isAvailable === false) {
      // Block this slot
      const exists = availability.blockedSlots.some(
        (s) => new Date(s.date).getTime() === slotDate.getTime() && s.time === time
      );
      if (!exists) {
        availability.blockedSlots.push({ date: slotDate, time });
      }
    } else {
      // Unblock this slot
      availability.blockedSlots = availability.blockedSlots.filter(
        (s) => !(new Date(s.date).getTime() === slotDate.getTime() && s.time === time)
      );
    }

    await availability.save();

    res.json({ success: true, message: `Slot ${isAvailable ? "unblocked" : "blocked"} successfully` });
  } catch (error) {
    console.error("Toggle slot availability error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── ADD DOCUMENT / CERTIFICATE ───────────────────────────────────────────────
const addDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No document file provided" });
    }

    const { documentType, documentName } = req.body;

    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const newDoc = {
      documentType: documentType || "certificate",
      documentName: documentName || req.file.originalname,
      documentUrl: `/uploads/${req.file.filename}`,
      isVerified: false,
      uploadedAt: new Date(),
    };

    beautician.documents.push(newDoc);
    await beautician.save();

    const savedDoc = beautician.documents[beautician.documents.length - 1];

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: savedDoc,
    });
  } catch (error) {
    console.error("Add document error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET DOCUMENTS / CERTIFICATES ─────────────────────────────────────────────
const getDocuments = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    res.json({ success: true, documents: beautician.documents || [] });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DELETE DOCUMENT ──────────────────────────────────────────────────────────
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const docIndex = beautician.documents.findIndex((d) => d._id.toString() === documentId);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    beautician.documents.splice(docIndex, 1);
    await beautician.save();

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── ADD PAYMENT METHOD ───────────────────────────────────────────────────────
const addPaymentMethod = async (req, res) => {
  try {
    const { type, label, details, isDefault } = req.body;

    if (!type || !details) {
      return res.status(400).json({ success: false, message: "Payment method type and details are required" });
    }

    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    if (isDefault) {
      beautician.paymentMethods.forEach((pm) => (pm.isDefault = false));
    }

    beautician.paymentMethods.push({
      type,
      label: label || type,
      details,
      isDefault: isDefault || beautician.paymentMethods.length === 0,
    });
    await beautician.save();

    const savedMethod = beautician.paymentMethods[beautician.paymentMethods.length - 1];

    res.status(201).json({
      success: true,
      message: "Payment method added",
      paymentMethod: savedMethod,
    });
  } catch (error) {
    console.error("Add payment method error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET PAYMENT METHODS ──────────────────────────────────────────────────────
const getPaymentMethods = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    res.json({ success: true, paymentMethods: beautician.paymentMethods || [] });
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DELETE PAYMENT METHOD ────────────────────────────────────────────────────
const deletePaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.params;

    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const idx = beautician.paymentMethods.findIndex((pm) => pm._id.toString() === methodId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    beautician.paymentMethods.splice(idx, 1);
    await beautician.save();

    res.json({ success: true, message: "Payment method deleted" });
  } catch (error) {
    console.error("Delete payment method error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET CLIENTS LIST ─────────────────────────────────────────────────────────
const getClients = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get unique customers from completed bookings
    const clientBookings = await Booking.aggregate([
      { $match: { beautician: beautician._id, status: "Completed" } },
      {
        $group: {
          _id: "$customer",
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: "$finalAmount" },
          lastBookingDate: { $max: "$completedAt" },
          services: { $addToSet: { $arrayElemAt: ["$services.serviceName", 0] } },
        },
      },
      { $sort: { lastBookingDate: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    // Populate customer info
    const customerIds = clientBookings.map((c) => c._id);
    const customers = await User.find({ _id: { $in: customerIds } }).select(
      "username email phoneNumber profileImage tier"
    );

    const clients = clientBookings.map((cb) => {
      const customer = customers.find((c) => c._id.toString() === cb._id.toString());
      return {
        customer: customer || { _id: cb._id },
        totalBookings: cb.totalBookings,
        totalSpent: cb.totalSpent,
        lastBookingDate: cb.lastBookingDate,
        services: cb.services,
      };
    });

    res.json({ success: true, clients, total: clients.length });
  } catch (error) {
    console.error("Get clients error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET SCHEDULE BY DATE ─────────────────────────────────────────────────────
const getScheduleByDate = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: "Date parameter is required" });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await Booking.find({
      beautician: beautician._id,
      bookingDate: { $gte: targetDate, $lt: nextDay },
      status: { $nin: ["Cancelled", "Rejected"] },
    })
      .populate("customer", "username phoneNumber profileImage tier")
      .populate("services.service", "name price duration image")
      .sort({ "timeSlot.startTime": 1 });

    res.json({
      success: true,
      date: targetDate,
      totalBookings: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get schedule by date error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN HOME DASHBOARD ────────────────────────────────────────────────
const getBeauticianHomeDashboard = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's upcoming booking (next one)
    const upcomingBooking = await Booking.findOne({
      beautician: beautician._id,
      bookingDate: { $gte: today, $lt: tomorrow },
      status: { $in: ["Accepted", "OnTheWay"] },
    })
      .populate("customer", "username profileImage tier")
      .populate("services.service", "name price duration image")
      .sort({ "timeSlot.startTime": 1 });

    // Weekly earnings
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const [weekEarnings] = await Booking.aggregate([
      {
        $match: {
          beautician: beautician._id,
          status: "Completed",
          completedAt: { $gte: weekStart, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: "$finalAmount" }, count: { $sum: 1 } } },
    ]);

    // Work eligibility
    const wallet = await Wallet.findOne({ user: req.user._id });
    const isEligible = (wallet?.balance || 0) >= MIN_WALLET_BALANCE;

    res.json({
      success: true,
      dashboard: {
        beautician: {
          fullName: beautician.fullName,
          profileImage: beautician.profileImage,
          isAcceptingBookings: beautician.isAcceptingBookings,
          verificationStatus: beautician.verificationStatus,
          location: beautician.location,
        },
        upcomingBooking,
        weeklyEarnings: {
          revenue: weekEarnings?.total || 0,
          servicesCompleted: weekEarnings?.count || 0,
        },
        isEligibleForWork: isEligible,
        walletBalance: wallet?.balance || 0,
      },
    });
  } catch (error) {
    console.error("Beautician home dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  getAvailability,
  updateAvailability,
  addUnavailableDate,
  removeUnavailableDate,
  toggleSlotAvailability,
  getServices,
  updateService,
  getDashboardStats,
  getEarnings,
  getVerificationStatus,
  toggleAcceptingBookings,
  getWorkEligibility,
  addDocument,
  deleteDocument,
  getDocuments,
  addPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  getClients,
  getScheduleByDate,
  getBeauticianHomeDashboard,
  getAllBeauticians,
};
