const mongoose = require("mongoose");

// ── Individual answer sub-document ────────────────────────────────────────────
const answerSchema = new mongoose.Schema(
  {
    questionId: Number,
    question: String,
    category: String,
    difficulty: String,
    expectedKeyPoints: [String],
    userAnswer: String,
    timeTaken: Number, // seconds
    score: Number, // 0-100
    feedback: String,
    strengths: [String],
    improvements: [String],
    modelAnswer: String,
  },
  { _id: false },
);

// ── Interview session ─────────────────────────────────────────────────────────
const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    jobRole: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["in-progress", "completed", "abandoned"],
      default: "in-progress",
    },
    questions: [
      {
        id: Number,
        question: String,
        category: String,
        difficulty: String,
        expectedKeyPoints: [String],
        timeLimit: Number,
      },
    ],
    answers: [answerSchema],
    // Final report (generated after session completes)
    report: {
      overallScore: Number,
      overallPerformance: String,
      englishEfficiency: String,
      confidence: String,
      summary: String,
      improvements: [String],
      categoryScores: [
        {
          category: String,
          score: Number,
        },
      ],
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    durationSeconds: Number,
  },
  { timestamps: true },
);

const interviewSessionModel = mongoose.model(
  "InterviewSession",
  interviewSessionSchema,
);
module.exports = interviewSessionModel;
