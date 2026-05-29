// Get top-rated beauticians (rating >= 4)
const getTopBeauticians = async (req, res) => {
  try {
    const minRating = Number(req.query.minRating) || 4;
    const limit = Number(req.query.limit) || 10;
    const beauticians = await Beautician.find({ rating: { $gte: minRating } })
      .sort({ rating: -1, totalReviews: -1 })
      .limit(limit)
      .populate("user", "username email");
    // Enrich with reviews and averageRating
    const Review = require("../models/Review");
    const Service = require("../models/Service");
    const CuratedService = require("../models/CuratedService");
    const beauticiansWithDetails = await Promise.all(
      beauticians.map(async (beautician) => {
        const services = await Service.find({ beautician: beautician._id, isActive: true })
          .populate("category", "name");
        const curatedServices = await CuratedService.find({ beautician: beautician._id, isActive: true })
          .populate("category", "name")
          .populate("subCategory", "name");
        const reviews = await Review.find({ beautician: beautician._id }).select("rating comment customer createdAt");
        const averageRating = reviews.length > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : 0;
        return {
          ...beautician.toObject(),
          services,
          curatedServices,
          reviews,
          averageRating
        };
      })
    );
    res.json(beauticiansWithDetails);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const Beautician = require("../models/Beautician");
const User = require("../models/User");
const { calculateDistance } = require("../utils/geolocation");


const Review = require("../models/Review");
const getAllBeauticians = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, skill, verified, verificationStatus } = req.query;
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
    if (verificationStatus) query.verificationStatus = verificationStatus;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const beauticians = await Beautician.find(query)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    // Fetch services, curated services, and reviews for each beautician
    const Service = require("../models/Service");
    const CuratedService = require("../models/CuratedService");
    const beauticiansWithDetails = await Promise.all(
      beauticians.map(async (beautician) => {
        const services = await Service.find({ beautician: beautician._id, isActive: true })
          .populate("category", "name");
        const curatedServices = await CuratedService.find({ beautician: beautician._id, isActive: true })
          .populate("category", "name")
          .populate("subCategory", "name");
        const reviews = await Review.find({ beautician: beautician._id }).select("rating comment customer createdAt");
        const averageRating = reviews.length > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : 0;
        return {
          ...beautician.toObject(),
          services,
          curatedServices,
          reviews,
          averageRating
        };
      })
    );
    const total = await Beautician.countDocuments(query);
    res.json({
      beauticians: beauticiansWithDetails,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("getAllBeauticians error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getBeauticianById = async (req, res) => {
  try {
    const beautician = await Beautician.findById(req.params.id).populate("user", "username email");
    if (!beautician) return res.status(404).json({ message: "Beautician not found" });
    const Service = require("../models/Service");
    const CuratedService = require("../models/CuratedService");
    const services = await Service.find({ beautician: beautician._id, isActive: true }).populate("category", "name");
    const curatedServices = await CuratedService.find({ beautician: beautician._id, isActive: true }).populate("category", "name").populate("subCategory", "name");
    const reviews = await Review.find({ beautician: beautician._id }).select("rating comment customer createdAt");
    const averageRating = reviews.length > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : 0;
    res.json({
      ...beautician.toObject(),
      services,
      curatedServices,
      reviews,
      averageRating
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createBeautician = async (req, res) => {
  try {
    const { fullName, phoneNumber, skills, experience, bio, qualifications, location } = req.body;

    const existingBeautician = await Beautician.findOne({ phoneNumber });
    if (existingBeautician) {
      return res.status(400).json({ message: "Beautician with this phone number already exists" });
    }

    const beautician = await Beautician.create({
      fullName,
      phoneNumber,
      skills: skills || [],
      experience: experience || 0,
      bio: bio || "",
      qualifications: qualifications || "",
      location: location || {},
      isVerified: true,
      verificationStatus: "Approved",
      status: "Active",
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
    const { fullName, phoneNumber, skills, experience, bio, qualifications, location, availability } = req.body;

    const beautician = await Beautician.findByIdAndUpdate(
      req.params.id,
      { fullName, phoneNumber, skills, experience, bio, qualifications, location, availability },
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
    if (beautician.user) {
      await User.findByIdAndUpdate(beautician.user, { isActive: false });
    }
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

const setBeauticianVerificationStatus = async (req, res) => {
  try {
    const { verificationStatus } = req.body;

    if (!["Approved", "Rejected"].includes(verificationStatus)) {
      return res.status(400).json({ message: "Invalid verification status" });
    }

    const beautician = await Beautician.findById(req.params.id);
    if (!beautician) return res.status(404).json({ message: "Beautician not found" });

    beautician.verificationStatus = verificationStatus;
    beautician.isVerified = verificationStatus === "Approved";
    if (verificationStatus === "Approved") {
      beautician.status = "Active";
      beautician.pccDocument.verifiedAt = new Date();
    } else {
      beautician.status = "Inactive";
    }

    await beautician.save();

    if (beautician.user) {
      if (verificationStatus === "Approved") {
        await User.findByIdAndUpdate(beautician.user, { isActive: true, isSuspended: false });

        // ─── INITIALIZE WALLET WITH ₹1000 ───────────────────────────────────
        const Wallet = require("../models/Wallet");
        let wallet = await Wallet.findOne({ user: beautician.user });
        
        if (!wallet) {
          wallet = await Wallet.create({
            user: beautician.user,
            balance: 1000, // Initialize with ₹1000
            initialBalanceLoaded: true,
            currency: "INR",
            transactions: [
              {
                type: "credit",
                amount: 1000,
                description: "Initial wallet balance upon beautician approval",
                status: "completed",
                date: new Date(),
              },
            ],
          });
        } else if (!wallet.initialBalanceLoaded) {
          wallet.balance = 1000;
          wallet.initialBalanceLoaded = true;
          wallet.transactions.push({
            type: "credit",
            amount: 1000,
            description: "Initial wallet balance upon beautician approval",
            status: "completed",
            date: new Date(),
          });
          await wallet.save();
        }

        // Notify beautician
        const Notification = require("../models/Notification");
        await Notification.create({
          user: beautician.user,
          title: "Approval Successful",
          message: `Congratulations! Your beautician profile has been approved. ₹1000 has been credited to your wallet.`,
          type: "system",
          forAdmin: false,
        });
      } else {
        await User.findByIdAndUpdate(beautician.user, { isActive: false });
      }
    }

    res.json({
      message: `Beautician ${verificationStatus.toLowerCase()} successfully`,
      beautician,
    });
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
    if (beautician.user) {
      if (status === "Active") {
        await User.findByIdAndUpdate(beautician.user, { isActive: true, isSuspended: false });
      } else if (status === "Suspended") {
        await User.findByIdAndUpdate(beautician.user, { isSuspended: true });
      } else if (status === "Inactive") {
        await User.findByIdAndUpdate(beautician.user, { isActive: false });
      }
    }

    res.json({ message: `Beautician ${status.toLowerCase()} successfully`, beautician });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const uploadBeauticianDocuments = async (req, res) => {
  try {
    const beautician = await Beautician.findById(req.params.id);
    if (!beautician) return res.status(404).json({ message: "Beautician not found" });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const documentType = req.body.documentType || "certificate";

    const docs = req.files.map((file) => ({
      documentType,
      documentUrl: `/uploads/${file.filename}`,
      isVerified: false,
    }));

    beautician.documents.push(...docs);
    await beautician.save();

    res.json({
      message: "Documents uploaded successfully",
      documents: beautician.documents,
    });
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
    const { lat, lng, radius = 10, date, time, skill } = req.query; // radius in km

    if (!lat || !lng) {
      return res.status(400).json({ message: "Location coordinates are required" });
    }

    const query = {
      status: "Active",
      isVerified: true,
      "location.coordinates.lat": { $exists: true },
      "location.coordinates.lng": { $exists: true },
    };

    if (skill) query.skills = skill;

    const beauticians = await Beautician.find(query)
      .populate("user", "username email")
      .select("fullName skills rating totalReviews availability location profileImage");

    let filtered = beauticians;
    if (date && time) {
      const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
      filtered = beauticians.filter((beautician) => {
        const dayAvail = beautician.availability.find((item) => item.day === dayOfWeek && item.isAvailable);
        if (!dayAvail) return false;
        return time >= dayAvail.startTime && time <= dayAvail.endTime;
      });
    }

    const nearby = filtered
      .map((b) => {
      if (!b.location.coordinates.lat || !b.location.coordinates.lng) return false;
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        b.location.coordinates.lat,
        b.location.coordinates.lng
      );
        if (distance > parseFloat(radius)) return false;
        return {
          ...b.toObject(),
          distanceKm: Math.round(distance * 10) / 10,
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.distanceKm - right.distanceKm);

    res.json(nearby);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── GET BEAUTICIANS WITH SUFFICIENT WALLET & COSMETICS STOCK (Admin) ──────────
const beauticianInventoryService = require("../services/beauticianInventoryService");
const getBeauticiansWithSufficientBalance = async (req, res) => {
  try {
    const { bookingId } = req.query;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Booking ID is required" });
    }
    const Booking = require("../models/Booking");
    const Wallet = require("../models/Wallet");
    const Service = require("../models/Service");
    const CosmeticItem = require("../models/CosmeticItem");
    // Get booking details
    const booking = await Booking.findById(bookingId).populate("services.service");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    // Calculate required wallet amount based on service percentage
    let requiredAmount = 0;
    for (const s of booking.services) {
      const service = s.service;
      if (service && typeof service.price === 'number' && typeof service.servicePercentage === 'number') {
        requiredAmount += (service.price * (service.servicePercentage || 0)) / 100;
      } else if (service && typeof service.price === 'number') {
        requiredAmount += service.price;
      }
    }
    requiredAmount = Math.round(requiredAmount);
    // Gather required cosmetics for all services in booking
    let requiredProducts = {};
    for (const s of booking.services) {
      const service = s.service;
      if (service && service.services) {
        // If service has mapped cosmetics (legacy)
        for (const prodId of service.services) {
          requiredProducts[prodId.toString()] = (requiredProducts[prodId.toString()] || 0) + 1;
        }
      }
    }
    // If no mapping, fallback to all products (legacy safety)
    if (Object.keys(requiredProducts).length === 0) {
      const allProducts = await CosmeticItem.find({});
      for (const p of allProducts) {
        requiredProducts[p._id.toString()] = 1;
      }
    }
    // Get all active beauticians
    const beauticians = await Beautician.find({ status: "Active" })
      .populate("user", "_id")
      .select("_id fullName phoneNumber profileImage rating user");
    // Filter beauticians by wallet AND cosmetics stock
    const beauticiansWithStock = await Promise.all(
      beauticians.map(async (beautician) => {
        if (!beautician.user) return null;
        const wallet = await Wallet.findOne({ user: beautician.user._id });
        const balance = wallet ? wallet.balance : 0;
        if (balance < requiredAmount) return null;
        // Check cosmetics stock
        const stock = await beauticianInventoryService.getBeauticianStock(
          beautician._id,
          Object.keys(requiredProducts)
        );
        let hasAllStock = true;
        let stockDetails = [];
        for (const [prodId, qty] of Object.entries(requiredProducts)) {
          const available = stock[prodId] || 0;
          stockDetails.push({ productId: prodId, required: qty, available });
          if (available < qty) hasAllStock = false;
        }
        return {
          ...beautician.toObject(),
          walletBalance: balance,
          stock: stockDetails,
          eligible: hasAllStock,
        };
      })
    );
    // Only eligible beauticians
    const availableBeauticians = beauticiansWithStock.filter(b => b && b.eligible);
    res.json({
      success: true,
      beauticians: availableBeauticians,
      requiredAmount,
      requiredProducts,
      totalCount: availableBeauticians.length,
    });
  } catch (error) {
    console.error("Get beauticians with sufficient balance/stock error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getAllBeauticians,
  getBeauticianById,
  createBeautician,
  updateBeautician,
  deleteBeautician,
  verifyDocuments,
  setBeauticianVerificationStatus,
  updateBeauticianStatus,
  uploadBeauticianDocuments,
  getBeauticianSkills,
  updateBeauticianSkills,
  getAvailableBeauticians,
  getNearbyBeauticians,
  getTopBeauticians,
  getBeauticiansWithSufficientBalance,
};
