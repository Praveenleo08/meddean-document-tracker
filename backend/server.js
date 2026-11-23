/**
 * MedDean Document Tracker - Backend Server
 * Medical College Dean's Office Administrative Communication Tracking System
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const dashboardController = require("./controllers/dashboardController");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// System Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    application: "MedDean Document Tracker API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Departments route alias
app.get("/api/departments", (req, res) => dashboardController.getDepartments(req, res));

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[MedDean Server Error]", err.stack || err);
  
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File size exceeds 25MB limit. Please upload a smaller file."
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    error: err.message || "An unexpected server error occurred."
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` MedDean Document Tracker Backend API`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` System local time: ${new Date().toLocaleString()}`);
  console.log(`====================================================`);
});
