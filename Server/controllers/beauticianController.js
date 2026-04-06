const Beautician = require("../models/Beautician");
const User = require("../models/User");
const { calculateDistance } = require("../utils/geolocation");

const getAllBeauticians = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, skill, verified } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (skill) query.skills = skill;
    if (verified !== undefined) query.isVerified = verified === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const beauticians = await Beautician.find(query)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Beautician.countDocuments(query);

    res.json({
      beauticians,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getBeauticianById = async (req, res) => {
  try {
    const beautician = await Beautician.findById(req.params.id).populate("user", "username email");
    if (!beautician) return res.status(404).json({ message: "Beautician not found" });
    res.json(beautician);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createBeautician = async (req, res) => {
  try {
    const { username, email, password, fullName, phoneNumber, skills, experience, bio, location } = req.body;

    // Create user account with Beautician role
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already in use" });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: "Beautician",
      phoneNumber,
    });

    const beautician = await Beautician.create({
      user: user._id,
      fullName,
      phoneNumber,
      skills: skills || [],
      experience: experience || 0,
      bio: bio || "",
      location: location || {},
    });

    const populated = await Beautician.findById(beautician._id).populate("user", "username email");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Create beautician error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateBeautician = async (req, res) => {
  try {
    const { fullName, phoneNumber, skills, experience, bio, location, availability } = req.body;

    const beautician = await Beautician.findByIdAndUpdate(
      req.params.id,
      { fullName, phoneNumber, skills, experience, bio, location, availability },
      { new: true, runValidators: true }
    ).populate("user", "username email");

    if (!beautician) return res.status(404).json({ message: "Beautician not found" });

    res.json(beautician);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteBeautician = async (req, res) => {
  try {
    const beautician = await Beautician.findById(req.params.id);
    if (!beautician) return res.status(404).json({ message: "Beautician not found" });

    // Also deactivate linked user
    await User.findByIdAndUpdate(beautician.user, { isActive: false });
    await Beautician.findByIdAndDelete(req.params.id);

    res.json({ message: "Beautician deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const verifyDocuments = async (req, res) => {
  try {
    const { documentIndex, isVerified } = req.body;

    const beautician = await Beautician.findById(req.params.id);
    if (!beautician) return res.status(404).json({ message: "Beautician not found" });

    if (beautician.documents[documentIndex]) {
      beautician.documents[documentIndex].isVerified = isVerified;
      beautician.documents[documentIndex].verifiedAt = new Date();
    }

    // Check if all documents are verified
    const allVerified = beautician.documents.every((doc) => doc.isVerified);
    if (allVerified && beautician.documents.length > 0) {
      beautician.isVerified = true;
      beautician.verificationStatus = "Approved";
    }

    await beautician.save();
    res.json({ message: "Document verification updated", beautician });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateBeauticianStatus = async (req, res) => {
  try {
    const { status } = req.body; // Active, Inactive, Suspended

    const beautician = await Beautician.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!beautician) return res.status(404).json({ message: "Beautician not found" });

    // Sync user account status
    if (status === "Active") {
      await User.findByIdAndUpdate(beautician.user, { isActive: true, isSuspended: false });
    } else if (status === "Suspended") {
      await User.findByIdAndUpdate(beautician.user, { isSuspended: true });
    } else if (status === "Inactive") {
      await User.findByIdAndUpdate(beautician.user, { isActive: false });
    }

    res.json({ message: `Beautician ${status.toLowerCase()} successfully`, beautician });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getBeauticianSkills = async (req, res) => {
  try {
    const beautician = await Beautician.findById(req.params.id).select("skills fullName");
    if (!beautician) return res.status(404).json({ message: "Beautician not found" });
    res.json(beautician);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateBeauticianSkills = async (req, res) => {
  try {
    const { skills } = req.body;

    const beautician = await Beautician.findByIdAndUpdate(
      req.params.id,
      { skills },
      { new: true }
    ).select("skills fullName");

    if (!beautician) return res.status(404).json({ message: "Beautician not found" });
    res.json(beautician);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getAvailableBeauticians = async (req, res) => {
  try {
    const { skill, date, time } = req.query;

    const query = { status: "Active", isVerified: true };
    if (skill) query.skills = skill;

    const beauticians = await Beautician.find(query)
      .populate("user", "username email")
      .select("fullName skills rating totalReviews availability location profileImage");

    // Filter by availability if date & time provided
    let filtered = beauticians;
    if (date && time) {
      const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
      filtered = beauticians.filter((b) => {
        const dayAvail = b.availability.find((a) => a.day === dayOfWeek && a.isAvailable);
        if (!dayAvail) return false;
        return time >= dayAvail.startTime && time <= dayAvail.endTime;
      });
    }

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getNearbyBeauticians = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in km

    if (!lat || !lng) {
      return res.status(400).json({ message: "Location coordinates are required" });
    }

    const beauticians = await Beautician.find({
      status: "Active",
      isVerified: true,
      "location.coordinates.lat": { $exists: true },
      "location.coordinates.lng": { $exists: true },
    }).populate("user", "username email");

    // Simple distance calculation
    const nearby = beauticians.filter((b) => {
      if (!b.location.coordinates.lat || !b.location.coordinates.lng) return false;
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        b.location.coordinates.lat,
        b.location.coordinates.lng
      );
      return distance <= parseFloat(radius);
    });

    res.json(nearby);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllBeauticians,
  getBeauticianById,
  createBeautician,
  updateBeautician,
  deleteBeautician,
  verifyDocuments,
  updateBeauticianStatus,
  getBeauticianSkills,
  updateBeauticianSkills,
  getAvailableBeauticians,
  getNearbyBeauticians,
};
