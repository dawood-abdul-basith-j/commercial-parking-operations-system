
const express = require("express");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

const {
  getAuditLogs,
} = require("../controllers/auditController");

const router = express.Router();

// Every audit-log request requires a valid JWT.
router.use(authenticateToken);

router.get("/", getAuditLogs);

module.exports = router;
