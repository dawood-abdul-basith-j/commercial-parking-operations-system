
const db = require("../config/db");

function parsePaginationInteger(value, fallback, maximum) {
  if (value === undefined) return fallback;

  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value)
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number > maximum) {
    return null;
  }

  return number;
}

async function getAuditLogs(req, res) {
  // Audit logs contain security-sensitive information.
  // Only the explicitly designated super administrator may view them.
  if (
    String(req.user?.role || "").toUpperCase() !==
    "SUPER_ADMINISTRATOR"
  ) {
    return res.status(403).json({
      success: false,
      message: "Only a super administrator can access audit logs.",
    });
  }

  const page = parsePaginationInteger(req.query.page, 1, 1000000);
  const limit = parsePaginationInteger(req.query.limit, 20, 100);

  if (page === null || limit === null) {
    return res.status(400).json({
      success: false,
      message:
        "Page must be a positive integer and limit must be between 1 and 100.",
    });
  }

  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    return res.status(400).json({
      success: false,
      message: "Requested page is too large.",
    });
  }

  try {
    const [countRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM audit_logs"
    );

    const total = Number(countRows[0].total);

    const [rows] = await db.execute(
      `SELECT
         a.audit_id,
         a.user_id,
         u.full_name AS actor_name,
         u.email AS actor_email,
         a.module_name,
         a.action,
         a.ip_address,
         a.action_timestamp
       FROM audit_logs a
       JOIN users u ON u.user_id = a.user_id
       ORDER BY a.audit_id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Fetching audit logs failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch audit logs.",
    });
  }
}

module.exports = { getAuditLogs };
