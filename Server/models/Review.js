const { Schema, model } = require("mongoose");

const reviewSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },
    beautician: {
      type: Schema.Types.ObjectId,
      ref: "Beautician",
      required: [true, "Beautician is required"],
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      maxlength: 500,
    },
    images: [{ type: String }],
    isVisible: {
      type: Boolean,
      default: true,
    },
    // Admin approval: reviews only show after admin accepts
    adminApproval: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    adminApprovedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    adminApprovedAt: { type: Date },
    adminRejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

reviewSchema.index({ beautician: 1 });
reviewSchema.index({ booking: 1 }, { unique: true });

const Review = model("Review", reviewSchema);
module.exports = Review;
