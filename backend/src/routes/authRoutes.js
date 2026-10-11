
const express = require("express");

const {
  register,
  login,
  googleLogin,
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
router.post("/google-login", loginLimiter, googleLogin);

router.get("/me", authenticateToken, getMe);

module.exports = router;
