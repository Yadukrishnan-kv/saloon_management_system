const { Schema, model } = require("mongoose");

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["booking", "payment", "promotional", "system", "reminder", "review", "cosmetic_order", "payout"],
      default: "system",
    },
    // For admin notifications - null user means broadcast to all admins
    forAdmin: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    data: {
      bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
      serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
      actionUrl: { type: String },
    },
    deviceTokens: [
      {
        token: { type: String },
        deviceType: { type: String, enum: ["ios", "android"] },
      },
    ],
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = model("Notification", notificationSchema);
module.exports = Notification;
