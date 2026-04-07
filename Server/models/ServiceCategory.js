const { Schema, model } = require("mongoose");

const serviceCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCategory",
      default: null,
    },
    image: {
      type: String,
      default: "",
    },
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

serviceCategorySchema.index({ parentCategory: 1, sortOrder: 1 });

const ServiceCategory = model("ServiceCategory", serviceCategorySchema);
module.exports = ServiceCategory;
