const { Schema, model } = require("mongoose");

const complaintSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    category: {
      type: String,
      enum: ["Service", "Beautician", "Payment", "App", "Other"],
      default: "Other",
    },
    status: {
      type: String,
      enum: ["Open", "InProgress", "Resolved", "Closed"],
      default: "Open",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    adminResponse: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

complaintSchema.index({ user: 1, status: 1 });

const Complaint = model("Complaint", complaintSchema);
module.exports = Complaint;
