const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    
    credentials: true,
  }),
);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Cookie parser ─────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = app;
