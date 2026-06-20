/**
 * attendance.controller.js — HTTP request handlers.
 */
const { enrollFace, recognizeFaces } = require("../services/vision.service");
const { logAttendance, getRecords } = require("../db/attendance.queries");

const enroll = async (req, res) => {
  try {
    const { name, person_id } = req.body;

    if (!name) return res.status(400).json({ error: "name is required" });
    if (!req.file) return res.status(400).json({ error: "photo is required" });

    const result = await enrollFace(
      req.file.buffer,
      req.file.mimetype,
      name,
      person_id
    );

    return res.status(200).json(result);
  } catch (err) {
    if (err.response?.data?.detail) {
      return res.status(400).json({ error: err.response.data.detail });
    }
    console.error("Enroll error:", err.message);
    return res.status(500).json({ error: "Enrollment failed" });
  }
};

const recognize = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "photo is required" });

    const session_id = req.body.session_id || null;
    const aiResponse = await recognizeFaces(req.file.buffer, req.file.mimetype);

    const loggedRecords = [];
    for (const face of aiResponse.results) {
      if (face.matched) {
        const record = await logAttendance({
          person_id: face.person_id,
          name: face.name,
          confidence: face.confidence,
          distance: face.distance,
          session_id,
        });
        loggedRecords.push(record);
      }
    }

    return res.status(200).json({
      faces_found: aiResponse.faces_found,
      results: aiResponse.results,
      logged: loggedRecords.length,
      records: loggedRecords,
    });
  } catch (err) {
    console.error("Recognize error:", err.message);
    return res.status(500).json({ error: "Recognition failed" });
  }
};

/**
 * GET /api/attendance/records
 * Admins see all records. Students see only records matching their linked person_id.
 * req.user is set by requireAuth middleware (decoded JWT payload).
 */
const records = async (req, res) => {
  try {
    const { from, to, session_id } = req.query;
    let rows = await getRecords({ from, to, session_id });

    if (req.user.role === 'student') {
      // Students only see their own attendance — filtered by their linked person_id
      const { findUserById } = require("../db/auth.queries");
      const user = await findUserById(req.user.id);
      rows = rows.filter(r => r.person_id === user.person_id);
    }

    return res.status(200).json({ count: rows.length, records: rows });
  } catch (err) {
    console.error("Records error:", err.message);
    return res.status(500).json({ error: "Failed to fetch records" });
  }
};

module.exports = { enroll, recognize, records };