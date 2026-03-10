const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one active resume per user
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
    rawText: {
      type: String,
    },
    // Parsed / AI-analysed data
    name: String,
    email: String,
    phone: String,
    summary: String,
    skills: [String],
    experience: [
      {
        company: String,
        role: String,
        duration: String,
        highlights: [String],
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        year: String,
      },
    ],
    projects: [
      {
        name: String,
        description: String,
        technologies: [String],
      },
    ],
    certifications: [String],
    strengths: [String],
    areasOfImprovement: [String],
    overallScore: {
      type: Number,
      default: 0,
    },
    scoreBreakdown: {
      skills: Number,
      experience: Number,
      education: Number,
      projects: Number,
      presentation: Number,
    },
    jobRoles: [String],
    analysedAt: Date,
  },
  { timestamps: true },
);

const resumeModel = mongoose.model("Resume", resumeSchema);
module.exports = resumeModel;
