const mongoose = require("mongoose");

const cosmeticOrderSchema = new mongoose.Schema(
  {
    beautician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beautician",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CosmeticItem",
          required: true,
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    shippingAddress: {
      type: String,
    },
    deliveryNotes: {
      type: String,
    },
    orderedAt: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("CosmeticOrder", cosmeticOrderSchema);
