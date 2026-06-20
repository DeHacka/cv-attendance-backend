/**
 * pool.js — PostgreSQL connection pool.
 *
 * SSL: Render's PostgreSQL requires SSL for external connections
 * (i.e. connecting from outside Render's network, like your local PC).
 * rejectUnauthorized: false skips certificate verification — fine for
 * this use case since Render's certs are self-signed internally.
 *
 * Internal connections (service-to-service within Render) work fine
 * without this, but having it on doesn't break anything either, so
 * we leave it on for both cases.
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("PostgreSQL connection error:", err.message);
  } else {
    console.log("PostgreSQL connected");
    release();
  }
});

module.exports = pool;