/**
 * Dashboard Routes.
 */

const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Configurable departments list
router.get("/departments", (req, res) => dashboardController.getDepartments(req, res));

// Google Sheets connection status
router.get("/sheets-status", authenticateToken, (req, res) => dashboardController.getSheetsStatus(req, res));

// Role-aware dashboard metrics
router.get("/summary", authenticateToken, (req, res) => dashboardController.getSummary(req, res));

module.exports = router;
