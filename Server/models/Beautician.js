const { Schema, model } = require("mongoose");

const beauticianSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
    },
    profileImage: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    skills: [
      {
        type: String,
        enum: ["Hair", "Makeup", "Facial", "Spa", "Nails", "Waxing", "Threading", "Bridal", "Mehendi", "Other"],
      },
    ],
    experience: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: ["Classic", "Premium"],
      default: "Classic",
    },
    pccDocument: {
      documentUrl: { type: String, default: "" },
      isVerified: { type: Boolean, default: false },
      uploadedAt: { type: Date },
      verifiedAt: { type: Date },
    },
    commissionPerBooking: {
      type: Number,
      default: 200, // ₹200 commission per booking
    },
    qualifications: {
      type: String,
      default: "",
    },
    documents: [
      {
        documentType: { type: String },
        documentUrl: { type: String },
        isVerified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Inactive",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    availability: [
      {
        day: {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        },
        startTime: { type: String },
        endTime: { type: String },
        isAvailable: { type: Boolean, default: true },
      },
    ],
    location: {
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    portfolio: [
      {
        imageUrl: { type: String },
        description: { type: String },
      },
    ],
    earnings: {
      totalEarnings: { type: Number, default: 0 },
      pendingPayout: { type: Number, default: 0 },
      totalCommissionPaid: { type: Number, default: 0 },
      lastPaidAt: { type: Date },
      nextPayoutDate: { type: Date },
    },
  },
  { timestamps: true }
);

beauticianSchema.index({ "location.coordinates.lat": 1, "location.coordinates.lng": 1 });
beauticianSchema.index({ skills: 1 });
beauticianSchema.index({ status: 1, isVerified: 1 });

const Beautician = model("Beautician", beauticianSchema);
module.exports = Beautician;
