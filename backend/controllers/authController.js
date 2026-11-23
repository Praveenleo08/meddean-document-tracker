/**
 * Authentication & User Management Controller for MedDean Document Tracker.
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

  /**
   * Update Profile Name (Authenticated User)
   * Only alters display profile name, keeping account name and credentials untouched.
   */
  async updateProfile(req, res) {
    try {
      const { profileName } = req.body;
      if (!profileName || !profileName.trim()) {
        return res.status(400).json({
          success: false,
          error: "Profile name is required."
        });
      }

      const result = await authService.updateProfile(req.user.id, { profileName });
      return res.status(200).json({
        success: true,
        message: "Profile name updated successfully.",
        ...result
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || "Failed to update profile name."
      });
    }
  }

  /**
   * Get all user accounts (Exclusive to Dean Admin)
   */
  async getAllUsers(req, res) {
    try {
      const users = authService.getAllUsers();
      return res.status(200).json({
        success: true,
        users
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to retrieve user accounts."
      });
    }
  }

  /**
   * Update User Account (Exclusive to Dean Admin)
   * Dean can alter Account Name, Username, Password, Profile Name, and Description.
   */
  async updateUserByAdmin(req, res) {
    try {
      const { id } = req.params;
      const { accountName, username, profileName, password, title } = req.body;

      const updatedUser = await authService.updateUserByAdmin(id, {
        accountName,
        username,
        profileName,
        password,
        title
      });

      return res.status(200).json({
        success: true,
        message: "User account updated successfully by Dean Admin.",
        user: updatedUser
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || "Failed to update user account."
      });
    }
  }

  async getDemoUsers(req, res) {
    return res.status(200).json({
      success: true,
      users: authService.getDemoUsers()
    });
  }
}

module.exports = new AuthController();
