const express = require("express");
const router = express.Router();
const rbrAuth = require("../../middleware/rbrAuth");
const Subscription = require("../../models/risebyroots/subscription");
const SubscriptionOrder = require("../../models/risebyroots/subscriptionOrder");
const { unlockExtraDay, getOrCreateDailyAccess } = require("../../services/risebyroots/accessLimitService");
const { FREE_TRIAL_DAYS, TRIAL_DURATION_DAYS } = require("../../riseByRootsConstants");

// GET /access/status/:programId — today's access counters
router.get("/status/:programId", rbrAuth, async (req, res) => {
  try {
    const dailyAccess = await getOrCreateDailyAccess(req.user._id, req.params.programId);

    return res.json({
      success: true,
      data: {
        date: dailyAccess.accessDate,
        freeDaysAccessed: dailyAccess.freeDaysAccessed,
        coinDaysPurchased: dailyAccess.coinDaysPurchased,
        coinDaysAccessed: dailyAccess.coinDaysAccessed,
      },
    });
  } catch (error) {
    console.error("GET /access/status error:", error);
    return res.status(500).json({ success: false, message: "Failed to get access status" });
  }
});

// POST /access/unlock-day — spend coins for extra day
router.post("/unlock-day", rbrAuth, async (req, res) => {
  try {
    const { programId, programDayId } = req.body;

    if (!programId || !programDayId) {
      return res.status(400).json({ success: false, message: "programId and programDayId are required" });
    }

    const result = await unlockExtraDay(req.user._id, programId, programDayId);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message, coinsNeeded: result.coinsNeeded, currentBalance: result.currentBalance });
    }

    return res.json({ success: true, message: result.message, data: { coinsDeducted: result.coinsDeducted, newBalance: result.newBalance } });
  } catch (error) {
    console.error("POST /access/unlock-day error:", error);
    return res.status(500).json({ success: false, message: "Failed to unlock day" });
  }
});

// GET /access/subscription — current subscription status
router.get("/subscription", rbrAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const subscription = await Subscription.findOne({
      userId, status: "active", expiresAt: { $gte: new Date() },
    }).sort({ expiresAt: -1 }).lean();

    if (!subscription) {
      const lastSub = await Subscription.findOne({ userId }).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, data: { isActive: false, lastSubscription: lastSub || null } });
    }

    return res.json({ success: true, data: { isActive: true, subscription } });
  } catch (error) {
    console.error("GET /access/subscription error:", error);
    return res.status(500).json({ success: false, message: "Failed to get subscription" });
  }
});

// POST /access/subscription/start-trial — start 7-day free trial
router.post("/subscription/start-trial", rbrAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const existingTrial = await Subscription.findOne({ userId, planType: "trial" });
    if (existingTrial) {
      return res.status(400).json({ success: false, message: "Free trial already used" });
    }

    const activeSub = await Subscription.findOne({ userId, status: "active", expiresAt: { $gte: new Date() } });
    if (activeSub) {
      return res.status(400).json({ success: false, message: "You already have an active subscription" });
    }

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({ userId, planType: "trial", status: "active", startsAt, expiresAt, autoRenew: false });

    return res.status(201).json({ success: true, message: `Free trial started! Enjoy ${TRIAL_DURATION_DAYS} days of access.`, data: subscription });
  } catch (error) {
    console.error("POST /subscription/start-trial error:", error);
    return res.status(500).json({ success: false, message: "Failed to start trial" });
  }
});

// POST /access/subscription/purchase — create Razorpay order
router.post("/subscription/purchase", rbrAuth, async (req, res) => {
  try {
    const { planType } = req.body;
    const validPlans = ["3_month", "6_month", "12_month"];

    if (!validPlans.includes(planType)) {
      return res.status(400).json({ success: false, message: `Invalid planType. Choose from: ${validPlans.join(", ")}` });
    }

    const planConfig = {
      "3_month": { amount: 29900, durationDays: 90 },
      "6_month": { amount: 49900, durationDays: 180 },
      "12_month": { amount: 79900, durationDays: 365 },
    };

    const plan = planConfig[planType];
    const razorpayOrderId = `order_rbr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const subOrder = await SubscriptionOrder.create({ userId: req.user._id, planType, amount: plan.amount, currency: "INR", razorpayOrderId, status: "pending" });

    return res.json({ success: true, message: "Order created. Complete payment to activate.", data: { orderId: subOrder._id, razorpayOrderId, amount: plan.amount, currency: "INR", planType } });
  } catch (error) {
    console.error("POST /subscription/purchase error:", error);
    return res.status(500).json({ success: false, message: "Failed to create subscription order" });
  }
});

// POST /access/subscription/verify — verify Razorpay payment & activate
router.post("/subscription/verify", rbrAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { razorpayOrderId, razorpayPaymentId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ success: false, message: "razorpayOrderId and razorpayPaymentId are required" });
    }

    const subOrder = await SubscriptionOrder.findOne({ razorpayOrderId, userId, status: "pending" });
    if (!subOrder) {
      return res.status(404).json({ success: false, message: "Order not found or already processed" });
    }

    subOrder.razorpayPaymentId = razorpayPaymentId;
    subOrder.status = "paid";
    subOrder.paidAt = new Date();
    await subOrder.save();

    const durationMap = { "3_month": 90, "6_month": 180, "12_month": 365 };
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + (durationMap[subOrder.planType] || 90) * 24 * 60 * 60 * 1000);

    await Subscription.updateMany({ userId, status: "active" }, { status: "expired" });

    const subscription = await Subscription.create({ userId, planType: subOrder.planType, status: "active", startsAt, expiresAt, orderId: subOrder._id, autoRenew: false });

    return res.json({ success: true, message: "Subscription activated successfully!", data: subscription });
  } catch (error) {
    console.error("POST /subscription/verify error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
});

module.exports = router;
