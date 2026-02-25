const mongoose = require("mongoose");

const userAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    achievementType: {
      type: String,
      enum: ["level", "streak", "skill", "program_complete"],
      required: true,
    },
    achievementKey: { type: String, required: true }, // e.g. level_5, streak_7, pillar_memory
    title: { type: String, required: true }, // Display name
    description: String,
    iconUrl: String, // Badge image
    earnedAt: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed, // Extra context (e.g. which program)
  },
  { timestamps: true }
);

userAchievementSchema.index(
  { userId: 1, achievementKey: 1 },
  { unique: true }
);
userAchievementSchema.index({ userId: 1, achievementType: 1 });

const UserAchievement =
  mongoose.models.UserAchievement ||
  mongoose.model("UserAchievement", userAchievementSchema);

module.exports = UserAchievement;
