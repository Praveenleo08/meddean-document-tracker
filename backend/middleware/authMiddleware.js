/**
 * Authentication and Role-based Authorization Middleware.
 * Strictly verifies Firebase ID tokens (and custom claims) and enforces department-level isolation on the server.
 */

const authService = require("../services/authService");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication token missing. Please sign in."
    });
  }

  try {
    const decoded = await authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: "Session expired or invalid token. Please log in again."
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Access denied. Administrator privileges required."
    });
  }
  next();
}

function authorizeDepartmentAccess(req, res, next) {
  // Admins can access all departments
  if (req.user && req.user.role === "admin") {
    return next();
  }

  // Section / Department users can only access their authenticated department
  if (req.user && (req.user.role === "section" || req.user.role === "department")) {
    const targetDept = req.params.department || req.query.department || (req.body && req.body.department);
    if (targetDept && targetDept.toLowerCase() !== req.user.department.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: `Access denied. You only have permission to access records for the ${req.user.department} department.`
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    error: "Unauthorized access."
  });
}

module.exports = {
  authenticateToken,
  requireAdmin,
  authorizeDepartmentAccess
};
