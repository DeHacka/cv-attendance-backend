/**
 * attendance.routes.js — Route definitions.
 *
 * /enroll is now open to BOTH admin and student — the controller itself
 * decides what each role is allowed to enroll (admin: anyone, student:
 * only themselves). This is "logic-level" authorization rather than
 * "route-level" — necessary because the permission depends on the data
 * being submitted, not just who's asking.
 */
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const { requireAuth } = require("../middleware/auth.middleware");
const { enroll, recognize, records } = require("../controllers/attendance.controller");

router.post("/enroll", requireAuth, upload.single("photo"), enroll);
router.post("/recognize", requireAuth, upload.single("photo"), recognize);
router.get("/records", requireAuth, records);

module.exports = router;