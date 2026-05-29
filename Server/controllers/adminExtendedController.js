// ─── ADMIN CREATE BEAUTICIAN (with linked User) ─────────────────────────────
const bcrypt = require("bcryptjs");

const adminCreateBeautician = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      phoneNumber,
      fullName,
      bio,
      professionalTitle,
      skills,
      experience,
      tier,
      qualifications,
      ...rest
    } = req.body;

    // Check for existing user
    const existing = await User.findOne({ $or: [ { email }, { username }, { phoneNumber } ] });
    if (existing) {
      return res.status(400).json({ success: false, message: "Username, email, or phone number already in use" });
    }

    // Create User (let pre-save hook hash password)
    const user = await User.create({
      username,
      email,
      password,
      phoneNumber,
      role: "Beautician",
      isActive: true,
    });

    // Create Beautician and link user
    const beautician = await Beautician.create({
      user: user._id,
      fullName,
      phoneNumber,
      bio,
      professionalTitle,
      skills,
      experience,
      tier,
      qualifications,
      isVerified: true,
      verificationStatus: "Approved",
      ...rest
    });

    res.status(201).json({
      success: true,
      message: "Beautician created successfully",
      beautician,
      user: { ...user.toObject(), password: undefined },
    });
  } catch (error) {
    console.error("Admin create beautician error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
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
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await CosmeticItem.find(query)
      .populate("services", "name")
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
    const { name, description, brand, price, stockQuantity, size, type, services } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: "Name and price are required" });
    }

    const cosmeticImage = req.file ? `/uploads/${req.file.filename}` : undefined;
    
    // Parse services array if it's a string (from form submission)
    let serviceIds = [];
    if (services) {
      serviceIds = typeof services === "string" ? JSON.parse(services) : services;
    }

    const item = await CosmeticItem.create({
      name,
      description,
      brand,
      price: parseFloat(price),
      cosmeticImage,
      size,
      type,
      services: serviceIds,
      stockQuantity: parseInt(stockQuantity) || 0,
      inStock: parseInt(stockQuantity) > 0,
    });

    // Populate services before returning
    await item.populate("services", "name");

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

    const { name, description, brand, price, stockQuantity, size, type, services, inStock, isActive } = req.body;

    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (brand !== undefined) item.brand = brand;
    if (price !== undefined) item.price = parseFloat(price);
    if (stockQuantity !== undefined) item.stockQuantity = parseInt(stockQuantity);
    if (size !== undefined) item.size = size;
    if (type !== undefined) item.type = type;
    if (inStock !== undefined) item.inStock = inStock;
    if (isActive !== undefined) item.isActive = isActive;
    if (req.file) item.cosmeticImage = `/uploads/${req.file.filename}`;
    
    // Handle services array
    if (services !== undefined) {
      item.services = typeof services === "string" ? JSON.parse(services) : services;
    }

    await item.save();
    
    // Populate services before returning
    await item.populate("services", "name");

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
    const { page = 1, limit = 20, status, approvalStatus } = req.query;
    const query = {};
    if (status) query.status = status;
    if (approvalStatus) query.adminApprovalStatus = approvalStatus;

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
    if (status === "Confirmed") {
      order.confirmedAt = new Date();
      // If not already approved, approve and generate inventory/QRs
      if (order.adminApprovalStatus !== "Approved") {
        order.adminApprovalStatus = "Approved";
        order.approvedAt = new Date();
        // Update stock
        for (const orderItem of order.items) {
          await CosmeticItem.findByIdAndUpdate(orderItem.item, {
            $inc: { stockQuantity: -orderItem.quantity },
          });
        }
        // Generate per-quantity QR/inventory if not already present
        const beauticianInventoryService = require("../services/beauticianInventoryService");
        const existingInventory = await require("../models/BeauticianInventory").find({ orderId: order._id });
        if (!existingInventory || existingInventory.length === 0) {
          await beauticianInventoryService.createInventoryForOrder(order);
        }
      }
      // (Optional: keep legacy order.qrCode for backward compatibility)
      if (!order.qrCode) {
        const QRCode = require("qrcode");
        const qrCodeData = JSON.stringify({
          orderId: order._id.toString(),
          beauticianId: order.beautician.toString(),
          amount: order.totalAmount,
          items: order.items.length,
          approvalDate: new Date().toISOString(),
        });
        const qrCodeUrl = await QRCode.toDataURL(qrCodeData);
        order.qrCode = qrCodeUrl;
      }
    }
    if (status === "Shipped") order.shippedAt = new Date();
    if (status === "Delivered") {
      order.deliveredAt = new Date();
      // Deduct from wallet if not already deducted
      const wallet = await Wallet.findOne({ user: order.user });
      if (wallet && (!order.walletDeducted || wallet.transactions.every(t => t.orderId?.toString() !== order._id.toString() || t.type !== "debit"))) {
        if (wallet.balance < order.totalAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient wallet balance for this order",
            required: order.totalAmount,
            available: wallet.balance,
          });
        }
        wallet.balance -= order.totalAmount;
        wallet.transactions.push({
          type: "debit",
          amount: order.totalAmount,
          description: `Cosmetic order #${order._id} - ${order.items.length} item(s) [ADMIN DELIVERED]`,
          status: "completed",
          orderId: order._id,
        });
        await wallet.save();
        order.walletDeducted = true;
      }
    }
    if (status === "Cancelled") {
      order.cancelledAt = new Date();
      order.adminApprovalStatus = "Rejected";
      order.rejectedAt = new Date();
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

// ─── APPROVE COSMETIC ORDER (Admin) - With Per-Quantity QR/Inventory Generation ──
const mongoose = require("mongoose");
const beauticianInventoryService = require("../services/beauticianInventoryService");
const approveCosmeticOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await CosmeticOrder.findById(req.params.orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.adminApprovalStatus !== "Pending") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Order already ${order.adminApprovalStatus.toLowerCase()}`,
      });
    }
    // Deduct from wallet NOW (after approval)
    const wallet = await Wallet.findOne({ user: order.user }).session(session);
    if (!wallet || wallet.balance < order.totalAmount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance for this order",
        required: order.totalAmount,
        available: wallet?.balance || 0,
      });
    }
    wallet.balance -= order.totalAmount;
    wallet.transactions.push({
      type: "debit",
      amount: order.totalAmount,
      description: `Cosmetic order #${order._id} - ${order.items.length} item(s) [ADMIN APPROVED]`,
      status: "completed",
      orderId: order._id,
    });
    await wallet.save({ session });
    // Update stock NOW (after approval)
    for (const orderItem of order.items) {
      await CosmeticItem.findByIdAndUpdate(orderItem.item, {
        $inc: { stockQuantity: -orderItem.quantity },
      }, { session });
    }
    // Create inventory items and QR codes for each product quantity
    const inventoryItems = await beauticianInventoryService.createInventoryForOrder(order);
    // Update order
    order.adminApprovalStatus = "Approved";
    order.approvedAt = new Date();
    order.status = "Confirmed";
    order.confirmedAt = new Date();
    await order.save({ session });
    await session.commitTransaction();
    // Notify beautician about approval (without QR code)
    const beautician = await Beautician.findById(order.beautician);
    if (beautician) {
      await Notification.create({
        user: beautician.user,
        title: "Cosmetic Order Approved ✓",
        message: `Your cosmetic order #${order._id} of ₹${order.totalAmount} has been approved by admin and is now confirmed.`,
        type: "cosmetic_order_approval",
        data: { orderId: order._id },
      });
    }
    res.json({
      success: true,
      message: "Order approved successfully",
      order,
      inventory: inventoryItems,
      walletDeducted: order.totalAmount,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Approve cosmetic order error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    session.endSession();
  }
};

