/**
 * auth.middleware.js — Verifies JWT tokens and enforces role-based access.
 *
 * requireAuth: blocks the request unless a valid token is present.
 *              Attaches the decoded user info to req.user for later use.
 * requireRole: must be used AFTER requireAuth. Blocks unless req.user.role
 *              matches one of the allowed roles.
 */

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to perform this action" });
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };