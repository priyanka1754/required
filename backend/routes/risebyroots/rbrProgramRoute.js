const express = require("express");
const router = express.Router();
const rbrAuth = require("../../middleware/rbrAuth");
const Program = require("../../models/risebyroots/program");
const Pillar = require("../../models/risebyroots/pillar");

// GET /programs — list active programs, optionally filter by ?ageMonths=
router.get("/", async (req, res) => {
  try {
    const { ageMonths } = req.query;
    const filter = { isActive: true };

    if (ageMonths) {
      const age = parseInt(ageMonths, 10);
      if (isNaN(age) || age < 0) {
        return res.status(400).json({ success: false, message: "ageMonths must be a positive number" });
      }
      filter.minAgeMonths = { $lte: age };
      filter.maxAgeMonths = { $gte: age };
    }

    const programs = await Program.find(filter).sort({ sortOrder: 1 }).lean();
    return res.json({ success: true, count: programs.length, data: programs });
  } catch (error) {
    console.error("GET /programs error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch programs" });
  }
});

// GET /programs/:id — single program with pillars
router.get("/:id", async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).lean();
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    const pillars = await Pillar.find({ programId: program._id }).sort({ sortOrder: 1 }).lean();
    return res.json({ success: true, data: { ...program, pillars } });
  } catch (error) {
    console.error("GET /programs/:id error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch program" });
  }
});

// GET /programs/:id/pillars
router.get("/:id/pillars", async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).lean();
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    const pillars = await Pillar.find({ programId: program._id }).sort({ sortOrder: 1 }).lean();
    return res.json({ success: true, count: pillars.length, data: pillars });
  } catch (error) {
    console.error("GET /programs/:id/pillars error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch pillars" });
  }
});

// POST /programs — create program
router.post("/", rbrAuth, async (req, res) => {
  try {
    const { programCode, name, description, format, area, minAgeMonths, maxAgeMonths, originalPrice, currentPrice, quantity, thumbnailUrl, sortOrder } = req.body;

    if (!programCode || !name) {
      return res.status(400).json({ success: false, message: "programCode and name are required" });
    }

    const existing = await Program.findOne({ programCode });
    if (existing) {
      return res.status(409).json({ success: false, message: `Program with code '${programCode}' already exists` });
    }

    const program = await Program.create({ programCode, name, description, format, area, minAgeMonths, maxAgeMonths, originalPrice, currentPrice, quantity, thumbnailUrl, sortOrder });
    return res.status(201).json({ success: true, message: "Program created successfully", data: program });
  } catch (error) {
    console.error("POST /programs error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate program code" });
    }
    return res.status(500).json({ success: false, message: "Failed to create program" });
  }
});

// PUT /programs/:id — update program
router.put("/:id", rbrAuth, async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }
    return res.json({ success: true, message: "Program updated successfully", data: program });
  } catch (error) {
    console.error("PUT /programs/:id error:", error);
    return res.status(500).json({ success: false, message: "Failed to update program" });
  }
});

// POST /programs/:id/pillars — create pillar under program
router.post("/:id/pillars", rbrAuth, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    const { pillarCode, name, description, iconUrl, totalDays, sortOrder } = req.body;

    if (!pillarCode || !name) {
      return res.status(400).json({ success: false, message: "pillarCode and name are required" });
    }

    const existing = await Pillar.findOne({ pillarCode });
    if (existing) {
      return res.status(409).json({ success: false, message: `Pillar with code '${pillarCode}' already exists` });
    }

    const pillar = await Pillar.create({ programId: program._id, pillarCode, name, description, iconUrl, totalDays, sortOrder });
    return res.status(201).json({ success: true, message: "Pillar created successfully", data: pillar });
  } catch (error) {
    console.error("POST /programs/:id/pillars error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate pillar code" });
    }
    return res.status(500).json({ success: false, message: "Failed to create pillar" });
  }
});

module.exports = router;
