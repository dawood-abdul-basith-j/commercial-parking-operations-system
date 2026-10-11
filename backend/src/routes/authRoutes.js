
const express = require("express");

const {
  register,
  login,
  getMe,
} = require("../controllers/authController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  loginLimiter,
  registerLimiter,
} = require("../middleware/authRateLimit");

const router = express.Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);

router.get("/me", authenticateToken, getMe);

module.exports = router;
