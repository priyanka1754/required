const DailyDayAccess = require("../../models/risebyroots/dailyDayAccess");
const DayCompletion = require("../../models/risebyroots/dayCompletion");
const CoinTransaction = require("../../models/risebyroots/coinTransaction");
const ExtraDayUnlock = require("../../models/risebyroots/extraDayUnlock");
const User = require("../../main/users/models/user");
const {
  MAX_DAYS_PER_PROGRAM_PER_DAY,
  EXTRA_DAY_COIN_COST,
  MAX_COIN_EXTRA_DAYS_PER_DAY,
  STREAK_RESET_GRACE_HOURS,
} = require("../../riseByRootsConstants");

function getTodayIST() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  istNow.setUTCHours(0, 0, 0, 0);
  return istNow;
}

async function getOrCreateDailyAccess(userId, programId) {
  const today = getTodayIST();

  let record = await DailyDayAccess.findOne({
    userId,
    programId,
    accessDate: today,
  });

  if (!record) {
    record = await DailyDayAccess.create({
      userId,
      programId,
      accessDate: today,
      freeDaysAccessed: 0,
      coinDaysPurchased: 0,
      coinDaysAccessed: 0,
    });
  }

  return record;
}

async function checkDayAccess(userId, programId, programDayId) {
  // Already completed → free re-view
  const completion = await DayCompletion.findOne({
    userId,
    programDayId,
    completedAt: { $ne: null },
  });

  if (completion) {
    return {
      allowed: true,
      reason: "re_view",
      requiresCoinUnlock: false,
      freeUsed: null,
      freeLimit: MAX_DAYS_PER_PROGRAM_PER_DAY,
      coinUsed: null,
      coinLimit: MAX_COIN_EXTRA_DAYS_PER_DAY,
    };
  }

  const dailyAccess = await getOrCreateDailyAccess(userId, programId);

  // Free quota available
  if (dailyAccess.freeDaysAccessed < MAX_DAYS_PER_PROGRAM_PER_DAY) {
    dailyAccess.freeDaysAccessed += 1;
    await dailyAccess.save();

    return {
      allowed: true,
      reason: "free",
      requiresCoinUnlock: false,
      freeUsed: dailyAccess.freeDaysAccessed,
      freeLimit: MAX_DAYS_PER_PROGRAM_PER_DAY,
      coinUsed: dailyAccess.coinDaysAccessed,
      coinLimit: MAX_COIN_EXTRA_DAYS_PER_DAY,
    };
  }

  // Coin-day slot available → prompt unlock
  if (dailyAccess.coinDaysPurchased < MAX_COIN_EXTRA_DAYS_PER_DAY) {
    return {
      allowed: false,
      reason: "needs_coin_unlock",
      requiresCoinUnlock: true,
      coinCost: EXTRA_DAY_COIN_COST,
      freeUsed: dailyAccess.freeDaysAccessed,
      freeLimit: MAX_DAYS_PER_PROGRAM_PER_DAY,
      coinUsed: dailyAccess.coinDaysPurchased,
      coinLimit: MAX_COIN_EXTRA_DAYS_PER_DAY,
    };
  }

  // Hard limit
  return {
    allowed: false,
    reason: "daily_limit_reached",
    requiresCoinUnlock: false,
    freeUsed: dailyAccess.freeDaysAccessed,
    freeLimit: MAX_DAYS_PER_PROGRAM_PER_DAY,
    coinUsed: dailyAccess.coinDaysPurchased,
    coinLimit: MAX_COIN_EXTRA_DAYS_PER_DAY,
  };
}

async function unlockExtraDay(userId, programId, programDayId) {
  const dailyAccess = await getOrCreateDailyAccess(userId, programId);

  if (dailyAccess.coinDaysPurchased >= MAX_COIN_EXTRA_DAYS_PER_DAY) {
    return {
      success: false,
      message: "Daily coin-day limit reached. Try again tomorrow.",
    };
  }

  const user = await User.findById(userId);
  const currentBalance = user.coinBalance || 0;

  if (currentBalance < EXTRA_DAY_COIN_COST) {
    return {
      success: false,
      message: `Not enough coins. Need ${EXTRA_DAY_COIN_COST}, have ${currentBalance}.`,
      coinsNeeded: EXTRA_DAY_COIN_COST,
      currentBalance,
    };
  }

  const newBalance = currentBalance - EXTRA_DAY_COIN_COST;
  user.coinBalance = newBalance;
  await user.save();

  const coinTxn = await CoinTransaction.create({
    userId,
    amount: -EXTRA_DAY_COIN_COST,
    balanceAfter: newBalance,
    transactionType: "extra_day_unlock",
    referenceId: programDayId,
    referenceType: "ProgramDay",
    description: `Unlocked extra day with ${EXTRA_DAY_COIN_COST} coins`,
  });

  dailyAccess.coinDaysPurchased += 1;
  dailyAccess.coinDaysAccessed += 1;
  await dailyAccess.save();

  await ExtraDayUnlock.create({
    userId,
    programDayId,
    dailyAccessId: dailyAccess._id,
    coinTransactionId: coinTxn._id,
    coinsSpent: EXTRA_DAY_COIN_COST,
  });

  return {
    success: true,
    message: "Day unlocked successfully!",
    coinsDeducted: EXTRA_DAY_COIN_COST,
    newBalance,
  };
}

async function creditCoins(userId, amount, transactionType, referenceId, referenceType, description) {
  if (amount <= 0) {
    return { success: false, message: "Amount must be positive" };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { success: false, message: "User not found" };
  }

  const currentBalance = user.coinBalance || 0;
  const newBalance = currentBalance + amount;

  user.coinBalance = newBalance;
  await user.save();

  const transaction = await CoinTransaction.create({
    userId,
    amount: +amount,
    balanceAfter: newBalance,
    transactionType,
    referenceId,
    referenceType,
    description,
  });

  return { success: true, newBalance, transaction };
}

async function updateStreak(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const streak = user.streak || {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
  };

  const now = new Date();
  const lastActivity = streak.lastActivityDate
    ? new Date(streak.lastActivityDate)
    : null;

  let newStreak;

  if (lastActivity) {
    const hoursSince = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursSince <= STREAK_RESET_GRACE_HOURS) {
      const lastDay = new Date(lastActivity); lastDay.setHours(0, 0, 0, 0);
      const today = new Date(now); today.setHours(0, 0, 0, 0);

      if (lastDay.getTime() === today.getTime()) {
        return {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          isNewRecord: false,
        };
      }
      newStreak = streak.currentStreak + 1;
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const isNewRecord = newStreak > streak.longestStreak;

  user.streak = {
    currentStreak: newStreak,
    longestStreak: isNewRecord ? newStreak : streak.longestStreak,
    lastActivityDate: now,
  };
  await user.save();

  return { currentStreak: newStreak, longestStreak: user.streak.longestStreak, isNewRecord };
}

module.exports = {
  checkDayAccess,
  unlockExtraDay,
  creditCoins,
  updateStreak,
  getOrCreateDailyAccess,
  getTodayIST,
};
