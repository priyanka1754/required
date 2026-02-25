const mongoose = require("mongoose");

// Links existing SkipCry products to program days (max 2 per day, API-enforced).
// References the existing Product model's _id — no separate product collection needed.
const dayProductMappingSchema = new mongoose.Schema(
  {
    programDayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProgramDay",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // references existing SkipCry Product model
      required: true,
    },
    sortOrder: { type: Number, default: 0 }, // 0 = primary, 1 = secondary
  },
  { timestamps: true }
);

dayProductMappingSchema.index(
  { programDayId: 1, productId: 1 },
  { unique: true }
);
dayProductMappingSchema.index({ programDayId: 1 });

const DayProductMapping =
  mongoose.models.DayProductMapping ||
  mongoose.model("DayProductMapping", dayProductMappingSchema);

module.exports = DayProductMapping;
