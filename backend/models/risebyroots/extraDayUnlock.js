const mongoose = require("mongoose");

// Audit record for each coin-based extra day unlock
const extraDayUnlockSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    programDayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProgramDay",
      required: true,
    },
    dailyAccessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DailyDayAccess",
      required: true,
    },
    coinTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CoinTransaction",
      required: true,
    },
    coinsSpent: { type: Number, required: true }, // Snapshot of cost at unlock time
  },
  { timestamps: true }
);

extraDayUnlockSchema.index({ userId: 1, createdAt: -1 });

const ExtraDayUnlock =
  mongoose.models.ExtraDayUnlock ||
  mongoose.model("ExtraDayUnlock", extraDayUnlockSchema);

module.exports = ExtraDayUnlock;
