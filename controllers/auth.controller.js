/**
 * auth.controller.js — Registration, login, and admin approval.
 *
 * KEY CONCEPTS:
 * - Passwords are NEVER stored as plain text. bcrypt hashes them one-way:
 *   you can check "does this password match?" but can never reverse the hash.
 * - JWT (JSON Web Token) is a signed token the server gives the client after
 *   login. The client sends it back on every request (Authorization header).
 *   The server verifies the signature to confirm the user is who they say
 *   they are — without needing a database lookup on every single request.
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  createUser,
  findUserByEmail,
  findUserById,
  getPendingUsers,
  updateUserStatus,
} = require("../db/auth.queries");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";
const JWT_EXPIRES_IN = "7d";

const generateToken = (user) => {
  // Payload contains only what's needed to identify the user — never the password
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * POST /api/auth/register
 * Student self-registration. Account starts as 'pending' until admin approves.
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await findUserByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // bcrypt.hash with salt rounds of 10 — standard balance of security vs speed
    const password_hash = await bcrypt.hash(password, 10);

    const user = await createUser({
      name,
      email: email.toLowerCase(),
      password_hash,
      role: 'student',
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Awaiting admin approval before you can log in.",
      user,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({ error: "Registration failed" });
  }
};

/**
 * POST /api/auth/login
 * Works for both admin and student accounts.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await findUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // bcrypt.compare hashes the input password and checks it against the stored hash
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: "Your account is awaiting admin approval" });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ error: "Your account registration was rejected" });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        person_id: user.person_id,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Login failed" });
  }
};

/**
 * GET /api/auth/me
 * Returns the currently logged-in user's profile.
 * Requires auth middleware to have already verified the token.
 */
const me = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

/**
 * GET /api/auth/pending
 * Admin only — list all accounts awaiting approval.
 */
const pending = async (req, res) => {
  try {
    const users = await getPendingUsers();
    return res.status(200).json({ count: users.length, users });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch pending users" });
  }
};

/**
 * POST /api/auth/approve/:id
 * Admin only — approve a pending student account.
 */
const approve = async (req, res) => {
  try {
    const user = await updateUserStatus(req.params.id, 'approved');
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: "Failed to approve user" });
  }
};

/**
 * POST /api/auth/reject/:id
 * Admin only — reject a pending student account.
 */
const reject = async (req, res) => {
  try {
    const user = await updateUserStatus(req.params.id, 'rejected');
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reject user" });
  }
};

module.exports = { register, login, me, pending, approve, reject, JWT_SECRET };