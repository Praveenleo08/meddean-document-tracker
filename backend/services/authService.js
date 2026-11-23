/**
 * Authentication Service for MedDean Document Tracker.
 * Manages institutional accounts for Dean Admin and all 49 College & Hospital Sections.
 * Enforces secure JWT token issuance and flexible institutional default authentication.
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ALL_SECTIONS } = require("../config/departments");

const JWT_SECRET = process.env.JWT_SECRET || "meddean-jwt-super-secret-key-2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Standard default institutional password
const DEFAULT_DEPT_PASSWORD = "Dean@123";
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync(DEFAULT_DEPT_PASSWORD, 10);
const ADMIN_PASSWORD_HASH = bcrypt.hashSync("Admin@123", 10);

// Institutional User Accounts Database
// 1. Dean Administrator
// 2. All 49 College & Hospital Sections
const USERS_DATABASE = [
  {
    id: "usr-admin",
    username: "admin",
    passwordHash: ADMIN_PASSWORD_HASH,
    role: "admin",
    department: "Dean's Office",
    name: "Dean Office Administrator",
    title: "Executive Administrative Officer",
    category: "Dean"
  },
  ...ALL_SECTIONS.map((sec, idx) => ({
    id: `usr-sec-${String(idx + 1).padStart(3, "0")}`,
    username: sec.username,
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: "department",
    department: sec.name,
    name: sec.name,
    title: sec.description,
    category: sec.category,
    code: sec.code
  }))
];

class AuthService {
  /**
   * Authenticate user with username and password
   */
  async login(username, password) {
    if (!username || !password) {
      throw new Error("Username and password are required.");
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = USERS_DATABASE.find((u) => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      const err = new Error("Invalid username or password.");
      err.statusCode = 401;
      throw err;
    }

    // Support standard default passwords:
    // - "Dean@123"
    // - "MedDean@123"
    // - `${username}@123`
    // - "Admin@123" (for admin)
    // - Exact bcrypt match against passwordHash
    let isMatch = false;
    const trimmedPw = password.trim();

    if (
      trimmedPw === DEFAULT_DEPT_PASSWORD ||
      trimmedPw === "MedDean@123" ||
      trimmedPw === `${cleanUsername}@123` ||
      (user.username === "admin" && trimmedPw === "Admin@123")
    ) {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(trimmedPw, user.passwordHash);
    }

    if (!isMatch) {
      const err = new Error("Invalid username or password.");
      err.statusCode = 401;
      throw err;
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      department: user.department,
      name: user.name,
      title: user.title,
      category: user.category,
      code: user.code || null
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
      token,
      user: payload
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  /**
   * Get all registered accounts metadata (excluding password hashes)
   */
  getDemoUsers() {
    return USERS_DATABASE.map(({ passwordHash, ...rest }) => rest);
  }
}

module.exports = new AuthService();
