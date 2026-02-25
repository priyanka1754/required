const mongoose = require("mongoose");

const dayCompletionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    programDayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProgramDay",
      required: true,
    },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kid", // references existing Kid model
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date, // null = started but not finished
    attemptCount: { type: Number, default: 1 },
    timeSpentSeconds: Number,
  },
  { timestamps: true }
);

// One completion record per user per day
dayCompletionSchema.index(
  { userId: 1, programDayId: 1 },
  { unique: true }
);
dayCompletionSchema.index({ userId: 1, completedAt: 1 });

const DayCompletion =
  mongoose.models.DayCompletion ||
  mongoose.model("DayCompletion", dayCompletionSchema);

module.exports = DayCompletion;
