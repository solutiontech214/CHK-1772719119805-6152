const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Support both Bearer token (Authorization header) and cookie
    let token = req.cookies?.token;

    const authHeader = req.headers["authorization"];
    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // ✅ this sets req.user

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;
