/**
 * attendance.queries.js — All SQL for the attendance system.
 *
 * Why keep SQL here and not in the controller?
 * Separation of concerns. The controller handles HTTP logic.
 * This file handles data logic. If you switch from PostgreSQL to
 * MySQL later, you only change this file.
 *
 * We use parameterised queries ($1, $2) everywhere — never string
 * interpolation. This prevents SQL injection attacks.
 */

const pool = require("./pool");

/**
 * Create the attendance_logs table if it doesn't exist.
 * Call this once on server startup.
 */
const createTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS attendance_logs (
      id          SERIAL PRIMARY KEY,
      person_id   VARCHAR(100) NOT NULL,
      name        VARCHAR(100) NOT NULL,
      confidence  FLOAT,
      distance    FLOAT,
      logged_at   TIMESTAMPTZ DEFAULT NOW(),
      session_id  VARCHAR(100),
      status      VARCHAR(20) DEFAULT 'present'
    );
  `;
  await pool.query(sql);
  console.log("attendance_logs table ready");
};


const logAttendance = async ({ person_id, name, confidence, distance, session_id }) => {
  const sql = `
    INSERT INTO attendance_logs (person_id, name, confidence, distance, session_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const result = await pool.query(sql, [person_id, name, confidence, distance, session_id || null]);
  return result.rows[0];
};


/**
 * Fetch attendance records.
 * Optionally filter by date range or session_id.
 *
 * Example: getRecords({ from: "2025-01-01", to: "2025-01-31" })
 */
const getRecords = async ({ from, to, session_id } = {}) => {
  let sql = `SELECT * FROM attendance_logs WHERE 1=1`;
  const values = [];

  if (from) { values.push(from); sql += ` AND logged_at >= $${values.length}`; }
  if (to)   { values.push(to);   sql += ` AND logged_at <= $${values.length}`; }
  if (session_id) { values.push(session_id); sql += ` AND session_id = $${values.length}`; }

  sql += ` ORDER BY logged_at DESC`;
  const result = await pool.query(sql, values);
  return result.rows;
};

module.exports = { createTable, logAttendance, getRecords };