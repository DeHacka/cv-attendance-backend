/**
 * auth.routes.js — Authentication and user management routes.
 */
const express = require("express");
const router = express.Router();
const { register, login, me, pending, approve, reject } = require("../controllers/auth.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Authenticated routes
router.get("/me", requireAuth, me);

// Admin-only routes
router.get("/pending", requireAuth, requireRole("admin"), pending);
router.post("/approve/:id", requireAuth, requireRole("admin"), approve);
router.post("/reject/:id", requireAuth, requireRole("admin"), reject);

module.exports = router;