
const mysql = require("mysql2/promise");
const path = require("path");

// Load the environment variables from backend/.env
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

// Require an explicit database name to avoid accidental connections
// to the wrong database.
if (!process.env.DB_NAME) {
  throw new Error(
    "DB_NAME is missing from backend/.env. Database connection aborted."
  );
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Check the database connection when the module loads.
pool.getConnection()
  .then((connection) => {
    console.log(`✅ Database connected: ${process.env.DB_NAME}`);
    connection.release();
  })
  .catch((error) => {
    console.error("❌ Database connection error:", error.message);
  });

module.exports = pool;
