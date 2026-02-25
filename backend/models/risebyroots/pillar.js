const mongoose = require("mongoose");
const { DAYS_PER_PILLAR } = require("../../riseByRootsConstants");

const pillarSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    pillarCode: { type: String, required: true, unique: true }, // e.g. PIL-ATT-001
    name: { type: String, required: true }, // e.g. "Attention & Focus"
    description: String,
    iconUrl: String,
    totalDays: { type: Number, default: DAYS_PER_PILLAR },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pillarSchema.index({ programId: 1, sortOrder: 1 });

const Pillar = mongoose.models.Pillar || mongoose.model("Pillar", pillarSchema);

module.exports = Pillar;
