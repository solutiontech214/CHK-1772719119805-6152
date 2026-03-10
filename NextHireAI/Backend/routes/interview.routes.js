const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  startSession,
  submitAnswer,
  completeSession,
  getMySessions,
  getSession,
  deleteSession,
  getSessionReport,
} = require("../controller/interview.controller");

const interviewRouter = express.Router();

// All interview routes require authentication
interviewRouter.use(authMiddleware);

// POST   /api/interview/start                    - Start a new interview session
interviewRouter.post("/start", startSession);

// GET    /api/interview/sessions                 - List all sessions for current user
interviewRouter.get("/sessions", getMySessions);

// GET    /api/interview/:sessionId               - Get full session details
interviewRouter.get("/:sessionId", getSession);

// POST   /api/interview/:sessionId/answer        - Submit answer to a question
interviewRouter.post("/:sessionId/answer", submitAnswer);

// POST   /api/interview/:sessionId/complete      - Mark session as complete & generate report
interviewRouter.post("/:sessionId/complete", completeSession);

// GET    /api/interview/:sessionId/report        - Get only the final report
interviewRouter.get("/:sessionId/report", getSessionReport);

// DELETE /api/interview/:sessionId               - Delete a session
interviewRouter.delete("/:sessionId", deleteSession);

module.exports = interviewRouter;
