const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planType: {
      type: String,
      enum: ["trial", "3_month", "6_month", "12_month"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionOrder" }, // null for trial
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ expiresAt: 1 }); // for expiry cron job

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
