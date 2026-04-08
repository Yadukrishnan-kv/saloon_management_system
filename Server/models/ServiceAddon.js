const { Schema, model } = require("mongoose");

const serviceAddonSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Add-on name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    image: {
      type: String,
      default: "",
    },
    // Which services this add-on applies to (empty = all services)
    applicableServices: [
      {
        type: Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    // Which categories this add-on applies to (empty = all categories)
    applicableCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: "ServiceCategory",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

serviceAddonSchema.index({ isActive: 1 });

const ServiceAddon = model("ServiceAddon", serviceAddonSchema);
module.exports = ServiceAddon;
