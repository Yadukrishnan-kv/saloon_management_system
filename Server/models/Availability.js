const { Schema, model } = require("mongoose");

const unavailableDateSchema = new Schema(
  {
    date: { type: Date, required: true },
    reason: { type: String, default: "" },
    isRecurring: { type: Boolean, default: false },
  },
  { _id: true }
);

const availabilitySchema = new Schema(
  {
    beautician: {
      type: Schema.Types.ObjectId,
      ref: "Beautician",
      required: true,
      unique: true,
    },
    workingDays: [
      {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      },
    ],
    workingHours: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "18:00" },
    },
    breakTime: {
      start: { type: String },
      end: { type: String },
    },
    slotDuration: {
      type: Number,
      default: 60, // minutes
    },
    unavailableDates: [unavailableDateSchema],
    // Per-slot blocking for specific dates (design: My Availability per-slot toggle)
    blockedSlots: [
      {
        date: { type: Date, required: true },
        time: { type: String, required: true }, // e.g. "09:00"
      },
    ],
  },
  { timestamps: true }
);

availabilitySchema.index({ beautician: 1 });

const Availability = model("Availability", availabilitySchema);
module.exports = Availability;
