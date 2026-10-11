
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return process.env.JWT_SECRET;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function register(req, res) {
  const body = req.body || {};

  const {
    full_name,
    email,
    password,
    address,
    driving_license_number,
  } = body;

  if (
    !isNonEmptyString(full_name) ||
    !isNonEmptyString(email) ||
    typeof password !== "string" ||
    !isNonEmptyString(address) ||
    !isNonEmptyString(driving_license_number)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Full name, email, password, address and driving license number are required.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  if (
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters and no more than 72 bytes.",
    });
  }

  let connection;
  let transactionStarted = false;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [roles] = await connection.execute(
      "SELECT role_id FROM roles WHERE role_name = ? LIMIT 1",
      ["CUSTOMER"]
    );

    if (roles.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(500).json({
        success: false,
        message: "Customer role is not configured.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [userResult] = await connection.execute(
      `INSERT INTO users (
        role_id,
        full_name,
        email,
        password_hash,
        account_status
      ) VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [
        roles[0].role_id,
        full_name.trim(),
        normalizedEmail,
        passwordHash,
      ]
    );

    await connection.execute(
      `INSERT INTO customers (
        user_id,
        address,
        driving_license_number,
        loyalty_points
      ) VALUES (?, ?, ?, 0)`,
      [
        userResult.insertId,
        address.trim(),
        driving_license_number.trim(),
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully.",
      user: {
        user_id: userResult.insertId,
        full_name: full_name.trim(),
        email: normalizedEmail,
        role: "CUSTOMER",
      },
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Registration rollback failed.");
      }
    }

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An account or unique customer detail already exists.",
      });
    }

    console.error("Registration failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register customer.",
    });
  } finally {
    if (connection) connection.release();
  }
}

async function login(req, res) {
  const body = req.body || {};
  const { email, password } = body;

  if (
    !isNonEmptyString(email) ||
    typeof password !== "string" ||
    password.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");

    return res.status(500).json({
      success: false,
      message: "Authentication service is not configured.",
    });
  }

  try {
    const [users] = await db.execute(
      `SELECT
         u.user_id,
         u.full_name,
         u.email,
         u.password_hash,
         u.account_status,
         r.role_name
       FROM users u
       JOIN roles r ON r.role_id = u.role_id
       WHERE u.email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = users[0];

    if (user.account_status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "This account is not active.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { role: user.role_name },
      getJwtSecret(),
      {
        subject: String(user.user_id),
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        algorithm: "HS256",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role_name,
      },
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
}

function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  getMe,
};
