require("dotenv").config();
const app = require("./src/app");
const connectDb = require("./db/db");

// ── Routes ────────────────────────────────────────────────────────────────────
const authRouter = require("./routes/auth.routes");
const uploadRouter = require("./routes/upload.routes");
const resumeRouter = require("./routes/resume.routes");
const interviewRouter = require("./routes/interview.routes");
const profileRouter = require("./routes/profile.routes");
const aiRouter = require("./routes/ai.routes");
const documentRouter = require("./routes/document.routes");

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDb();

// ── Mount Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/profile", profileRouter);
app.use("/api/ai", aiRouter);
app.use("/api/documents", documentRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
