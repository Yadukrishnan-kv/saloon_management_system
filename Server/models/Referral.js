const { Schema, model } = require("mongoose");

const referralSchema = new Schema(
  {
    referrerUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referredUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
      trim: true,
    },
    rewardPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardStatus: {
      type: String,
      enum: ["pending", "completed", "expired"],
      default: "pending",
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    usedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

referralSchema.index({ referrerUser: 1 });
referralSchema.index({ referredUser: 1 });
referralSchema.index({ referralCode: 1 });

const Referral = model("Referral", referralSchema);
module.exports = Referral;
