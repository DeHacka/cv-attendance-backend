/**
 * attendance.routes.js — Route definitions, now role-protected.
 *
 * Admin only: enroll new faces
 * Admin + Student: recognize (scan)
 * Admin: view all records, Student: view only their own (handled in controller)
 */
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { enroll, recognize, records } = require("../controllers/attendance.controller");

router.post("/enroll", requireAuth, requireRole("admin"), upload.single("photo"), enroll);
router.post("/recognize", requireAuth, upload.single("photo"), recognize);
router.get("/records", requireAuth, records);

module.exports = router;