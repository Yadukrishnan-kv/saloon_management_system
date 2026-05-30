const { Schema, model } = require("mongoose");

const serviceSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
      required: false,
      default: null,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    servicePercentage: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
      default: 0,
    },
    pricingType: {
      type: String,
      enum: ["Fixed", "Hourly", "Package"],
      default: "Fixed",
    },
    servicePercentageAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    image1: {
      type: String,
      default: "",
    },
    image2: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tags: [{ type: String }],
    beautician: {
      type: Schema.Types.ObjectId,
      ref: "Beautician",
      default: null,
    },
  },
  { timestamps: true }
);

serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });


// Pre-save middleware to calculate servicePercentageAmount
serviceSchema.pre("save", function (next) {
  if (typeof this.price === "number" && typeof this.servicePercentage === "number") {
    this.servicePercentageAmount = (this.price * this.servicePercentage) / 100;
  } else {
    this.servicePercentageAmount = 0;
  }
  next();
});

// Pre-update middleware for findOneAndUpdate
serviceSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.price !== undefined || update.servicePercentage !== undefined) {
    // Get the new or existing values
    const price = update.price !== undefined ? update.price : this._update.price;
    const servicePercentage = update.servicePercentage !== undefined ? update.servicePercentage : this._update.servicePercentage;
    if (typeof price === "number" && typeof servicePercentage === "number") {
      update.servicePercentageAmount = (price * servicePercentage) / 100;
    } else {
      update.servicePercentageAmount = 0;
    }
    this.setUpdate(update);
  }
  next();
});

const Service = model("Service", serviceSchema);
module.exports = Service;
