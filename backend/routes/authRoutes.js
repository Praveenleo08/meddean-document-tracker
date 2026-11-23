/**
 * Authentication Routes.
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/login", (req, res) => authController.login(req, res));
router.get("/me", authenticateToken, (req, res) => authController.getCurrentUser(req, res));
router.get("/demo-users", (req, res) => authController.getDemoUsers(req, res));

module.exports = router;
