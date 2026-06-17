/**
 * index.js — Express app entry point.
 *
 * Startup sequence:
 *   1. Load env vars
 *   2. Connect to PostgreSQL (pool.js does this on require)
 *   3. Create DB tables if they don't exist
 *   4. Mount routes
 *   5. Start listening
 */
require("dotenv").config();
const express = require("express");
const morgan = require("morgan");

const { createTable } = require("./db/attendance.queries");
const attendanceRoutes = require("./routes/attendance.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// HTTP request logger - logs method, path, status, response time
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount attendance routes 
app.use("/api/attendance", attendanceRoutes);

// Start the server - create DB tables first
const start = async () => {
    try {
        await createTable();
        app.listen(PORT, () => {
            console.log(`Attendance backend running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server: ", err.message);
        process.exit(1);
    }
};

start();