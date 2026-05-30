const BeauticianInventory = require('../models/BeauticianInventory');
const Booking = require('../models/Booking');
const CosmeticItem = require('../models/CosmeticItem');
const Service = require('../models/Service');

// List beautician order history (all purchased products with qty info)
const CosmeticOrder = require('../models/CosmeticOrder');
const mongoose = require('mongoose');
exports.listInventory = async (req, res) => {
  try {
    const beauticianId = req.user.beauticianId || req.params.beauticianId;
    const beauticianObjId = mongoose.Types.ObjectId(beauticianId);
    // Get all delivered & approved orders for this beautician
    const orders = await CosmeticOrder.find({
      beautician: beauticianObjId,
      status: 'Delivered',
      adminApprovalStatus: 'Approved',
    }).populate('items.item');

    // Aggregate product purchase info
    const productMap = {};
    for (const order of orders) {
      for (const orderItem of order.items) {
        const pid = orderItem.item._id ? orderItem.item._id.toString() : orderItem.item.toString();
        if (!productMap[pid]) {
          productMap[pid] = {
            product: orderItem.item,
            totalPurchased: 0,
            totalUsed: 0,
          };
        }
        productMap[pid].totalPurchased += orderItem.quantity;
      }
    }
    // If there are no products, return empty array
    const allProductIds = Object.keys(productMap);
    if (allProductIds.length === 0) {
      return res.json({ success: true, inventory: [] });
    }
    // Count used items from BeauticianInventory (if any exist)
    const usedCounts = await BeauticianInventory.aggregate([
      { $match: {
          beauticianId: beauticianObjId,
          status: 'USED',
          productId: { $in: allProductIds.map(id => mongoose.Types.ObjectId(id)) }
        }
      },
      { $group: { _id: '$productId', count: { $sum: 1 } } }
    ]);
    for (const uc of usedCounts) {
      const pid = uc._id.toString();
      if (productMap[pid]) productMap[pid].totalUsed = uc.count;
    }
    // Prepare response: product, totalPurchased, totalUsed, available
    const inventory = Object.values(productMap).map(p => ({
      product: p.product,
      totalPurchased: p.totalPurchased,
      totalUsed: p.totalUsed,
      available: p.totalPurchased - p.totalUsed,
    }));
    res.json({ success: true, inventory });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Scan QR and use inventory item
exports.useInventoryItem = async (req, res) => {
  try {
    const { qrCode, bookingId } = req.body;
    const beauticianId = req.user.beauticianId;
    const item = await BeauticianInventory.findOne({ qrCode, beauticianId });
    if (!item) return res.status(404).json({ success: false, message: 'Invalid QR code or item not found' });
    if (item.status !== 'AVAILABLE') return res.status(400).json({ success: false, message: 'QR code already used or not available' });
    item.status = 'USED';
    item.usedInBookingId = bookingId;
    item.usedAt = new Date();
    await item.save();
    res.json({ success: true, message: 'Inventory item used', item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get usage history
exports.usageHistory = async (req, res) => {
  try {
    const beauticianId = req.user.beauticianId || req.params.beauticianId;
    const history = await BeauticianInventory.find({ beauticianId, status: 'USED' })
      .populate('productId')
      .populate('usedInBookingId')
      .sort({ usedAt: -1 });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Admin: filter inventory
exports.adminFilterInventory = async (req, res) => {
  try {
    const { beauticianId, productId, serviceId, status, from, to } = req.query;
    const filter = {};
    if (beauticianId) filter.beauticianId = beauticianId;
    if (productId) filter.productId = productId;
    if (status) filter.status = status;
    if (from || to) filter.usedAt = {};
    if (from) filter.usedAt.$gte = new Date(from);
    if (to) filter.usedAt.$lte = new Date(to);
    if (serviceId) filter.assignedServiceIds = serviceId;
    const inventory = await BeauticianInventory.find(filter)
      .populate('beauticianId')
      .populate('productId')
      .populate('usedInBookingId')
      .populate('assignedServiceIds')
      .sort({ updatedAt: -1 });
    res.json({ success: true, inventory });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
