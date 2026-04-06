const { Schema, model } = require("mongoose");

const otpSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["email", "phone"],
      required: true,
    },
    purpose: {
      type: String,
      enum: ["registration", "login", "password-reset", "phone-verify"],
      default: "registration",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ user: 1, type: 1, purpose: 1 });

const OTP = model("OTP", otpSchema);
module.exports = OTP;
