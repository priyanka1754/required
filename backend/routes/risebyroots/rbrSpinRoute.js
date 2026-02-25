const express = require("express");
const router = express.Router();
const rbrAuth = require("../../middleware/rbrAuth");
const SpinReward = require("../../models/risebyroots/spinReward");
const { creditCoins } = require("../../services/risebyroots/accessLimitService");
const { SPIN_COOLDOWN_HOURS, MAX_SPINS_PER_DAY } = require("../../riseByRootsConstants");

const SPIN_REWARDS = [
  { label: "5 Coins", coins: 5, weight: 40 },
  { label: "10 Coins", coins: 10, weight: 25 },
  { label: "15 Coins", coins: 15, weight: 15 },
  { label: "20 Coins", coins: 20, weight: 10 },
  { label: "50 Coins", coins: 50, weight: 5 },
  { label: "Better luck!", coins: 0, weight: 5 },
];

function pickReward() {
  const totalWeight = SPIN_REWARDS.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;
  for (const reward of SPIN_REWARDS) {
    random -= reward.weight;
    if (random <= 0) return reward;
  }
  return SPIN_REWARDS[SPIN_REWARDS.length - 1];
}

// GET /spin/status — can user spin right now?
router.get("/status", rbrAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const spinsToday = await SpinReward.countDocuments({ userId, createdAt: { $gte: todayStart } });

    const lastSpin = await SpinReward.findOne({ userId }).sort({ createdAt: -1 }).lean();

    let canSpin = spinsToday < MAX_SPINS_PER_DAY;
    let cooldownEndsAt = null;

    if (lastSpin) {
      const cooldownEnd = new Date(lastSpin.createdAt.getTime() + SPIN_COOLDOWN_HOURS * 60 * 60 * 1000);
      if (new Date() < cooldownEnd) {
        canSpin = false;
        cooldownEndsAt = cooldownEnd;
      }
    }

    return res.json({
      success: true,
      data: { canSpin, spinsUsedToday: spinsToday, maxSpinsPerDay: MAX_SPINS_PER_DAY, cooldownEndsAt, rewards: SPIN_REWARDS.map((r) => ({ label: r.label, coins: r.coins })) },
    });
  } catch (error) {
    console.error("GET /spin/status error:", error);
    return res.status(500).json({ success: false, message: "Failed to get spin status" });
  }
});

// POST /spin/play — spin the wheel
router.post("/play", rbrAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const spinsToday = await SpinReward.countDocuments({ userId, createdAt: { $gte: todayStart } });
    if (spinsToday >= MAX_SPINS_PER_DAY) {
      return res.status(429).json({ success: false, message: "No spins left today. Come back tomorrow!" });
    }

    const lastSpin = await SpinReward.findOne({ userId }).sort({ createdAt: -1 }).lean();
    if (lastSpin) {
      const cooldownEnd = new Date(lastSpin.createdAt.getTime() + SPIN_COOLDOWN_HOURS * 60 * 60 * 1000);
      if (new Date() < cooldownEnd) {
        return res.status(429).json({ success: false, message: "Cooldown active. Try again later.", cooldownEndsAt: cooldownEnd });
      }
    }

    const reward = pickReward();
    const spin = await SpinReward.create({ userId, rewardLabel: reward.label, coinsWon: reward.coins });

    let coinResult = null;
    if (reward.coins > 0) {
      coinResult = await creditCoins(userId, reward.coins, "spin_reward", spin._id.toString(), "SpinReward", `Won ${reward.coins} coins from spin`);
    }

    return res.json({
      success: true,
      message: reward.coins > 0 ? `You won ${reward.coins} coins!` : "Better luck next time!",
      data: { reward: { label: reward.label, coins: reward.coins }, newBalance: coinResult ? coinResult.newBalance : undefined, spinsRemaining: MAX_SPINS_PER_DAY - spinsToday - 1 },
    });
  } catch (error) {
    console.error("POST /spin/play error:", error);
    return res.status(500).json({ success: false, message: "Failed to spin" });
  }
});

// GET /spin/history — past spins (paginated)
router.get("/history", rbrAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [spins, total] = await Promise.all([
      SpinReward.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SpinReward.countDocuments({ userId }),
    ]);

    return res.json({
      success: true,
      data: { spins, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: skip + spins.length < total } },
    });
  } catch (error) {
    console.error("GET /spin/history error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch spin history" });
  }
});

module.exports = router;
