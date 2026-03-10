const userModel = require("../models/user.model");
const interviewSessionModel = require("../models/interview.model");
const resumeModel = require("../models/resume.model");
const uploadFile = require("../service/storage.service");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile
// Return the current user's full profile + stats
// ─────────────────────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("getProfile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/profile
// Update name, phone, bio, targetRole
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, targetRole } = req.body;

    const allowedUpdates = {};
    if (name) allowedUpdates.name = name.trim();
    if (phone !== undefined) allowedUpdates.phone = phone.trim();
    if (bio !== undefined) allowedUpdates.bio = bio.trim();
    if (targetRole !== undefined) allowedUpdates.targetRole = targetRole.trim();

    const user = await userModel
      .findByIdAndUpdate(req.user.id, allowedUpdates, { new: true })
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/profile/avatar
// Upload a new avatar image
// ─────────────────────────────────────────────────────────────────────────────
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploaded = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "/NextHireAI/avatars",
    );

    const user = await userModel
      .findByIdAndUpdate(req.user.id, { avatar: uploaded.url }, { new: true })
      .select("-password");

    return res.status(200).json({
      message: "Avatar updated successfully",
      avatarUrl: uploaded.url,
      user,
    });
  } catch (error) {
    console.error("updateAvatar error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile/dashboard
// Return a summary dashboard: user, resume score, recent sessions, overall stats
// ─────────────────────────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const [user, resume, sessions] = await Promise.all([
      userModel.findById(req.user.id).select("-password"),
      resumeModel
        .findOne({ userId: req.user.id })
        .select("overallScore skills jobRoles analysedAt fileName"),
      interviewSessionModel
        .find({ userId: req.user.id })
        .select(
          "jobRole difficulty status report.overallScore completedAt durationSeconds",
        )
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user,
      resume: resume || null,
      recentSessions: sessions,
      stats: user.stats,
    });
  } catch (error) {
    console.error("getDashboard error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile/stats
// Detailed stats across all sessions
// ─────────────────────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const sessions = await interviewSessionModel
      .find({ userId: req.user.id, status: "completed" })
      .select(
        "jobRole difficulty report.overallScore completedAt durationSeconds",
      );

    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return res.status(200).json({
        totalSessions: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        byJobRole: {},
        byDifficulty: { easy: 0, medium: 0, hard: 0 },
        recentTrend: [],
      });
    }

    const scores = sessions.map((s) => s.report?.overallScore || 0);
    const averageScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / totalSessions,
    );
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);

    // Group by job role
    const byJobRole = {};
    sessions.forEach((s) => {
      if (!byJobRole[s.jobRole])
        byJobRole[s.jobRole] = { count: 0, totalScore: 0 };
      byJobRole[s.jobRole].count += 1;
      byJobRole[s.jobRole].totalScore += s.report?.overallScore || 0;
    });
    Object.keys(byJobRole).forEach((role) => {
      byJobRole[role].avgScore = Math.round(
        byJobRole[role].totalScore / byJobRole[role].count,
      );
    });

    // Group by difficulty
    const byDifficulty = { easy: 0, medium: 0, hard: 0 };
    sessions.forEach((s) => {
      byDifficulty[s.difficulty] = (byDifficulty[s.difficulty] || 0) + 1;
    });

    // Recent trend (last 10)
    const recentTrend = sessions.slice(-10).map((s) => ({
      date: s.completedAt,
      score: s.report?.overallScore || 0,
      jobRole: s.jobRole,
    }));

    return res.status(200).json({
      totalSessions,
      averageScore,
      bestScore,
      worstScore,
      byJobRole,
      byDifficulty,
      recentTrend,
    });
  } catch (error) {
    console.error("getStats error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  getDashboard,
  getStats,
};
