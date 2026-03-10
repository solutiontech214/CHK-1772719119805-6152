const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String, // URL to profile picture
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    targetRole: {
      type: String,
      default: "",
    },
    // Aggregated stats (updated each time a session completes)
    stats: {
      totalInterviews: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      bestScore: { type: Number, default: 0 },
      totalTimeSpent: { type: Number, default: 0 }, // seconds
    },
  },
  { timestamps: true },
);

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;
