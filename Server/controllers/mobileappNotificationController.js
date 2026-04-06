const Notification = require("../models/Notification");
const User = require("../models/User");

// ─── GET NOTIFICATIONS ────────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { user: req.user._id };

    if (type && type !== "all") {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── MARK AS READ ─────────────────────────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── REGISTER DEVICE ──────────────────────────────────────────────────────────
const registerDevice = async (req, res) => {
  try {
    const { deviceToken, deviceType } = req.body;

    if (!deviceToken || !deviceType) {
      return res.status(400).json({ success: false, message: "Device token and type are required" });
    }

    if (!["ios", "android"].includes(deviceType)) {
      return res.status(400).json({ success: false, message: "Device type must be ios or android" });
    }

    // Store device token - update or create a notification record
    // Remove this token from any other user first (device transfer)
    await Notification.updateMany(
      { "deviceTokens.token": deviceToken },
      { $pull: { deviceTokens: { token: deviceToken } } }
    );

    // Add device token to a special user-level notification settings doc
    // For simplicity, store in user model or a separate collection
    // Here we store the latest device token info
    const user = await User.findById(req.user._id);
    if (!user.deviceTokens) {
      user.deviceTokens = [];
    }

    // Remove existing token of same type
    user.deviceTokens = (user.deviceTokens || []).filter(
      (dt) => dt.token !== deviceToken
    );
    user.deviceTokens.push({ token: deviceToken, deviceType });
    await user.save();

    res.json({ success: true, message: "Device registered for notifications" });
  } catch (error) {
    console.error("Register device error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UNREGISTER DEVICE ────────────────────────────────────────────────────────
const unregisterDevice = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.deviceTokens = [];
    await user.save();

    res.json({ success: true, message: "Device unregistered from notifications" });
  } catch (error) {
    console.error("Unregister device error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET NOTIFICATION SETTINGS ────────────────────────────────────────────────
const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Default settings
    const settings = user.notificationSettings || {
      bookingUpdates: true,
      promotional: true,
      reminders: true,
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error("Get notification settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE NOTIFICATION SETTINGS ─────────────────────────────────────────────
const updateSettings = async (req, res) => {
  try {
    const { bookingUpdates, promotional, reminders } = req.body;

    const user = await User.findById(req.user._id);
    user.notificationSettings = {
      bookingUpdates: bookingUpdates !== undefined ? bookingUpdates : true,
      promotional: promotional !== undefined ? promotional : true,
      reminders: reminders !== undefined ? reminders : true,
    };
    await user.save();

    res.json({ success: true, message: "Notification settings updated" });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  registerDevice,
  unregisterDevice,
  getSettings,
  updateSettings,
};
