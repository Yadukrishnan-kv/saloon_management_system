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
      required: false,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: false,
    },
    curatedService: {
      type: Schema.Types.ObjectId,
      ref: "CuratedService",
      required: false,
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
    // No admin approval or booking required
  },
  { timestamps: true }
);


reviewSchema.index({ beautician: 1 });
reviewSchema.index({ service: 1 });
reviewSchema.index({ curatedService: 1 });
reviewSchema.index({ customer: 1 });

const Review = model("Review", reviewSchema);
module.exports = Review;
