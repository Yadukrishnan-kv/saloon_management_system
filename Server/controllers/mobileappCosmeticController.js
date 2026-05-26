const CosmeticItem = require("../models/CosmeticItem");
const CosmeticOrder = require("../models/CosmeticOrder");
const Beautician = require("../models/Beautician");
const Wallet = require("../models/Wallet");
const Notification = require("../models/Notification");
const User = require("../models/User");

// ─── HELPER: Create admin notification ────────────────────────────────────────
const createAdminNotification = async (title, message, type, data) => {
  const admins = await User.find({ role: { $in: ["Admin", "SuperAdmin"] }, isActive: true });
  for (const admin of admins) {
    await Notification.create({
      user: admin._id,
      title,
      message,
      type,
      forAdmin: true,
      data,
    });
  }
};

// ─── GET ALL COSMETIC ITEMS (Beautician browsable catalog) ────────────────────
const getCosmeticItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { isActive: true, inStock: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await CosmeticItem.find(query)
      .populate("services", "name")
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CosmeticItem.countDocuments(query);

    res.json({ success: true, items, total });
  } catch (error) {
    console.error("Get cosmetic items error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET COSMETIC ITEM DETAIL ─────────────────────────────────────────────────
const getCosmeticItemDetail = async (req, res) => {
  try {
    const item = await CosmeticItem.findById(req.params.itemId).populate("services", "name");
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({ success: true, item });
  } catch (error) {
    console.error("Get cosmetic item detail error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── PLACE COSMETIC ORDER (Beautician) ────────────────────────────────────────
const placeCosmeticOrder = async (req, res) => {
  try {
    const { items, shippingAddress, deliveryNotes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one item is required" });
    }

    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const cosmeticItem = await CosmeticItem.findById(item.itemId);
      if (!cosmeticItem || !cosmeticItem.isActive) {
        return res.status(400).json({ success: false, message: `Item ${item.itemId} not found or inactive` });
      }
      if (!cosmeticItem.inStock || cosmeticItem.stockQuantity < (item.quantity || 1)) {
        return res.status(400).json({ success: false, message: `${cosmeticItem.name} is out of stock` });
      }

      const qty = item.quantity || 1;
      orderItems.push({
        item: cosmeticItem._id,
        name: cosmeticItem.name,
        quantity: qty,
        price: cosmeticItem.price,
      });
      totalAmount += cosmeticItem.price * qty;
    }

    // Check wallet balance (validation only, don't deduct yet)
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
        required: totalAmount,
        available: wallet?.balance || 0,
      });
    }

    // Create order with adminApprovalStatus = "Pending"
    // Wallet deduction and stock update will happen AFTER admin approval
    const order = await CosmeticOrder.create({
      beautician: beautician._id,
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress: shippingAddress || "",
      deliveryNotes: deliveryNotes || "",
      adminApprovalStatus: "Pending", // Awaiting admin approval
      status: "Pending", // Order status is also pending
    });

    // Notify admin about new cosmetic order awaiting approval
    await createAdminNotification(
      "Cosmetic Order - Awaiting Approval",
      `${beautician.fullName} placed a cosmetic order of ₹${totalAmount} awaiting your approval.`,
      "cosmetic_order_approval",
      { orderId: order._id, beauticianId: beautician._id }
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully. Awaiting admin approval.",
      order,
      walletBalance: wallet.balance,
      note: "Your wallet will be charged only after admin approval",
    });
  } catch (error) {
    console.error("Place cosmetic order error:", error);
    res.status(500).json({ success: false, message: error?.message || String(error) || "Server error" });
  }
};

// ─── GET MY ORDERS (Beautician) ───────────────────────────────────────────────
const getMyCosmeticOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const query = { beautician: beautician._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await CosmeticOrder.find(query)
      .populate("items.item", "name image price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CosmeticOrder.countDocuments(query);

    res.json({ success: true, orders, total });
  } catch (error) {
    console.error("Get my cosmetic orders error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET ORDER DETAIL ─────────────────────────────────────────────────────────
const getCosmeticOrderDetail = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    const order = await CosmeticOrder.findOne({
      _id: req.params.orderId,
      beautician: beautician?._id,
    }).populate("items.item", "name image price brand");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("Get cosmetic order detail error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── CANCEL COSMETIC ORDER (Beautician) ───────────────────────────────────────
const cancelCosmeticOrder = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    const order = await CosmeticOrder.findOne({
      _id: req.params.orderId,
      beautician: beautician?._id,
      status: "Pending",
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or cannot be cancelled" });
    }

    order.status = "Cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = req.body.reason || "";
    await order.save();

    // Refund to wallet
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (wallet) {
      wallet.balance += order.totalAmount;
      wallet.transactions.push({
        type: "credit",
        amount: order.totalAmount,
        description: `Refund for cancelled cosmetic order #${order._id}`,
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

    res.json({ success: true, message: "Order cancelled and refunded", refundAmount: order.totalAmount });
  } catch (error) {
    console.error("Cancel cosmetic order error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getCosmeticItems,
  getCosmeticItemDetail,
  placeCosmeticOrder,
  getMyCosmeticOrders,
  getCosmeticOrderDetail,
  cancelCosmeticOrder,
};
