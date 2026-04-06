const Review = require("../models/Review");
const Beautician = require("../models/Beautician");
const Notification = require("../models/Notification");
const CosmeticItem = require("../models/CosmeticItem");
const CosmeticOrder = require("../models/CosmeticOrder");
const Booking = require("../models/Booking");
const Wallet = require("../models/Wallet");
const User = require("../models/User");

// ─── HELPER: Recalculate beautician rating (only approved reviews) ────────────
const recalculateBeauticianRating = async (beauticianId) => {
  const beautician = await Beautician.findById(beauticianId);
  if (!beautician) return;

  const approvedReviews = await Review.find({
    beautician: beauticianId,
    isVisible: true,
    adminApproval: "Approved",
  });

  if (approvedReviews.length > 0) {
    const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
    beautician.rating = Math.round(avgRating * 10) / 10;
    beautician.totalReviews = approvedReviews.length;
  } else {
    beautician.rating = 0;
    beautician.totalReviews = 0;
  }
  await beautician.save();
};

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET PENDING REVIEWS ──────────────────────────────────────────────────────
const getPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ adminApproval: "Pending" })
      .populate("customer", "username email")
      .populate("beautician", "fullName")
      .populate("booking", "services bookingDate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ adminApproval: "Pending" });

    res.json({ success: true, reviews, total });
  } catch (error) {
    console.error("Get pending reviews error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET ALL REVIEWS (Admin view) ─────────────────────────────────────────────
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, beauticianId } = req.query;
    const query = {};

    if (status) query.adminApproval = status;
    if (beauticianId) query.beautician = beauticianId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(query)
      .populate("customer", "username email")
      .populate("beautician", "fullName")
      .populate("booking", "services bookingDate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    res.json({ success: true, reviews, total });
  } catch (error) {
    console.error("Get all reviews error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── APPROVE REVIEW ───────────────────────────────────────────────────────────
const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.adminApproval = "Approved";
    review.adminApprovedBy = req.user._id;
    review.adminApprovedAt = new Date();
    review.isVisible = true;
    await review.save();

    // Recalculate beautician rating
    await recalculateBeauticianRating(review.beautician);

    // Notify the customer
    await Notification.create({
      user: review.customer,
      title: "Review Approved",
      message: "Your review has been approved and is now visible.",
      type: "system",
    });

    res.json({ success: true, message: "Review approved successfully" });
  } catch (error) {
    console.error("Approve review error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── REJECT/DELETE REVIEW (Admin deletes negative reviews) ────────────────────
const rejectReview = async (req, res) => {
  try {
    const { reason } = req.body;

    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.adminApproval = "Rejected";
    review.adminApprovedBy = req.user._id;
    review.adminApprovedAt = new Date();
    review.adminRejectionReason = reason || "";
    review.isVisible = false;
    await review.save();

    // Recalculate beautician rating
    await recalculateBeauticianRating(review.beautician);

    res.json({ success: true, message: "Review rejected successfully" });
  } catch (error) {
    console.error("Reject review error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DELETE REVIEW PERMANENTLY ────────────────────────────────────────────────
const deleteReviewByAdmin = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const beauticianId = review.beautician;
    await Review.findByIdAndDelete(req.params.reviewId);

    // Recalculate beautician rating
    await recalculateBeauticianRating(beauticianId);

    res.json({ success: true, message: "Review deleted permanently" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COSMETIC ITEM MANAGEMENT (Admin CRUD)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET ALL COSMETIC ITEMS ───────────────────────────────────────────────────
const getAdminCosmeticItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await CosmeticItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CosmeticItem.countDocuments(query);

    res.json({ success: true, items, total });
  } catch (error) {
    console.error("Get admin cosmetic items error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── CREATE COSMETIC ITEM ─────────────────────────────────────────────────────
const createCosmeticItem = async (req, res) => {
  try {
    const { name, description, category, brand, price, stockQuantity } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ success: false, message: "Name, category, and price are required" });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    const item = await CosmeticItem.create({
      name,
      description,
      category,
      brand,
      price: parseFloat(price),
      image,
      stockQuantity: parseInt(stockQuantity) || 0,
      inStock: parseInt(stockQuantity) > 0,
    });

    res.status(201).json({ success: true, message: "Cosmetic item created", item });
  } catch (error) {
    console.error("Create cosmetic item error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE COSMETIC ITEM ─────────────────────────────────────────────────────
const updateCosmeticItem = async (req, res) => {
  try {
    const item = await CosmeticItem.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const { name, description, category, brand, price, stockQuantity, inStock, isActive } = req.body;

    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (category !== undefined) item.category = category;
    if (brand !== undefined) item.brand = brand;
    if (price !== undefined) item.price = parseFloat(price);
    if (stockQuantity !== undefined) item.stockQuantity = parseInt(stockQuantity);
    if (inStock !== undefined) item.inStock = inStock;
    if (isActive !== undefined) item.isActive = isActive;
    if (req.file) item.image = `/uploads/${req.file.filename}`;

    await item.save();

    res.json({ success: true, message: "Cosmetic item updated", item });
  } catch (error) {
    console.error("Update cosmetic item error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DELETE COSMETIC ITEM ─────────────────────────────────────────────────────
const deleteCosmeticItem = async (req, res) => {
  try {
    const item = await CosmeticItem.findByIdAndDelete(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({ success: true, message: "Cosmetic item deleted" });
  } catch (error) {
    console.error("Delete cosmetic item error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET ALL COSMETIC ORDERS (Admin) ──────────────────────────────────────────
const getAdminCosmeticOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await CosmeticOrder.find(query)
      .populate("beautician", "fullName phoneNumber")
      .populate("items.item", "name image price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CosmeticOrder.countDocuments(query);

    res.json({ success: true, orders, total });
  } catch (error) {
    console.error("Get admin cosmetic orders error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPDATE COSMETIC ORDER STATUS (Admin) ─────────────────────────────────────
const updateCosmeticOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Confirmed", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await CosmeticOrder.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = status;
    if (status === "Confirmed") order.confirmedAt = new Date();
    if (status === "Shipped") order.shippedAt = new Date();
    if (status === "Delivered") order.deliveredAt = new Date();
    if (status === "Cancelled") {
      order.cancelledAt = new Date();
      // Refund wallet
      const wallet = await Wallet.findOne({ user: order.user });
      if (wallet) {
        wallet.balance += order.totalAmount;
        wallet.transactions.push({
          type: "credit",
          amount: order.totalAmount,
          description: `Admin cancelled cosmetic order #${order._id} - Refund`,
          status: "completed",
        });
        await wallet.save();
      }
      // Restore stock
      for (const item of order.items) {
        await CosmeticItem.findByIdAndUpdate(item.item, {
          $inc: { stockQuantity: item.quantity },
        });
      }
    }
    await order.save();

    // Notify beautician
    const beautician = await Beautician.findById(order.beautician);
    if (beautician) {
      await Notification.create({
        user: beautician.user,
        title: "Cosmetic Order Update",
        message: `Your cosmetic order #${order._id} status has been updated to ${status}.`,
        type: "cosmetic_order",
      });
    }

    res.json({ success: true, message: `Order status updated to ${status}`, order });
  } catch (error) {
    console.error("Update cosmetic order status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAYOUT MANAGEMENT (Admin)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET PENDING PAYOUTS ──────────────────────────────────────────────────────
const getPendingPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payouts = await Booking.find({
      status: "Completed",
      "platformPayment.collectedByPlatform": true,
      "platformPayment.paidToBeautician": { $ne: true },
    })
      .populate("beautician", "fullName phoneNumber user")
      .populate("customer", "username")
      .select("beautician customer finalAmount platformPayment completedAt services")
      .sort({ "platformPayment.beauticianPayoutDate": 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments({
      status: "Completed",
      "platformPayment.collectedByPlatform": true,
      "platformPayment.paidToBeautician": { $ne: true },
    });

    // Calculate total pending amount
    const totalPendingAmount = payouts.reduce(
      (sum, p) => sum + (p.platformPayment.beauticianPayout || 0),
      0
    );

    res.json({ success: true, payouts, total, totalPendingAmount });
  } catch (error) {
    console.error("Get pending payouts error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── PROCESS PAYOUT ───────────────────────────────────────────────────────────
const processPayout = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("beautician");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.platformPayment.paidToBeautician) {
      return res.status(400).json({ success: false, message: "Payout already processed" });
    }

    const payoutAmount = booking.platformPayment.beauticianPayout || (booking.finalAmount - 200);

    // Credit beautician wallet
    const wallet = await Wallet.findOne({ user: booking.beautician.user });
    if (wallet) {
      wallet.balance += payoutAmount;
      wallet.transactions.push({
        type: "credit",
        amount: payoutAmount,
        description: `Payout for booking #${booking._id}`,
        reference: { bookingId: booking._id },
        status: "completed",
      });
      await wallet.save();
    }

    booking.platformPayment.paidToBeautician = true;
    booking.platformPayment.paidToBeauticianAt = new Date();
    await booking.save();

    // Update beautician earnings
    const beautician = await Beautician.findById(booking.beautician._id);
    if (beautician) {
      beautician.earnings.pendingPayout = Math.max(0, (beautician.earnings.pendingPayout || 0) - payoutAmount);
      await beautician.save();
    }

    // Notify beautician
    await Notification.create({
      user: booking.beautician.user,
      title: "Payout Processed",
      message: `₹${payoutAmount} has been credited to your wallet for booking #${booking._id}.`,
      type: "payment",
    });

    res.json({ success: true, message: `Payout of ₹${payoutAmount} processed`, payoutAmount });
  } catch (error) {
    console.error("Process payout error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET ADMIN NOTIFICATIONS ──────────────────────────────────────────────────
const getAdminNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { user: req.user._id, forAdmin: true };
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      forAdmin: true,
      isRead: false,
    });

    const total = await Notification.countDocuments(query);

    res.json({ success: true, notifications, unreadCount, total });
  } catch (error) {
    console.error("Get admin notifications error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── MARK ADMIN NOTIFICATION READ ─────────────────────────────────────────────
const markAdminNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, user: req.user._id },
      { isRead: true }
    );
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── MARK ALL ADMIN NOTIFICATIONS READ ────────────────────────────────────────
const markAllAdminNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, forAdmin: true, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  // Review management
  getPendingReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReviewByAdmin,
  // Cosmetic management
  getAdminCosmeticItems,
  createCosmeticItem,
  updateCosmeticItem,
  deleteCosmeticItem,
  getAdminCosmeticOrders,
  updateCosmeticOrderStatus,
  // Payout management
  getPendingPayouts,
  processPayout,
  // Admin notifications
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
};
