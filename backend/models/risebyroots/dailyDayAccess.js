const mongoose = require("mongoose");

// KEY COLLECTION: Enforces the daily access limit.
// One document per (user × program × calendar date).
// All limit values come from ENV / system_config — never hardcoded.
const dailyDayAccessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    accessDate: { type: Date, required: true }, // Calendar day (midnight IST)
    freeDaysAccessed: { type: Number, default: 0 }, // Free opens today
    coinDaysPurchased: { type: Number, default: 0 }, // Extra days bought with coins
    coinDaysAccessed: { type: Number, default: 0 }, // Extra days actually opened
  },
  { timestamps: true }
);

// CRITICAL: only one record per user per program per day
dailyDayAccessSchema.index(
  { userId: 1, programId: 1, accessDate: 1 },
  { unique: true }
);

const DailyDayAccess =
  mongoose.models.DailyDayAccess ||
  mongoose.model("DailyDayAccess", dailyDayAccessSchema);

module.exports = DailyDayAccess;
