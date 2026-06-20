/**
 * auth.queries.js — All SQL for users (admin + student accounts).
 */
const pool = require("./pool");

const createUsersTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      email         VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role          VARCHAR(20) NOT NULL DEFAULT 'student',
      status        VARCHAR(20) NOT NULL DEFAULT 'pending',
      person_id     VARCHAR(100),
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await pool.query(sql);
  console.log("users table ready");
};

const createUser = async ({ name, email, password_hash, role = 'student', status = 'pending' }) => {
  const sql = `
    INSERT INTO users (name, email, password_hash, role, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, role, status, created_at;
  `;
  const result = await pool.query(sql, [name, email, password_hash, role, status]);
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, email, role, status, person_id, created_at FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

const getPendingUsers = async () => {
  const result = await pool.query(
    `SELECT id, name, email, created_at FROM users WHERE status = 'pending' ORDER BY created_at ASC`
  );
  return result.rows;
};

const updateUserStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, email, role, status;`,
    [status, id]
  );
  return result.rows[0];
};

const linkPersonId = async (userId, personId) => {
  const result = await pool.query(
    `UPDATE users SET person_id = $1 WHERE id = $2 RETURNING id, name, email, person_id;`,
    [personId, userId]
  );
  return result.rows[0];
};

module.exports = {
  createUsersTable,
  createUser,
  findUserByEmail,
  findUserById,
  getPendingUsers,
  updateUserStatus,
  linkPersonId,
};