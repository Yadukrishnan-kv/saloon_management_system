const mongoose = require('mongoose');

const CuratedServiceSchema = new mongoose.Schema({
  curatedServiceName: { type: String, required: true, trim: true },
  curatedServiceTitle: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
  description: { type: String, default: '' },
  pricingType: { type: String, enum: ['Fixed', 'Hourly', 'Package'], default: 'Fixed' },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, required: true, min: 1 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  image1: { type: String, default: '' },
  image2: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CuratedService', CuratedServiceSchema);
