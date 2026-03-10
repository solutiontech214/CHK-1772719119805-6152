const interviewSessionModel = require("../models/interview.model");
const resumeModel = require("../models/resume.model");

const userModel = require("../models/user.model");
const {
  generateInterviewQuestions,
  evaluateAnswer,
  generateInterviewReport,
  generateNextAdaptiveQuestion,
} = require("../service/ai.service");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/start
// Body: { jobRole, difficulty? }
// - Pull resume from DB
// - Generate AI questions
// - Create a new session
// ─────────────────────────────────────────────────────────────────────────────
const startSession = async (req, res) => {
  try {
    const { jobRole, difficulty = "medium", questionCount = 5 } = req.body;

    if (!jobRole) {
      return res.status(400).json({ message: "jobRole is required" });
    }

    // Fetch resume data
    const resume = await resumeModel.findOne({ userId: req.user.id });
    if (!resume) {
      return res.status(404).json({
        message:
          "Resume not found. Please upload your resume before starting an interview.",
      });
    }

    // Validate difficulty
    const validDifficulties = ["easy", "medium", "hard"];
    const chosenDifficulty = validDifficulties.includes(difficulty)
      ? difficulty
      : "medium";

    // Ensure at least 5 questions, max 10
    const count = Math.min(Math.max(parseInt(questionCount) || 5, 5), 10);

    // Generate questions via AI
    const questions = await generateInterviewQuestions(
      resume,
      jobRole,
      chosenDifficulty,
      count,
    );

    // Create session
    const session = await interviewSessionModel.create({
      userId: req.user.id,
      resumeId: resume._id,
      jobRole,
      difficulty: chosenDifficulty,
      questions,
      status: "in-progress",
    });

    return res.status(201).json({
      message: "Interview session started",
      sessionId: session._id,
      questions: session.questions,
      jobRole: session.jobRole,
      difficulty: session.difficulty,
    });
  } catch (error) {
    console.error("startSession error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/:sessionId/answer
// Body: { questionId, answer, timeTaken }
// - Evaluate the answer with AI
// - Store in session
// ─────────────────────────────────────────────────────────────────────────────
const submitAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, answer, timeTaken = 0 } = req.body;

    if (questionId === undefined || !answer) {
      return res
        .status(400)
        .json({ message: "questionId and answer are required" });
    }

    const session = await interviewSessionModel.findOne({
      _id: sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "in-progress") {
      return res.status(400).json({ message: "Session is not in progress" });
    }

    // Find the question
    const question = session.questions.find(
      (q) => q.id === parseInt(questionId),
    );
    if (!question) {
      return res
        .status(404)
        .json({ message: "Question not found in this session" });
    }

    // Check if already answered
    const alreadyAnswered = session.answers.find(
      (a) => a.questionId === parseInt(questionId),
    );
    if (alreadyAnswered) {
      return res
        .status(400)
        .json({ message: "This question has already been answered" });
    }

    // Evaluate with AI
    const evaluation = await evaluateAnswer(
      question.question,
      answer,
      question.expectedKeyPoints,
    );

    // Push answer + evaluation
    session.answers.push({
      questionId: parseInt(questionId),
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      expectedKeyPoints: question.expectedKeyPoints,
      userAnswer: answer,
      timeTaken: parseInt(timeTaken) || 0,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      modelAnswer: evaluation.modelAnswer,
    });

    // --- DYNAMIC NEXT QUESTION GENERATION ---
    // Only generate if we haven't reached a certain limit (e.g., 10 questions)
    const MAX_QUESTIONS = 10;
    let nextQuestion = null;

    if (session.questions.length < MAX_QUESTIONS) {
      const resume = await resumeModel.findById(session.resumeId);
      nextQuestion = await generateNextAdaptiveQuestion(
        resume,
        session.jobRole,
        session.difficulty,
        session.answers, // History of Q&A
        session.questions.length + 1, // Next ID
      );

      if (nextQuestion) {
        session.questions.push(nextQuestion);
      }
    }

    await session.save();

    return res.status(200).json({
      message: "Answer submitted and evaluated",
      questionId: parseInt(questionId),
      evaluation,
      nextQuestion, // Frontend can use this or re-fetch session
    });
  } catch (error) {
    console.error("submitAnswer error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/:sessionId/complete
// Finalise session: generate report, update user stats
// ─────────────────────────────────────────────────────────────────────────────
const completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await interviewSessionModel.findOne({
      _id: sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Default report if no answers given
    let report = {
      overallScore: 0,
      summary: "No answers were submitted during this session.",
      strengths: [],
      improvements: [
        "Please try to answer questions to get a proper evaluation.",
      ],
      categoryScores: [],
    };

    if (session.answers && session.answers.length > 0) {
      report = await generateInterviewReport(
        session.questions,
        session.answers,
        session.answers.map((a) => ({
          score: a.score,
          feedback: a.feedback,
          strengths: a.strengths,
          improvements: a.improvements,
        })),
        session.jobRole,
      );
    }

    session.status = "completed";
    session.report = report;

    await session.save();

    return res.status(200).json({
      message: "Interview completed",
      report,
    });
  } catch (error) {
    console.error("completeSession error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/interview/sessions
// Get all sessions for the logged-in user
// ─────────────────────────────────────────────────────────────────────────────
const getMySessions = async (req, res) => {
  try {
    const sessions = await interviewSessionModel
      .find({ userId: req.user.id })
      .select("-questions -answers") // exclude heavy arrays in list view
      .sort({ createdAt: -1 });

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error("getMySessions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/interview/:sessionId
// Get full session details (including Q&A and report)
// ─────────────────────────────────────────────────────────────────────────────
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await interviewSessionModel.findOne({
      _id: sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.status(200).json({ session });
  } catch (error) {
    console.error("getSession error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/interview/:sessionId
// Delete a session
// ─────────────────────────────────────────────────────────────────────────────
const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    await interviewSessionModel.findOneAndDelete({
      _id: sessionId,
      userId: req.user.id,
    });

    return res.status(200).json({ message: "Session deleted" });
  } catch (error) {
    console.error("deleteSession error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/interview/:sessionId/report
// Get only the final report of a completed session
// ─────────────────────────────────────────────────────────────────────────────
const getSessionReport = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await interviewSessionModel
      .findOne({ _id: sessionId, userId: req.user.id })
      .select("status report jobRole difficulty completedAt durationSeconds");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "completed") {
      return res.status(400).json({ message: "Session is not completed yet" });
    }

    return res.status(200).json({
      jobRole: session.jobRole,
      difficulty: session.difficulty,
      completedAt: session.completedAt,
      durationSeconds: session.durationSeconds,
      report: session.report,
    });
  } catch (error) {
    console.error("getSessionReport error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  startSession,
  submitAnswer,
  completeSession,
  getMySessions,
  getSession,
  deleteSession,
  getSessionReport,
};
