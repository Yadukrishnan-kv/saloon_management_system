const User = require("../models/User");
const Booking = require("../models/Booking");
const { validatePasswordChange } = require("../utils/validators");

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, profileImage } = req.body;
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
    if (profileImage) updateData.profileImage = profileImage;

    // Handle file upload for profile image
    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
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
};
