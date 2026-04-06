const { Schema, model } = require("mongoose");

const bookingSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },
    beautician: {
      type: Schema.Types.ObjectId,
      ref: "Beautician",
      default: null,
    },
    // Multi-beautician broadcast: send to 3-4 beauticians, first accept wins
    broadcastedTo: [
      {
        beautician: { type: Schema.Types.ObjectId, ref: "Beautician" },
        sentAt: { type: Date, default: Date.now },
        respondedAt: { type: Date },
        response: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
      },
    ],
    services: [
      {
        service: {
          type: Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        serviceName: { type: String },
        price: { type: Number },
        duration: { type: Number },
      },
    ],
    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    timeSlot: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    status: {
      type: String,
      enum: [
        "Requested",
        "Assigned",
        "Accepted",
        "InProgress",
        "Completed",
        "Cancelled",
        "Rejected",
      ],
      default: "Requested",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded", "PartialRefund"],
      default: "Pending",
    },
    // Platform collects payment, pays beautician in 4 days
    platformPayment: {
      collectedByPlatform: { type: Boolean, default: false },
      collectedAt: { type: Date },
      beauticianPayoutDate: { type: Date }, // collectedAt + 4 days
      paidToBeautician: { type: Boolean, default: false },
      paidToBeauticianAt: { type: Date },
      platformCommission: { type: Number, default: 200 }, // ₹200 per booking
      beauticianPayout: { type: Number, default: 0 }, // finalAmount - commission
    },
    // Cancellation fee
    cancellationFee: {
      type: Number,
      default: 0, // ₹200 if cancelled
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    notes: {
      type: String,
      default: "",
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    cancelledBy: {
      type: String,
      enum: ["Customer", "Beautician", "Admin", ""],
      default: "",
    },
    assignedAt: { type: Date },
    acceptedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ beautician: 1, status: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ status: 1 });

const Booking = model("Booking", bookingSchema);
module.exports = Booking;
