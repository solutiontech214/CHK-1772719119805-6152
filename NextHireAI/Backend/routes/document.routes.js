const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/auth.middleware");
const {
  uploadDocument,
  getMyDocuments,
  deleteDocument,
  viewDocument,
} = require("../controller/document.controller");

const documentRouter = express.Router();

// ── Multer: PDF or standard images, 10 MB max ──────────────────────────────────────────────
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

// All document routes require authentication
documentRouter.use(authMiddleware);

// ── Safe multer wrapper (required for Express v5 + multer v2) ──────────────────
const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
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

// POST   /api/documents/upload          - Upload a document
documentRouter.post("/upload", handleUpload, uploadDocument);

// GET    /api/documents                 - Get all documents for the user
documentRouter.get("/", getMyDocuments);

// GET    /api/documents/view/:id        - View/proxy a specific document for preview
documentRouter.get("/view/:id", viewDocument);

// DELETE /api/documents/:id             - Delete a specific document
documentRouter.delete("/:id", deleteDocument);

module.exports = documentRouter;
