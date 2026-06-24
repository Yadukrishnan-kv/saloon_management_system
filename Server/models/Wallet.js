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
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
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

// Schema for pending payment orders
const pendingOrderSchema = new Schema(
  {
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "paid", "expired", "failed"],
      default: "created",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600, // Auto-delete after 1 hour
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
    pendingOrders: [pendingOrderSchema],
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const Wallet = model("Wallet", walletSchema);
module.exports = Wallet;
