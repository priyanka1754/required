const mongoose = require("mongoose");

// Tracks spin/scratch card results.
// Coins earned from spins flow into coin_transactions.
const spinRewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rewardType: {
      type: String,
      enum: ["coins", "coupon", "no_reward"],
      required: true,
    },
    coinsWon: { type: Number, default: 0 },
    couponCode: String, // if reward is a coupon
    message: String, // display: "You won 15 coins!"
    isRevealed: { type: Boolean, default: false },
    expiresAt: Date,
  },
  { timestamps: true }
);

spinRewardSchema.index({ userId: 1, createdAt: -1 });

const SpinReward =
  mongoose.models.SpinReward ||
  mongoose.model("SpinReward", spinRewardSchema);

module.exports = SpinReward;
