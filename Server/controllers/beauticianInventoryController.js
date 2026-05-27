const BeauticianInventory = require('../models/BeauticianInventory');
const Booking = require('../models/Booking');
const CosmeticItem = require('../models/CosmeticItem');
const Service = require('../models/Service');

// List beautician inventory
exports.listInventory = async (req, res) => {
  try {
    const beauticianId = req.user.beauticianId || req.params.beauticianId;
    const inventory = await BeauticianInventory.find({ beauticianId })
      .populate('productId')
      .populate('assignedServiceIds')
      .sort({ createdAt: -1 });
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
