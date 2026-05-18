const User = require("../models/User");
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

module.exports = {
  getReferralCode,
  getReferralStats,
  getReferralHistory,
  validateReferralCode,
};
