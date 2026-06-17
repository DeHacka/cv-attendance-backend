/**
 * pool.js — PostgreSQL connection pool.
 *
 * Why a pool and not a single connection?
 * Each HTTP request needs a DB connection. A pool keeps N connections
 * open and reuses them across requests instead of opening/closing one
 * per request (which is slow). pg.Pool handles this automatically.
 *
 * We read config from .env so credentials never live in code.
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Test the connection on startup so you know immediately if DB is misconfigured
pool.connect((err, client, release) => {
    if (err) {
        console.error("PostgreSQL connection error:", err.message);
    } else {
        console.log("PostgreSQL connected");
        release();
    }
});

module.exports = pool;