const mongoose = require("mongoose");

// Separate collection for subscription payments only.
// Existing SkipCry Order model handles product rental/buy orders.
const subscriptionOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planType: {
      type: String,
      enum: ["3_month", "6_month", "12_month"],
      required: true,
    },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: String,
    razorpaySignature: String,
    amount: { type: Number, required: true }, // In INR
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
    },
    metadata: mongoose.Schema.Types.Mixed, // any extra info
  },
  { timestamps: true }
);

subscriptionOrderSchema.index({ userId: 1, createdAt: -1 });
subscriptionOrderSchema.index({ status: 1 });

const SubscriptionOrder =
  mongoose.models.SubscriptionOrder ||
  mongoose.model("SubscriptionOrder", subscriptionOrderSchema);

module.exports = SubscriptionOrder;
