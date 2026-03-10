const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/auth.middleware");
const {
  getProfile,
  updateProfile,
  updateAvatar,
  getDashboard,
  getStats,
} = require("../controller/profile.controller");

const profileRouter = express.Router();

// ── Multer: avatar image upload ───────────────────────────────────────────────
const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files (JPEG, PNG, WEBP, GIF) are allowed."),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const handleAvatarUpload = (req, res, next) => {
  upload.single("avatar")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File too large. Maximum allowed size is 5 MB." });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// All profile routes require authentication
profileRouter.use(authMiddleware);

// GET    /api/profile               - Get current user's full profile
profileRouter.get("/", getProfile);

// PUT    /api/profile               - Update profile fields (name, phone, bio, targetRole)
profileRouter.put("/", updateProfile);

// POST   /api/profile/avatar        - Upload new avatar image
profileRouter.post("/avatar", handleAvatarUpload, updateAvatar);

// GET    /api/profile/dashboard     - Get dashboard summary (user + resume + recent sessions)
profileRouter.get("/dashboard", getDashboard);

// GET    /api/profile/stats         - Get detailed interview statistics
profileRouter.get("/stats", getStats);

module.exports = profileRouter;
