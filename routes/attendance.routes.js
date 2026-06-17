/**
 * attendance.routes.js — Route definitions.
 *
 * Thin layer — just maps HTTP method + path → middleware + controller.
 * upload.single("photo") tells multer to expect one file under the
 * field name "photo" in the multipart form.
 */

const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const { enroll, recognize, records } = require("../controllers/attendance.controller");

// POST /api/attendance/enroll
router.post("/enroll", upload.single("photo"), enroll);

// POST /api/attendance/recognize
router.post("/recognize", upload.single("photo"), recognize);

// GET /api/attendance/records
router.get("/records", records);

module.exports = router;