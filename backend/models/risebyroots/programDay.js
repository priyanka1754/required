const mongoose = require("mongoose");

// Embedded sub-document: age-specific learning goals from curriculum mapping
const ageGoalSchema = new mongoose.Schema(
  {
    ageBandLabel: { type: String, required: true }, // "3-4", "4-5", "5-6", "6-7", "7-8"
    minAgeMonths: { type: Number, required: true }, // 36, 48, 60, 72, 84
    maxAgeMonths: { type: Number, required: true }, // 48, 60, 72, 84, 96
    goalDescription: { type: String, required: true }, // e.g. "Stay with a short activity"
  },
  { _id: false }
);

const programDaySchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    pillarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pillar",
      required: true,
    },
    worksheetCode: { type: String, required: true, unique: true }, // e.g. WS-ATT-D01
    dayNumber: { type: Number, required: true }, // Global 1–120 within program (4 pillars × 30)
    title: { type: String, required: true }, // e.g. "Stay with the activity"
    topic: String, // From curriculum mapping
    coreConcept: String, // e.g. "Sustained attention"
    instructions: String, // Rich text / markdown
    minAgeMonths: { type: Number, required: true },
    maxAgeMonths: { type: Number, required: true },
    pdfS3Key: String, // S3 object key for worksheet PDF
    extensionContent: String, // Extension activity description
    isPreview: { type: Boolean, default: false }, // Visible without purchase

    // Embedded: age-specific goals (~5 entries per day, one per age band)
    ageGoals: [ageGoalSchema],
  },
  { timestamps: true }
);

programDaySchema.index({ programId: 1, dayNumber: 1 }, { unique: true });
programDaySchema.index({ pillarId: 1 });
programDaySchema.index({ minAgeMonths: 1, maxAgeMonths: 1 });

const ProgramDay =
  mongoose.models.ProgramDay || mongoose.model("ProgramDay", programDaySchema);

module.exports = ProgramDay;
