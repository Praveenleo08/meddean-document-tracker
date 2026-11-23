/**
 * Authentication Service for MedDean Document Tracker.
 * Manages institutional demo users, bcrypt hashing, and JWT tokens.
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "meddean-jwt-super-secret-key-2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Initial demo users with pre-hashed or plain passwords configured per requirements
// Demo Passwords:
// admin: Admin@123
// pharmacy: Pharmacy@123
// administration: AdminDept@123
// finance: Finance@123
// hr: HR@123
// nursing: Nursing@123
const USERS_DATABASE = [
  {
    id: "usr-001",
    username: "admin",
    passwordHash: bcrypt.hashSync("Admin@123", 10),
    role: "admin",
    department: "Dean's Office",
    name: "Dean Office Administrator",
    title: "Executive Administrative Officer"
  },
  {
    id: "usr-002",
    username: "pharmacy",
    passwordHash: bcrypt.hashSync("Pharmacy@123", 10),
    role: "department",
    department: "Pharmacy",
    name: "Pharmacy Department In-Charge",
    title: "Chief Pharmacist"
  },
  {
    id: "usr-003",
    username: "administration",
    passwordHash: bcrypt.hashSync("AdminDept@123", 10),
    role: "department",
    department: "Administration",
    name: "General Administration Section",
    title: "Administrative Officer"
  },
  {
    id: "usr-004",
    username: "finance",
    passwordHash: bcrypt.hashSync("Finance@123", 10),
    role: "department",
    department: "Finance",
    name: "Finance & Accounts Branch",
    title: "Accounts Officer"
  },
  {
    id: "usr-005",
    username: "hr",
    passwordHash: bcrypt.hashSync("HR@123", 10),
    role: "department",
    department: "Human Resources",
    name: "HR & Establishment Wing",
    title: "HR Superintendent"
  },
  {
    id: "usr-006",
    username: "nursing",
    passwordHash: bcrypt.hashSync("Nursing@123", 10),
    role: "department",
    department: "Nursing",
    name: "Nursing Administration",
    title: "Nursing Superintendent"
  }
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
    const user = USERS_DATABASE.find(u => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      const err = new Error("Invalid username or password.");
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
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
      title: user.title
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
   * Get all registered demo users metadata (excluding password hashes)
   */
  getDemoUsers() {
    return USERS_DATABASE.map(({ passwordHash, ...rest }) => rest);
  }
}

module.exports = new AuthService();
