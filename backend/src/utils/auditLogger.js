
async function writeAuditLog(connection, {
  userId,
  moduleName,
  action,
  ipAddress,
}) {
  if (!Number.isSafeInteger(Number(userId)) || Number(userId) <= 0) {
    throw new Error("A valid audit actor user ID is required.");
  }

  if (
    typeof moduleName !== "string" ||
    !moduleName.trim() ||
    moduleName.length > 100
  ) {
    throw new Error("Invalid audit module name.");
  }

  if (
    typeof action !== "string" ||
    !action.trim() ||
    action.length > 100
  ) {
    throw new Error("Invalid audit action.");
  }

  const ip = typeof ipAddress === "string"
    ? ipAddress.slice(0, 45)
    : null;

  await connection.execute(
    `INSERT INTO audit_logs (
      user_id,
      module_name,
      action,
      ip_address
    ) VALUES (?, ?, ?, ?)`,
    [Number(userId), moduleName, action, ip]
  );
}

module.exports = { writeAuditLog };
