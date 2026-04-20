const User = require("../models/User");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Beautician = require("../models/Beautician");
const { validatePasswordChange } = require("../utils/validators");

// ─── GET PROFILE (with stats) ─────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("favoriteBeauticians", "fullName profileImage rating tier");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Profile stats matching the design (bookings count, reviews count)
    const [totalBookings, totalReviews] = await Promise.all([
      Booking.countDocuments({ customer: req.user._id }),
      Review.countDocuments({ customer: req.user._id }),
    ]);

    // Construct full image URL if image exists
    const userResponse = user.toObject();
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    if (userResponse.profileImage && userResponse.profileImage.startsWith("/uploads")) {
      userResponse.profileImage = `${baseUrl}${userResponse.profileImage}`;
    }

    res.json({
      success: true,
      user: userResponse,
      stats: {
        totalBookings,
        totalReviews,
        memberSince: user.createdAt,
        tier: user.tier || "Classic",
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updateData = {};

    if (name) updateData.username = name;
    if (email) {
      // Check if email is taken by another user
      const emailExists = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      updateData.email = email;
    }
    if (phone) {
      const phoneExists = await User.findOne({ phoneNumber: phone, _id: { $ne: req.user._id } });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: "Phone number already in use" });
      }
      updateData.phoneNumber = phone;
    }

    // Handle file upload for profile image - only update if file is provided
    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    // Construct full image URL if image exists
    const userResponse = user.toObject();
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    if (userResponse.profileImage && userResponse.profileImage.startsWith("/uploads")) {
      userResponse.profileImage = `${baseUrl}${userResponse.profileImage}`;
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { isValid, errors } = validatePasswordChange(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── ADD ADDRESS ──────────────────────────────────────────────────────────────
const addAddress = async (req, res) => {
  try {
    const { label, address, city, pincode, latitude, longitude, isDefault } = req.body;

    if (!address || !city) {
      return res.status(400).json({ success: false, message: "Address and city are required" });
    }

    const user = await User.findById(req.user._id);

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // If isDefault, unset other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    const newAddress = {
      label: label || "Home",
      address,
      city,
      pincode,
      latitude,
      longitude,
      isDefault: isDefault || user.addresses.length === 0,
    };

    user.addresses.push(newAddress);
    await user.save();

    const savedAddress = user.addresses[user.addresses.length - 1];

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: savedAddress,
    });
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET ADDRESSES ────────────────────────────────────────────────────────────
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, addresses: user.addresses || [] });
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE ADDRESS ───────────────────────────────────────────────────────────
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, address, city, pincode, latitude, longitude, isDefault } = req.body;

    const user = await User.findById(req.user._id);
    const addrIndex = (user.addresses || []).findIndex((a) => a._id.toString() === id);

    if (addrIndex === -1) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    if (label !== undefined) user.addresses[addrIndex].label = label;
    if (address !== undefined) user.addresses[addrIndex].address = address;
    if (city !== undefined) user.addresses[addrIndex].city = city;
    if (pincode !== undefined) user.addresses[addrIndex].pincode = pincode;
    if (latitude !== undefined) user.addresses[addrIndex].latitude = latitude;
    if (longitude !== undefined) user.addresses[addrIndex].longitude = longitude;
    if (isDefault !== undefined) user.addresses[addrIndex].isDefault = isDefault;

    await user.save();

    res.json({ success: true, message: "Address updated successfully" });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DELETE ADDRESS ───────────────────────────────────────────────────────────
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    const addrIndex = (user.addresses || []).findIndex((a) => a._id.toString() === id);
    if (addrIndex === -1) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    user.addresses.splice(addrIndex, 1);
    await user.save();

    res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BOOKING HISTORY ──────────────────────────────────────────────────────────
const getBookingHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { customer: req.user._id };

    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate("beautician", "fullName phoneNumber rating profileImage")
      .populate("services.service", "name price duration image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Booking history error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET SINGLE BOOKING ──────────────────────────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      customer: req.user._id,
    })
      .populate("beautician", "fullName phoneNumber rating profileImage location")
      .populate("services.service", "name price duration image category");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET FAVORITE STYLISTS ────────────────────────────────────────────────────
const getFavoriteStylists = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favoriteBeauticians",
      select: "fullName profileImage rating totalReviews tier skills experience",
    });

    res.json({ success: true, favorites: user.favoriteBeauticians || [] });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── ADD FAVORITE STYLIST ─────────────────────────────────────────────────────
const addFavoriteStylist = async (req, res) => {
  try {
    const { beauticianId } = req.body;
    if (!beauticianId) {
      return res.status(400).json({ success: false, message: "beauticianId is required" });
    }

    const beautician = await Beautician.findById(beauticianId);
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician not found" });
    }

    const user = await User.findById(req.user._id);
    if (user.favoriteBeauticians.includes(beauticianId)) {
      return res.status(400).json({ success: false, message: "Already in favorites" });
    }

    user.favoriteBeauticians.push(beauticianId);
    await user.save();

    res.json({ success: true, message: "Added to favorites" });
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── REMOVE FAVORITE STYLIST ──────────────────────────────────────────────────
const removeFavoriteStylist = async (req, res) => {
  try {
    const { beauticianId } = req.params;

    const user = await User.findById(req.user._id);
    const idx = user.favoriteBeauticians.indexOf(beauticianId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Not in favorites" });
    }

    user.favoriteBeauticians.splice(idx, 1);
    await user.save();

    res.json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  getBookingHistory,
  getBookingById,
  getFavoriteStylists,
  addFavoriteStylist,
  removeFavoriteStylist,
};
