const { Schema, model } = require("mongoose");

const transactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    reference: {
      bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
      paymentMethod: { type: String },
      transactionId: { type: String },
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const walletSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    initialBalanceLoaded: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

walletSchema.index({ user: 1 });

const Wallet = model("Wallet", walletSchema);
module.exports = Wallet;
