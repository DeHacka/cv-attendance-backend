/**
 * attendance.controller.js — HTTP request handlers.
 *
 * Enroll behavior depends on role (req.user.role, set by requireAuth):
 *   - Student: can ONLY enroll their own face. name/person_id are taken
 *     from their account, not from the request body — this prevents a
 *     student from enrolling someone else's face under their own account.
 *   - Admin: can enroll anyone, with full control over name/person_id
 *     (e.g. for bulk setup, or enrolling someone without app access).
 */
const { enrollFace, recognizeFaces } = require("../services/vision.service");
const { logAttendance, getRecords } = require("../db/attendance.queries");
const { linkPersonId, findUserById } = require("../db/auth.queries");

const enroll = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "photo is required" });

    let name, person_id;

    if (req.user.role === 'student') {
      // Student self-enrollment — always uses their own identity.
      // person_id is their stable user id, prefixed so it's unambiguous
      // when viewed alongside any admin-created person_ids.
      const user = await findUserById(req.user.id);
      name = user.name;
      person_id = user.person_id || `user_${user.id}`;
    } else {
      // Admin enrollment — uses whatever name/person_id was submitted.
      name = req.body.name;
      person_id = req.body.person_id;
      if (!name) return res.status(400).json({ error: "name is required" });
    }

    const result = await enrollFace(req.file.buffer, req.file.mimetype, name, person_id);

    // Save the link between this user account and their AI person_id,
    // so future recognitions can be matched back to their account.
    if (req.user.role === 'student') {
      await linkPersonId(req.user.id, result.person_id);
    }

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

const records = async (req, res) => {
  try {
    const { from, to, session_id } = req.query;
    let rows = await getRecords({ from, to, session_id });

    if (req.user.role === 'student') {
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