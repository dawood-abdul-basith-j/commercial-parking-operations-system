
require("dotenv").config();

const db = require("./config/db");
const express = require("express");
const cors = require("cors");

const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);


// Health-check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CPOS backend is running successfully!",
  });
});


app.get("/api/health/db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS databaseName");

    res.status(200).json({
      success: true,
      message: "Database connected successfully",
      database: rows[0].databaseName,
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});


app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body.",
    });
  }

  console.error("Unhandled request error:", err.message);

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});


module.exports = app;
