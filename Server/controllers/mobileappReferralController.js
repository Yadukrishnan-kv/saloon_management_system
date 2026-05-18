const express = require("express");
const User = require("../models/User");
const Beautician = require("../models/Beautician");
const Referral = require("../models/Referral");
const Wallet = require("../models/Wallet");

// ─── GET USER'S REFERRAL CODE ────────────────────────────────────────────────
const getReferralCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
    });
  } catch (error) {
    console.error("Get referral code error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET REFERRAL STATISTICS ──────────────────────────────────────────────────
const getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get all referrals for this user
    const referrals = await Referral.find({ referrerUser: req.user._id })
      .populate("referredUser", "username email phoneNumber")
      .sort({ createdAt: -1 });

    // Calculate total reward points
    const totalRewardPoints = referrals.reduce((sum, ref) => sum + (ref.rewardPoints || 0), 0);

    // Get wallet to see current points
    const wallet = await Wallet.findOne({ user: req.user._id });

    const stats = {
      referralCode: user.referralCode,
      totalReferrals: user.referralCount || 0,
      totalRewardPoints,
      walletPoints: wallet ? wallet.points : 0,
      referrals: referrals.map((ref) => ({
        referredUserId: ref.referredUser._id,
        referredUserName: ref.referredUser.username,
        referredUserEmail: ref.referredUser.email,
        rewardPoints: ref.rewardPoints,
        rewardStatus: ref.rewardStatus,
        usedDate: ref.usedDate,
      })),
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get referral stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET REFERRAL HISTORY ─────────────────────────────────────────────────────
const getReferralHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const referrals = await Referral.find({ referrerUser: req.user._id })
      .populate("referredUser", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReferrals = await Referral.countDocuments({ referrerUser: req.user._id });

    res.json({
      success: true,
      referrals: referrals.map((ref) => ({
        id: ref._id,
        referredUserName: ref.referredUser.username,
        referredUserEmail: ref.referredUser.email,
        rewardPoints: ref.rewardPoints,
        rewardStatus: ref.rewardStatus,
        usedDate: ref.usedDate,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReferrals / limit),
        totalReferrals,
      },
    });
  } catch (error) {
    console.error("Get referral history error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── VALIDATE REFERRAL CODE ───────────────────────────────────────────────────
const validateReferralCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Referral code is required" });
    }

    const referrer = await User.findOne({ referralCode: code });

    if (!referrer) {
      return res.status(400).json({ success: false, message: "Invalid referral code" });
    }

    if (referrer._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot use your own referral code" });
    }

    res.json({
      success: true,
      message: "Referral code is valid",
      referrerName: referrer.username,
      referrerEmail: referrer.email,
    });
  } catch (error) {
    console.error("Validate referral code error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET COMPREHENSIVE REFERRAL DETAILS (FOR BOTH CUSTOMER & BEAUTICIAN) ──────
const getComprehensiveReferralDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Check if user is Customer or Beautician
    let referralData = null;
    let userInfo = null;

    if (userRole === "Customer") {
      userInfo = await User.findById(userId).select("username email phoneNumber referralCode referralCount");
      
      if (!userInfo) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      referralData = {
        userType: "Customer",
        userId: userInfo._id,
        username: userInfo.username,
        email: userInfo.email,
        phoneNumber: userInfo.phoneNumber,
        referralCode: userInfo.referralCode,
        totalReferrals: userInfo.referralCount || 0,
      };
    } else if (userRole === "Beautician") {
      const beauticianUser = await User.findById(userId);
      const beautician = await Beautician.findOne({ user: userId });

      if (!beautician) {
        return res.status(404).json({ success: false, message: "Beautician not found" });
      }

      referralData = {
        userType: "Beautician",
        userId: beautician._id,
        fullName: beautician.fullName,
        email: beauticianUser?.email,
        phoneNumber: beautician.phoneNumber,
        referralCode: beautician.referralCode,
        totalReferrals: beautician.referralCount || 0,
      };
    } else {
      return res.status(400).json({ success: false, message: "Invalid user role for referral system" });
    }

    // Get all referrals for this user
    let referrals = [];
    
    if (userRole === "Customer") {
      referrals = await Referral.find({ referrerUser: userId })
        .populate("referredUser", "username email phoneNumber")
        .sort({ createdAt: -1 });
    }
    // Note: For Beauticians, we can add similar logic when Referral model is updated to support Beautician referrals

    // Calculate reward points
    const totalRewardPoints = referrals.reduce((sum, ref) => sum + (ref.rewardPoints || 0), 0);
    const completedReferrals = referrals.filter(ref => ref.rewardStatus === "completed").length;
    const pendingReferrals = referrals.filter(ref => ref.rewardStatus === "pending").length;

    // Get wallet points
    const wallet = await Wallet.findOne({ user: userId });

    // Build response
    const response = {
      success: true,
      data: {
        ...referralData,
        stats: {
          totalRewardPoints,
          walletPoints: wallet ? wallet.points : 0,
          completedReferrals,
          pendingReferrals,
          totalReferrals: referrals.length,
        },
        referrals: referrals.map((ref) => ({
          referredUserId: ref.referredUser._id,
          referredUsername: ref.referredUser.username,
          referredEmail: ref.referredUser.email,
          referredPhone: ref.referredUser.phoneNumber,
          rewardPoints: ref.rewardPoints,
          rewardStatus: ref.rewardStatus,
          usedDate: ref.usedDate,
          createdAt: ref.createdAt,
        })),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Get comprehensive referral details error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  getComprehensiveReferralDetails,
};
