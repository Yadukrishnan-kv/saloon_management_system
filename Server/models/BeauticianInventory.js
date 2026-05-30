const mongoose = require('mongoose');

const BeauticianInventorySchema = new mongoose.Schema({
  beauticianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beautician',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CosmeticItem',
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CosmeticOrder',
    required: true,
    index: true
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  qrImage: {
    type: String
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'USED', 'DAMAGED', 'EXPIRED'],
    default: 'AVAILABLE',
    index: true
  },
  assignedServiceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  usedInBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  usedAt: {
    type: Date
  }
}, { timestamps: true });

BeauticianInventorySchema.index({ beauticianId: 1, productId: 1, status: 1 });
// Prevent duplicate inventory per order/product/serial (qrCode is unique per quantity)
BeauticianInventorySchema.index({ orderId: 1, productId: 1, qrCode: 1 }, { unique: true });

module.exports = mongoose.model('BeauticianInventory', BeauticianInventorySchema);
