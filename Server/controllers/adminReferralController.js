const ReferralSettings = require("../models/ReferralSettings");

// ─── GET REFERRAL SETTINGS ────────────────────────────────────────────────────
const getReferralSettings = async (req, res) => {
  try {
    let settings = await ReferralSettings.findOne().populate("updatedBy", "username email");
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await ReferralSettings.create({
        pointsPerReferral: 10,
        pointsRedemptionLimit: 100,
        isActive: true,
      });
    }

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get referral settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE REFERRAL SETTINGS ─────────────────────────────────────────────────
const updateReferralSettings = async (req, res) => {
  try {
    const { pointsPerReferral, pointsRedemptionLimit, isActive, description } = req.body;

    // Validate inputs
    if (pointsPerReferral && pointsPerReferral < 1) {
      return res.status(400).json({ success: false, message: "Points per referral must be at least 1" });
    }

    if (pointsRedemptionLimit && pointsRedemptionLimit < 1) {
      return res.status(400).json({ success: false, message: "Redemption limit must be at least 1" });
    }

    // Find existing settings or create new ones
    let settings = await ReferralSettings.findOne();
    
    if (!settings) {
      settings = await ReferralSettings.create({
        pointsPerReferral: pointsPerReferral || 10,
        pointsRedemptionLimit: pointsRedemptionLimit || 100,
        isActive: isActive !== undefined ? isActive : true,
        description: description || "Referral reward configuration",
        updatedBy: req.user._id,
      });
    } else {
      // Update existing settings
      if (pointsPerReferral !== undefined) settings.pointsPerReferral = pointsPerReferral;
      if (pointsRedemptionLimit !== undefined) settings.pointsRedemptionLimit = pointsRedemptionLimit;
      if (isActive !== undefined) settings.isActive = isActive;
      if (description !== undefined) settings.description = description;
      
      settings.updatedBy = req.user._id;
      await settings.save();
    }

    res.json({
      success: true,
      message: "Referral settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update referral settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET REFERRAL STATISTICS (ADMIN) ───────────────────────────────────────────
const getReferralStatisticsAdmin = async (req, res) => {
  try {
    const User = require("../models/User");
    const Referral = require("../models/Referral");

    const totalUsers = await User.countDocuments();
    const usersWithReferralCode = await User.countDocuments({ referralCode: { $exists: true, $ne: null } });
    const totalReferrals = await Referral.countDocuments();
    
    // Get top referrers
    const topReferrers = await User.find()
      .sort({ referralCount: -1 })
      .limit(10)
      .select("username email referralCode referralCount");

    // Get recently completed referrals
    const recentReferrals = await Referral.find({ rewardStatus: "completed" })
      .populate("referrerUser", "username email")
      .populate("referredUser", "username email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      statistics: {
        totalUsers,
        usersWithReferralCode,
        totalReferrals,
        topReferrers,
        recentReferrals,
      },
    });
  } catch (error) {
    console.error("Get referral statistics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getReferralSettings,
  updateReferralSettings,
  getReferralStatisticsAdmin,
};