// ─── REJECT COSMETIC ORDER (Admin) ────────────────────────────────────────────
const rejectCosmeticOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await CosmeticOrder.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.adminApprovalStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Order already ${order.adminApprovalStatus.toLowerCase()}`,
      });
    }

    // Mark as rejected - no wallet deduction, no stock update
    order.adminApprovalStatus = "Rejected";
    order.rejectedAt = new Date();
    order.rejectionReason = reason || "No reason provided";
    order.status = "Cancelled"; // Cancelled due to rejection
    await order.save();

    // Notify beautician about rejection
    const beautician = await Beautician.findById(order.beautician);
    if (beautician) {
      await Notification.create({
        user: beautician.user,
        title: "Cosmetic Order Rejected ✗",
        message: `Your cosmetic order #${order._id} of ₹${order.totalAmount} has been rejected by admin. Reason: ${order.rejectionReason}`,
        type: "cosmetic_order_rejection",
        data: { orderId: order._id, reason: order.rejectionReason },
      });
    }

    res.json({
      success: true,
      message: "Order rejected successfully",
      order,
      note: "No charges were made to the beautician",
    });
  } catch (error) {
    console.error("Reject cosmetic order error:", error);
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

// ─── GET PENDING BOOKING REQUESTS (Admin) ─────────────────────────────────────
const getPendingBookingRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "Requested" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find({ status })
      .populate("customer", "fullName phoneNumber profileImage email")
      .populate("services.service", "name price duration")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments({ status });

    res.json({
      success: true,
      bookings,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get pending booking requests error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── ASSIGN BEAUTICIAN (Admin) ────────────────────────────────────────────
const assignBeauticianToBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { beauticianId } = req.body;

    if (!beauticianId) {
      return res.status(400).json({ success: false, message: "Beautician ID is required" });
    }

    const booking = await Booking.findById(bookingId).populate("customer");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Allow assignment for both "Requested" (legacy) and "Approved" statuses
    if (!["Requested", "Approved"].includes(booking.status)) {
      return res.status(400).json({ success: false, message: "Only pending requests can be assigned" });
    }

    const beautician = await Beautician.findById(beauticianId).populate("user");
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician not found" });
    }

    // ─── CHECK BEAUTICIAN WALLET BALANCE ─────────────────────────────────────
    const Wallet = require("../models/Wallet");
    const wallet = await Wallet.findOne({ user: beautician.user._id });
    const walletBalance = wallet ? wallet.balance : 0;
    const requiredAmount = booking.finalAmount;

    if (walletBalance < requiredAmount) {
      return res.status(400).json({
        success: false,
        message: `Beautician doesn't have sufficient wallet balance. Required: ₹${requiredAmount}, Available: ₹${walletBalance}`,
        walletBalance,
        requiredAmount,
      });
    }

    // ─── CHECK 30-MINUTE BUFFER BETWEEN TASKS ───────────────────────────────
    const BUFFER_MINUTES = 30;
    
    // Get the last completed booking for this beautician
    const lastBooking = await Booking.findOne({
      beautician: beauticianId,
      status: "Completed",
    }).sort({ completedAt: -1 });

    if (lastBooking && lastBooking.completedAt) {
      // Calculate the earliest start time for the new booking
      const lastBookingEndTime = new Date(lastBooking.completedAt.getTime() + BUFFER_MINUTES * 60000);
      const newBookingStartTime = new Date(booking.bookingDate);
      
      // Parse time and set hours/minutes
      const [hours, minutes] = booking.timeSlot.startTime.split(":").map(Number);
      newBookingStartTime.setHours(hours, minutes, 0, 0);

      if (newBookingStartTime < lastBookingEndTime) {
        const minutesUntilAvailable = Math.ceil((lastBookingEndTime - newBookingStartTime) / 60000);
        return res.status(400).json({
          success: false,
          message: `Beautician cannot take this booking. Must wait ${minutesUntilAvailable} more minutes after last task completion.`,
          earliestAvailableTime: lastBookingEndTime,
          requestedTime: newBookingStartTime,
        });
      }
    }

    // Assign beautician and change status to "Assigned"
    booking.beautician = beauticianId;
    booking.status = "Assigned";
    booking.assignedAt = new Date();
    await booking.save();

    // Notify beautician about the booking assignment
    await Notification.create({
      user: beautician.user._id,
      title: "New Booking Assigned",
      message: `You have been assigned a booking from ${booking.customer.fullName}. Review and accept/reject it.`,
      type: "booking",
      data: { bookingId: booking._id },
    });

    // Notify customer about assignment
    await Notification.create({
      user: booking.customer._id,
      title: "Beautician Assigned",
      message: `A beautician has been assigned to your booking. They will accept or decline shortly.`,
      type: "booking",
      data: { bookingId: booking._id },
    });

    res.json({
      success: true,
      message: "Beautician assigned and booking approved",
      booking: await Booking.findById(bookingId).populate("beautician", "fullName phoneNumber profileImage"),
    });
  } catch (error) {
    console.error("Assign beautician error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── APPROVE BOOKING (Admin) ────────────────────────────────────────────────
const approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate("customer");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.status !== "Requested") {
      return res.status(400).json({ success: false, message: "Only pending requests can be approved" });
    }

    // Update booking status to "Approved"
    booking.status = "Approved";
    booking.approvedAt = new Date();
    await booking.save();

    // Notify customer about approval
    await Notification.create({
      user: booking.customer._id,
      title: "Booking Approved",
      message: `Your booking has been approved. Admin will assign a beautician shortly.`,
      type: "booking",
      reference: { bookingId: booking._id },
    });

    res.json({
      success: true,
      message: "Booking approved successfully",
      booking: await Booking.findById(bookingId)
        .populate("customer", "fullName phoneNumber profileImage")
        .populate("beautician", "fullName phoneNumber profileImage"),
    });
  } catch (error) {
    console.error("Approve booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET ASSIGNED BOOKINGS WITH BEAUTICIAN RESPONSES (Admin) ────────────────
const getAssignedBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, beauticianResponse } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { status: { $in: ["Assigned", "Accepted", "Rejected"] } };
    if (beauticianResponse) {
      query.status = beauticianResponse === "accepted" ? "Accepted" : "Rejected";
    }

    const bookings = await Booking.find(query)
      .populate("customer", "fullName phoneNumber profileImage email")
      .populate("beautician", "fullName phoneNumber profileImage rating")
      .populate("services.service", "name price duration")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get assigned bookings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  adminCreateBeautician,
  // Booking management
  getPendingBookingRequests,
  approveBooking,
  assignBeauticianToBooking,
  getAssignedBookings,
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
  approveCosmeticOrder,
  rejectCosmeticOrder,
  // Payout management
  getPendingPayouts,
  processPayout,
  // Admin notifications
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
};
