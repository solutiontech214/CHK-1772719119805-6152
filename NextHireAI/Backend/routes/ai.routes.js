const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { transcribeAudio, generateSpeech } = require("../service/ai.service");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();
const upload = multer({ dest: "uploads/audio/" });

// STT: Audio -> Text
router.post(
  "/stt",
  authMiddleware,
  upload.single("audio"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No audio file provided" });

      const text = await transcribeAudio(req.file.path);

      // Clean up
      fs.unlinkSync(req.file.path);

      res.json({ text });
    } catch (error) {
      console.error("STT Route Error:", error);
      res.status(500).json({ message: "STT failed", error: error.message });
    }
  },
);

// TTS: Text -> Audio
router.post("/tts", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "No text provided" });

    const fileName = `tts-${Date.now()}.wav`;
    const outputPath = path.join(__dirname, "../uploads/audio", fileName);

    // Ensure directory exists
    if (!fs.existsSync(path.join(__dirname, "../uploads/audio"))) {
      fs.mkdirSync(path.join(__dirname, "../uploads/audio"), {
        recursive: true,
      });
    }

    await generateSpeech(text, outputPath);

    res.sendFile(outputPath, () => {
      // Clean up after sending
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error("TTS Route Error:", error);
    res.status(500).json({ message: "TTS failed", error: error.message });
  }
});

module.exports = router;
