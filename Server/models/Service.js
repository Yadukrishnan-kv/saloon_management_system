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
      ref: "ServiceCategory",
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    pricingType: {
      type: String,
      enum: ["Fixed", "Hourly", "Package"],
      default: "Fixed",
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    image: {
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
  },
  { timestamps: true }
);

serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });

const Service = model("Service", serviceSchema);
module.exports = Service;
