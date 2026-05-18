const { Schema, model } = require("mongoose");

const referralSettingsSchema = new Schema(
  {
    pointsPerReferral: {
      type: Number,
      default: 10,
      min: 1,
      required: true,
    },
    pointsRedemptionLimit: {
      type: Number,
      default: 100,
      min: 1,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: "Referral reward configuration",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Ensure only one settings document exists
referralSettingsSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      throw new Error("Only one referral settings document can exist");
    }
  }
  next();
});

const ReferralSettings = model("ReferralSettings", referralSettingsSchema);
module.exports = ReferralSettings;
