/**
 * Authentication & User Profile Routes for MedDean Document Tracker.
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");

// Public authentication
router.post("/login", (req, res) => authController.login(req, res));
router.get("/demo-users", (req, res) => authController.getDemoUsers(req, res));

// Authenticated user self-management
router.get("/me", authenticateToken, (req, res) => authController.getCurrentUser(req, res));
router.put("/profile", authenticateToken, (req, res) => authController.updateProfile(req, res));

// Dean Admin Exclusive User Management
router.get("/users", authenticateToken, requireAdmin, (req, res) => authController.getAllUsers(req, res));
router.put("/users/:id", authenticateToken, requireAdmin, (req, res) => authController.updateUserByAdmin(req, res));

module.exports = router;
