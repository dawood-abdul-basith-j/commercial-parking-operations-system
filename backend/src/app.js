
require("dotenv").config();

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

module.exports = app;
