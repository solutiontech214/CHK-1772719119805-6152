const resumeModel = require("../models/resume.model");
const uploadFile = require("../service/storage.service");
const {
  analyseResume,
  extractTextFromBuffer,
  analyseAndGenerateQuestions,
} = require("../service/ai.service");
const interviewSessionModel = require("../models/interview.model");

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file uploaded" });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res
        .status(400)
        .json({ message: "Only PDF files are accepted for resume upload" });
    }

    const uploaded = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "/NextHireAI/resumes",
    );

    const rawText = await extractTextFromBuffer(req.file.buffer);

    // Multimodal Analysis: Pass both extracted text and original PDF buffer for accuracy
    const analysisResult = await analyseResume(rawText, {
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    // 4. Upsert resume (one active resume per user)
    const resume = await resumeModel.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        fileUrl: uploaded.url,
        fileName: req.file.originalname,
        rawText,
        analysedAt: new Date(),
        ...analysisResult,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({
      message: "Resume uploaded and analysed successfully",
      resume,
    });
  } catch (error) {
    console.error("uploadResume error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const getMyResume = async (req, res) => {
  try {
    const resume = await resumeModel.findOne({ userId: req.user.id });

    if (!resume) {
      return res
        .status(404)
        .json({ message: "No resume found. Please upload your resume first." });
    }

    return res.status(200).json({ resume });
  } catch (error) {
    console.error("getMyResume error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteMyResume = async (req, res) => {
  try {
    await resumeModel.findOneAndDelete({ userId: req.user.id });
    return res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    console.error("deleteMyResume error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const reanalyseResume = async (req, res) => {
  try {
    const resume = await resumeModel.findOne({ userId: req.user.id });

    if (!resume) {
      return res
        .status(404)
        .json({ message: "No resume found. Please upload first." });
    }

    if (!resume.rawText || resume.rawText.length < 50) {
      return res
        .status(400)
        .json({ message: "Resume text is too short to analyse." });
    }

    const analysisResult = await analyseResume(resume.rawText);

    const updated = await resumeModel.findOneAndUpdate(
      { userId: req.user.id },
      { ...analysisResult, analysedAt: new Date() },
      { new: true },
    );

    return res.status(200).json({
      message: "Resume re-analysed successfully",
      resume: updated,
    });
  } catch (error) {
    console.error("reanalyseResume error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/resume/upload-and-start
// Unified One-Shot: Upload -> Analysis -> Question Generation -> Start Session
// ─────────────────────────────────────────────────────────────────────────────
const uploadAndStartSession = async (req, res) => {
  const startTime = Date.now();

  try {
    const { jobRole = "Software Engineer", difficulty = "medium" } = req.body;

    console.log(
      `[Upload Controller] Start (Job: ${jobRole}, Diff: ${difficulty}, File: ${req.file?.originalname})`,
    );

    if (!req.file) {
      return res.status(400).json({ message: "No resume file uploaded" });
    }

    /* ---------------- Extract Resume Text ---------------- */

    console.log(`[Upload Controller] Extracting text...`);

    const rawText = await extractTextFromBuffer(req.file.buffer);

    console.log(`[Upload Controller] Text extracted (${rawText.length} chars)`);

    /* ---------------- Upload + AI in Parallel ---------------- */

    console.log(`[Upload Controller] Launching Parallel Storage & AI...`);

    const aiPromise = analyseAndGenerateQuestions(
      rawText,
      { buffer: req.file.buffer, mimeType: req.file.mimetype },
      jobRole,
      difficulty,
    ).catch((err) => {
      console.error("[Upload Controller] AI Promise Rejected:", err.message);
      return { analysis: {}, questions: [] }; // Return empty to trigger fallbacks
    });

    const [uploaded, oneShotResult] = await Promise.all([
      uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "/NextHireAI/resumes",
      ).catch((err) => {
        console.error(
          "[Upload Controller] Storage Promise Rejected:",
          err.message,
        );
        return { url: "pending" };
      }),
      aiPromise,
    ]);

    console.log(
      `[Upload Controller] Parallel tasks finished. Result Keys: ${Object.keys(oneShotResult || {})}`,
    );

    /* ---------------- Validate AI Output ---------------- */

    let questions = oneShotResult?.questions;

    if (!questions || questions.length === 0) {
      console.warn(
        "[Upload Controller] No questions from AI. Loading 5 standard fallback questions.",
      );

      questions = [
        {
          id: 1,
          question: "Tell me about your technical background and experience.",
          category: "Technical",
          difficulty: "easy",
          expectedKeyPoints: ["experience", "projects", "education"],
        },
        {
          id: 2,
          question: "Describe a project where you solved a difficult problem.",
          category: "Technical",
          difficulty: "medium",
          expectedKeyPoints: ["problem", "solution", "result"],
        },
        {
          id: 3,
          question:
            "What are your key strengths that make you a good fit for this role?",
          category: "HR",
          difficulty: "easy",
          expectedKeyPoints: ["skills", "culture fit"],
        },
        {
          id: 4,
          question:
            "How do you handle working in a high-pressure team environment?",
          category: "Behavioural",
          difficulty: "medium",
          expectedKeyPoints: ["teamwork", "stress management"],
        },
        {
          id: 5,
          question: "What are your long-term career aspirations?",
          category: "HR",
          difficulty: "easy",
          expectedKeyPoints: ["growth", "goals"],
        },
      ];
    }

    /* ---------------- Save Resume ---------------- */
    console.log(`[Upload Controller] Saving resume metadata to DB...`);

    const resume = await resumeModel.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        fileUrl: uploaded.url,
        fileName: req.file.originalname,
        rawText,
        analysedAt: new Date(),
        ...(oneShotResult.analysis || {}),
      },
      { upsert: true, new: true },
    );

    /* ---------------- Create Interview Session ---------------- */

    console.log(`[Upload Controller] Initializing interview session...`);

    const session = await interviewSessionModel.create({
      userId: req.user.id,
      resumeId: resume._id,
      jobRole,
      difficulty,
      questions,
    });

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(
      `[Upload Controller] SUCCESS! Session ID: ${session._id} (Time: ${totalTime}s)`,
    );

    return res.status(200).json({
      message: "Processing complete.",
      resume,
      sessionId: session._id,
      questionsCount: questions.length,
    });
  } catch (error) {
    console.error("[Upload Controller] FATAL ERROR:", error);

    return res.status(500).json({
      message: "Server error during analysis.",
      error: error.message,
    });
  }
};

module.exports = {
  uploadResume,
  getMyResume,
  deleteMyResume,
  reanalyseResume,
  uploadAndStartSession,
};
