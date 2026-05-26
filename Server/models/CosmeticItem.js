const mongoose = require("mongoose");

const cosmeticItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Legacy field - kept for backward compatibility, no longer used in new flows
    category: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    // Main cosmetic image
    cosmeticImage: {
      type: String,
    },
    // Legacy field - kept for backward compatibility
    image: {
      type: String,
    },
    // New fields
    size: {
      type: String,
      trim: true,
      // Examples: "Small", "Medium", "Large", "100ml", "250ml"
    },
    type: {
      type: String,
      trim: true,
      // Examples: "Cream", "Lotion", "Serum", "Oil", "Powder"
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CosmeticItem", cosmeticItemSchema);
