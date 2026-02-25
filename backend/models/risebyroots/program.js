const mongoose = require("mongoose");
const { TOTAL_DAYS_PER_PROGRAM } = require("../../riseByRootsConstants");

const programSchema = new mongoose.Schema(
  {
    programCode: { type: String, required: true, unique: true }, // e.g. PRG-PS-001
    name: { type: String, required: true },
    description: String,
    durationDays: { type: Number, default: TOTAL_DAYS_PER_PROGRAM },
    format: {
      type: String,
      enum: ["digital", "physical", "hybrid"],
      required: true,
    },
    area: { type: String, required: true }, // thinking, social
    minAgeMonths: { type: Number, required: true },
    maxAgeMonths: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    quantity: Number, // null = unlimited
    thumbnailUrl: String,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

programSchema.index({ minAgeMonths: 1, maxAgeMonths: 1 });
programSchema.index({ isActive: 1 });

const Program =
  mongoose.models.Program || mongoose.model("Program", programSchema);

module.exports = Program;
