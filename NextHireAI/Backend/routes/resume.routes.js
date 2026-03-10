const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/auth.middleware");
const {
  uploadResume,
  getMyResume,
  deleteMyResume,
  reanalyseResume,
  uploadAndStartSession,
} = require("../controller/resume.controller");

const resumeRouter = express.Router();

// ── Multer: PDF only, 10 MB max ──────────────────────────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF and standard image files (PNG, JPG) are allowed."),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Error-handling wrapper for multer
const handleUpload = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File too large. Maximum allowed size is 10 MB." });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// ── Routes ────────────────────────────────────────────────────────────────────
// POST   /api/resume/upload          - Upload & analyse resume
resumeRouter.post("/upload", authMiddleware, handleUpload, uploadResume);

// POST   /api/resume/upload-and-start - High-speed One-Shot upload & start interview
resumeRouter.post(
  "/upload-and-start",
  authMiddleware,
  handleUpload,
  uploadAndStartSession,
);

// GET    /api/resume/me              - Get current user's resume
resumeRouter.get("/me", authMiddleware, getMyResume);

// DELETE /api/resume/me              - Delete current user's resume
resumeRouter.delete("/me", authMiddleware, deleteMyResume);

// POST   /api/resume/reanalyse       - Re-run AI analysis on existing resume
resumeRouter.post("/reanalyse", authMiddleware, reanalyseResume);

module.exports = resumeRouter;
