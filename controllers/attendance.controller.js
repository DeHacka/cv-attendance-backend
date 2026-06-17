/**
 * attendance.controller.js — HTTP request handlers.
 *
 * The controller's only job:
 *   1. Validate the incoming request
 *   2. Call the right service/query
 *   3. Return a clean response
 *
 * It never does AI work (that's vision.service.js) and never
 * writes raw SQL (that's attendance.queries.js).
 */

const { enrollFace, recognizeFaces } = require("../services/vision.service");
const { logAttendance, getRecords } = require("../db/attendance.queries");

/**
 * POST /api/attendance/enroll
 * Registers a person's face in the AI system.
 *
 * Body (multipart/form-data):
 *   - photo: image file
 *   - name: string
 *   - person_id: string (optional)
 */
const enroll = async (req, res) => {
    try {
        const { name, person_id } = req.body;

        if (!name) {
            return res.status(400).json({ error: "name is required" });
        }
        if (!req.file) {
            return res.status(400).json({ error: "photo is required" });
        }

        // Forward to Python AI service
        const result = await enrollFace(
            req.file.buffer,
            req.file.mimetype,
            name,
            person_id
        );

        return res.status(200).json({ result })
    } catch (err) {
        // If Python returned a 400 (no face detected, multiple faces), forward that message
        if (err.response?.data?.detail) {
            return res.status(400).json({ error: err.response.data.detail });
        }
        console.error("Enroll error:", err.message);
        return res.status(500).json({ error: "Enrollment failed" });
    }
};


/**
 * POST /api/attendance/recognize
 * Identifies faces in a photo and logs matches to the database.
 *
 * Body (multipart/form-data):
 *   - photo: image file
 *   - session_id: string (optional — groups records into one session/class)
 */
const recognize = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "photo is required" });
        }

        const session_id = req.body.session_id || null;

        // Send photo to Python AI service
        const aiResponse = await recognizeFaces(req.file.buffer, req.file.mimetype);

        // Log every matched face to PostgreSQL
        // Unmatched faces (unknown people) are returned but not logged
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
            results: aiResponse.results, // full AI response (matched + unmatched)
            logged: loggedRecords.length, // how many were saved to DB
            records: loggedRecords, // the saved DB rows
        });
    } catch (err) {
        console.error("Recognize error:", err.message);
        return res.status(500).json({ error: "Recognition failed" });
    }
};

/**
 * GET /api/attendance/records
 * Fetch attendance history from PostgreSQL.
 *
 * Query params (all optional):
 *   - from: ISO date string e.g. 2025-01-01
 *   - to:   ISO date string e.g. 2025-01-31
 *   - session_id: string
 */
const records = async (req, res) => {
    try {
        const { from, to, session_id } = req.query;
        const rows = await getRecords({ from, to, session_id });
        return res.status(200).json({ count: rows.length, records: rows });
    } catch (err) {
        return res.status(500).json({ error: "Failed to fetch records" });
    }
};

module.exports = { enroll, recognize, records };