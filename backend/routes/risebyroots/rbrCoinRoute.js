const express = require("express");
const router = express.Router();
const rbrAuth = require("../../middleware/rbrAuth");
const CoinTransaction = require("../../models/risebyroots/coinTransaction");
const User = require("../../main/users/models/user");
const { creditCoins } = require("../../services/risebyroots/accessLimitService");
const { COINS_PER_ORDER } = require("../../riseByRootsConstants");

// GET /coins/balance
router.get("/balance", rbrAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("coinBalance").lean();
    return res.json({ success: true, data: { balance: user.coinBalance || 0 } });
  } catch (error) {
    console.error("GET /coins/balance error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch coin balance" });
  }
});

// GET /coins/history — paginated, filter by ?type=earned|spent
router.get("/history", rbrAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (req.query.type === "earned") filter.amount = { $gt: 0 };
    else if (req.query.type === "spent") filter.amount = { $lt: 0 };

    const [transactions, total] = await Promise.all([
      CoinTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CoinTransaction.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        transactions,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: skip + transactions.length < total },
      },
    });
  } catch (error) {
    console.error("GET /coins/history error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch coin history" });
  }
});

// POST /coins/earn/order — credit coins after product order (internal)
router.post("/earn/order", async (req, res) => {
  try {
    const { userId, orderId } = req.body;

    if (!userId || !orderId) {
      return res.status(400).json({ success: false, message: "userId and orderId are required" });
    }

    const existing = await CoinTransaction.findOne({ userId, referenceId: orderId, transactionType: "order_reward" });
    if (existing) {
      return res.status(409).json({ success: false, message: "Coins already awarded for this order" });
    }

    const result = await creditCoins(userId, COINS_PER_ORDER, "order_reward", orderId, "Order", `Earned ${COINS_PER_ORDER} coins from product order`);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.json({ success: true, message: `${COINS_PER_ORDER} coins awarded!`, data: { coinsEarned: COINS_PER_ORDER, newBalance: result.newBalance } });
  } catch (error) {
    console.error("POST /coins/earn/order error:", error);
    return res.status(500).json({ success: false, message: "Failed to award coins" });
  }
});

module.exports = router;
