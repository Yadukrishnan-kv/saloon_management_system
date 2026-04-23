// Auto-delete linked User when Customer is deleted (if you have a Customer model)
// Example for Customer model:
// customerSchema.post('findOneAndDelete', async function(doc) {
//   if (doc && doc.user) {
//     const User = require('./User');
//     await User.findByIdAndDelete(doc.user);
//   }
// });
const { Schema, model } = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: "Please provide a valid email",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    role: {
      type: String,
      required: true,
      default: "Customer",
    },
    tier: {
      type: String,
      enum: ["Classic", "Premium"],
      default: "Classic",
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    addresses: [
      {
        label: { type: String, default: "Home" },
        address: { type: String },
        city: { type: String },
        pincode: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
        isDefault: { type: Boolean, default: false },
      },
    ],
    deviceTokens: [
      {
        token: { type: String },
        deviceType: { type: String, enum: ["ios", "android"] },
      },
    ],
    favoriteBeauticians: [
      {
        type: Schema.Types.ObjectId,
        ref: "Beautician",
      },
    ],
    favoriteServices: [
      {
        type: Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    notificationSettings: {
      bookingUpdates: { type: Boolean, default: true },
      promotional: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = model("User", userSchema);
module.exports = User;
