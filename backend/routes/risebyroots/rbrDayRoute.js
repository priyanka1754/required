const express = require("express");
const router = express.Router();
const rbrAuth = require("../../middleware/rbrAuth");
const ProgramDay = require("../../models/risebyroots/programDay");
const DayCompletion = require("../../models/risebyroots/dayCompletion");
const DayProductMapping = require("../../models/risebyroots/dayProductMapping");
const Product = require("../../models/product");
const { checkDayAccess, updateStreak } = require("../../services/risebyroots/accessLimitService");

// GET /days/pillar/:pillarId — list days with completion status
router.get("/pillar/:pillarId", rbrAuth, async (req, res) => {
  try {
    const { pillarId } = req.params;
    const { kidId } = req.query;
    const userId = req.user._id;

    const days = await ProgramDay.find({ pillarId })
      .sort({ dayNumber: 1 })
      .select("dayNumber title topic coreConcept isPreview worksheetCode")
      .lean();

    if (!days.length) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const dayIds = days.map((d) => d._id);
    const completionFilter = { userId, programDayId: { $in: dayIds } };
    if (kidId) completionFilter.kidId = kidId;

    const completions = await DayCompletion.find(completionFilter).select("programDayId completedAt").lean();

    const completionMap = {};
    completions.forEach((c) => {
      completionMap[c.programDayId.toString()] = { completed: !!c.completedAt, completedAt: c.completedAt };
    });

    const enrichedDays = days.map((day) => ({
      ...day,
      completion: completionMap[day._id.toString()] || { completed: false, completedAt: null },
    }));

    return res.json({ success: true, count: enrichedDays.length, data: enrichedDays });
  } catch (error) {
    console.error("GET /days/pillar/:pillarId error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch days" });
  }
});

// GET /days/:id — full day detail (enforces daily access limit)
router.get("/:id", rbrAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const day = await ProgramDay.findById(req.params.id).lean();

    if (!day) {
      return res.status(404).json({ success: false, message: "Day not found" });
    }

    const accessResult = await checkDayAccess(userId, day.programId, day._id);

    if (!accessResult.allowed) {
      return res.status(403).json({
        success: false,
        message: accessResult.reason === "needs_coin_unlock"
          ? `Free limit reached. Unlock with ${accessResult.coinCost} coins.`
          : "Daily limit reached. Come back tomorrow!",
        access: accessResult,
      });
    }

    // Get recommended products
    const productMappings = await DayProductMapping.find({ programDayId: day._id }).lean();
    let products = [];
    if (productMappings.length > 0) {
      const productIds = productMappings.map((m) => m.productId);
      products = await Product.find({ _id: { $in: productIds } }).select("Code Name Images Price Brand Category").lean();
    }

    return res.json({ success: true, data: { ...day, products, access: accessResult } });
  } catch (error) {
    console.error("GET /days/:id error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch day" });
  }
});

// POST /days/:id/complete — mark day as completed
router.post("/:id/complete", rbrAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const programDayId = req.params.id;
    const { kidId } = req.body;

    const day = await ProgramDay.findById(programDayId);
    if (!day) {
      return res.status(404).json({ success: false, message: "Day not found" });
    }

    let completion = await DayCompletion.findOne({ userId, programDayId });

    if (completion && completion.completedAt) {
      return res.json({ success: true, message: "Day already completed", data: completion });
    }

    if (!completion) {
      completion = new DayCompletion({
        userId, programDayId, programId: day.programId,
        kidId: kidId || null, startedAt: new Date(),
      });
    }

    completion.completedAt = new Date();
    await completion.save();

    const streakResult = await updateStreak(userId);

    return res.json({
      success: true,
      message: "Day completed!",
      data: { completion, streak: streakResult },
    });
  } catch (error) {
    console.error("POST /days/:id/complete error:", error);
    return res.status(500).json({ success: false, message: "Failed to complete day" });
  }
});

// POST /days — create day (admin)
router.post("/", rbrAuth, async (req, res) => {
  try {
    const { programId, pillarId, worksheetCode, dayNumber, title, topic, coreConcept, instructions, minAgeMonths, maxAgeMonths, pdfS3Key, extensionContent, ageGoals, isPreview } = req.body;

    if (!programId || !pillarId || !worksheetCode || !dayNumber || !title) {
      return res.status(400).json({ success: false, message: "programId, pillarId, worksheetCode, dayNumber, and title are required" });
    }

    const existing = await ProgramDay.findOne({ worksheetCode });
    if (existing) {
      return res.status(409).json({ success: false, message: `Worksheet '${worksheetCode}' already exists` });
    }

    const day = await ProgramDay.create({ programId, pillarId, worksheetCode, dayNumber, title, topic, coreConcept, instructions, minAgeMonths, maxAgeMonths, pdfS3Key, extensionContent, ageGoals: ageGoals || [], isPreview: isPreview || false });
    return res.status(201).json({ success: true, message: "Program day created successfully", data: day });
  } catch (error) {
    console.error("POST /days error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate worksheet code" });
    }
    return res.status(500).json({ success: false, message: "Failed to create day" });
  }
});

// PUT /days/:id — update day (admin)
router.put("/:id", rbrAuth, async (req, res) => {
  try {
    const day = await ProgramDay.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!day) {
      return res.status(404).json({ success: false, message: "Day not found" });
    }
    return res.json({ success: true, message: "Day updated successfully", data: day });
  } catch (error) {
    console.error("PUT /days/:id error:", error);
    return res.status(500).json({ success: false, message: "Failed to update day" });
  }
});

module.exports = router;
