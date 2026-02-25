const express = require("express");
const router = express.Router();
const rbrAuth = require("../../middleware/rbrAuth");
const Program = require("../../models/risebyroots/program");
const Pillar = require("../../models/risebyroots/pillar");
const ProgramDay = require("../../models/risebyroots/programDay");
const DayCompletion = require("../../models/risebyroots/dayCompletion");
const UserProgramAccess = require("../../models/risebyroots/userProgramAccess");
const UserAchievement = require("../../models/risebyroots/userAchievement");
const User = require("../../main/users/models/user");

// GET /progress/dashboard — overall stats
router.get("/dashboard", rbrAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("coinBalance streak").lean();

    const totalCompletions = await DayCompletion.countDocuments({ userId, completedAt: { $ne: null } });

    const enrollments = await UserProgramAccess.find({ userId }).lean();
    const programIds = enrollments.map((e) => e.programId);

    let totalDays = 0;
    if (programIds.length > 0) {
      totalDays = await ProgramDay.countDocuments({ programId: { $in: programIds } });
    }

    const achievementCount = await UserAchievement.countDocuments({ userId, earnedAt: { $ne: null } });
    const completionPercentage = totalDays > 0 ? Math.round((totalCompletions / totalDays) * 100) : 0;

    return res.json({
      success: true,
      data: {
        coinBalance: user.coinBalance || 0,
        streak: user.streak || { currentStreak: 0, longestStreak: 0, lastActivityDate: null },
        totalCompletions, totalDays, completionPercentage,
        enrolledPrograms: enrollments.length, achievementCount,
      },
    });
  } catch (error) {
    console.error("GET /progress/dashboard error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch dashboard" });
  }
});

// GET /progress/program/:programId — pillar-by-pillar progress
router.get("/program/:programId", rbrAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { programId } = req.params;

    const program = await Program.findById(programId).lean();
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    const pillars = await Pillar.find({ programId }).sort({ sortOrder: 1 }).lean();

    const completions = await DayCompletion.find({ userId, programId, completedAt: { $ne: null } }).lean();
    const completedDayIds = new Set(completions.map((c) => c.programDayId.toString()));

    const pillarProgress = await Promise.all(
      pillars.map(async (pillar) => {
        const days = await ProgramDay.find({ pillarId: pillar._id }).select("_id").lean();
        const completedCount = days.filter((d) => completedDayIds.has(d._id.toString())).length;

        return {
          _id: pillar._id, name: pillar.name, pillarCode: pillar.pillarCode,
          totalDays: days.length, completedDays: completedCount,
          percentage: days.length > 0 ? Math.round((completedCount / days.length) * 100) : 0,
        };
      })
    );

    const totalDays = pillarProgress.reduce((s, p) => s + p.totalDays, 0);
    const totalCompleted = pillarProgress.reduce((s, p) => s + p.completedDays, 0);

    return res.json({
      success: true,
      data: {
        program: { _id: program._id, name: program.name, programCode: program.programCode },
        totalDays, totalCompleted,
        overallPercentage: totalDays > 0 ? Math.round((totalCompleted / totalDays) * 100) : 0,
        pillars: pillarProgress,
      },
    });
  } catch (error) {
    console.error("GET /progress/program/:programId error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch program progress" });
  }
});

// GET /progress/achievements — earned badges
router.get("/achievements", rbrAuth, async (req, res) => {
  try {
    const achievements = await UserAchievement.find({ userId: req.user._id, earnedAt: { $ne: null } }).sort({ earnedAt: -1 }).lean();
    return res.json({ success: true, count: achievements.length, data: achievements });
  } catch (error) {
    console.error("GET /progress/achievements error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch achievements" });
  }
});

module.exports = router;
