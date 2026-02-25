// RiseByRoots Constants
// Single source of truth for all configurable values.
// Change values here — no need to touch .env or any other file.

module.exports = {
  // ──── Program Structure ────
  PILLARS_PER_PROGRAM: 4,
  DAYS_PER_PILLAR: 30,
  TOTAL_DAYS_PER_PROGRAM: 4 * 30, // 120
  MAX_PRODUCTS_PER_DAY: 2,

  // ──── Daily Access Limits ────
  MAX_DAYS_PER_PROGRAM_PER_DAY: 4,
  EXTRA_DAY_COIN_COST: 10,
  MAX_COIN_EXTRA_DAYS_PER_DAY: 4,

  // ──── Subscription & Trial ────
  FREE_TRIAL_DAYS: 7,
  TRIAL_DURATION_DAYS: 7,

  // ──── Coin Earning ────
  COINS_PER_ORDER: 20,
  SPIN_COOLDOWN_HOURS: 24,
  MAX_SPINS_PER_DAY: 1,

  // ──── Gamification ────
  STREAK_RESET_GRACE_HOURS: 26,

  // ──── PDF Security ────
  S3_SIGNED_URL_TTL_SECONDS: 900, // 15 minutes
};
