/**
 * Authentication Controller for MedDean Document Tracker.
 */

const authService = require("../services/authService");

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Username and password are required."
        });
      }

      const result = await authService.login(username, password);
      return res.status(200).json({
        success: true,
        message: "Login successful.",
        ...result
      });
    } catch (err) {
      return res.status(err.statusCode || 401).json({
        success: false,
        error: err.message || "Invalid credentials."
      });
    }
  }

  async getCurrentUser(req, res) {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  }

  async getDemoUsers(req, res) {
    return res.status(200).json({
      success: true,
      users: authService.getDemoUsers()
    });
  }
}

module.exports = new AuthController();
