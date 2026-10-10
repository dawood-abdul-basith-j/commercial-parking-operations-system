
require("dotenv").config();

const db = require("./config/db");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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


module.exports = app;
