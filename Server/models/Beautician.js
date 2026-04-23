
const { Schema, model } = require("mongoose");

const beauticianSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
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
    professionalTitle: {
      type: String,
      default: "",
    },
    isAcceptingBookings: {
      type: Boolean,
      default: true,
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
        documentName: { type: String, default: "" },
        documentUrl: { type: String },
        isVerified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        uploadedAt: { type: Date, default: Date.now },
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
    verificationSteps: {
      identityVerified: {
        status: { type: String, enum: ["pending", "completed", "rejected"], default: "pending" },
        verifiedAt: { type: Date },
      },
      portfolioReview: {
        status: { type: String, enum: ["pending", "completed", "rejected"], default: "pending" },
        reviewedAt: { type: Date },
      },
      finalApproval: {
        status: { type: String, enum: ["pending", "in_progress", "completed", "rejected"], default: "pending" },
        approvedAt: { type: Date },
        approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
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
    paymentMethods: [
      {
        type: { type: String, enum: ["bank_account", "upi", "paypal"], default: "bank_account" },
        label: { type: String, default: "" },
        details: {
          accountNumber: { type: String },
          ifscCode: { type: String },
          bankName: { type: String },
          accountHolderName: { type: String },
          upiId: { type: String },
          paypalEmail: { type: String },
        },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

beauticianSchema.index({ "location.coordinates.lat": 1, "location.coordinates.lng": 1 });
beauticianSchema.index({ skills: 1 });
beauticianSchema.index({ status: 1, isVerified: 1 });

const Beautician = model("Beautician", beauticianSchema);

// Auto-delete linked User when Beautician is deleted
beauticianSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.user) {
    const User = require('./User');
    await User.findByIdAndDelete(doc.user);
  }
});
module.exports = Beautician;
