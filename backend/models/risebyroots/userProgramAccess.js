const mongoose = require("mongoose");

const userProgramAccessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    accessType: {
      type: String,
      enum: ["trial", "purchased"],
      required: true,
    },
    progressPct: { type: Number, default: 0, min: 0, max: 100 },
    trialDaysUsed: { type: Number, default: 0 }, // only for trial access
    startedAt: { type: Date, default: Date.now },
    lastAccessedAt: Date,
    completedAt: Date, // null = not completed
  },
  { timestamps: true }
);

userProgramAccessSchema.index(
  { userId: 1, programId: 1 },
  { unique: true }
);
userProgramAccessSchema.index({ userId: 1, accessType: 1 });

const UserProgramAccess =
  mongoose.models.UserProgramAccess ||
  mongoose.model("UserProgramAccess", userProgramAccessSchema);

module.exports = UserProgramAccess;
