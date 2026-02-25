const mongoose = require("mongoose");

// IMMUTABLE LEDGER — never update or delete documents.
// This IS the coin history. Query with: find({ userId }).sort({ createdAt: -1 })
const coinTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true }, // +credit, -debit
    balanceAfter: { type: Number, required: true }, // Running balance for audit
    transactionType: {
      type: String,
      required: true,
      enum: [
        "order_reward",       // earned from completing a product order
        "spin_reward",        // earned from spin/scratch card
        "referral_bonus",     // earned from referring a new user
        "achievement_reward", // earned from completing achievements
        "extra_day_unlock",   // spent to unlock extra program day
        "admin_adjustment",   // manual admin credit/debit
      ],
    },
    referenceId: mongoose.Schema.Types.ObjectId, // orderId, spinRewardId, etc.
    referenceType: String, // "Order", "SpinReward", "UserAchievement", etc.
    description: String, // Human-readable: "Earned 20 coins from order #ORD123"
  },
  { timestamps: true }
);

// Prevent updates — coin_transactions is immutable
coinTransactionSchema.pre("findOneAndUpdate", function () {
  throw new Error("coin_transactions is immutable — updates are not allowed");
});
coinTransactionSchema.pre("updateOne", function () {
  throw new Error("coin_transactions is immutable — updates are not allowed");
});
coinTransactionSchema.pre("updateMany", function () {
  throw new Error("coin_transactions is immutable — updates are not allowed");
});

// Prevent deletes
coinTransactionSchema.pre("deleteOne", function () {
  throw new Error("coin_transactions is immutable — deletes are not allowed");
});
coinTransactionSchema.pre("deleteMany", function () {
  throw new Error("coin_transactions is immutable — deletes are not allowed");
});

coinTransactionSchema.index({ userId: 1, createdAt: -1 }); // coin history
coinTransactionSchema.index({ referenceId: 1 });

const CoinTransaction =
  mongoose.models.CoinTransaction ||
  mongoose.model("CoinTransaction", coinTransactionSchema);

module.exports = CoinTransaction;
