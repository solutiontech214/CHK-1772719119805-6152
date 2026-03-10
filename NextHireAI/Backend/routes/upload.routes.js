const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  uploadCertificate,
  uploadMarksheet,
  uploadDocs,
} = require("../controller/upload.controller");
const multer = require("multer");

const uploadRouter = express.Router();

const storage = multer.memoryStorage();

// File filter: allow only PDF and common image formats
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF and image files (JPEG, PNG, GIF, WEBP, SVG) are allowed.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size
  },
});

// Error-handling wrapper for multer errors
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

uploadRouter.post(
  "/uploadCertificate",
  handleUpload,
  authMiddleware,
  uploadCertificate,
);
uploadRouter.post(
  "/uploadMarksheets",
  handleUpload,
  authMiddleware,
  uploadMarksheet,
);
uploadRouter.post("/uploadDocs", handleUpload, authMiddleware, uploadDocs);

module.exports = uploadRouter;
