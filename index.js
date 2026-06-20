/**
 * index.js — Express app entry point.
 */
require("dotenv").config();
const express = require("express");
const morgan = require("morgan");

const { createTable } = require("./db/attendance.queries");
const { createUsersTable } = require("./db/auth.queries");
const attendanceRoutes = require("./routes/attendance.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);

const start = async () => {
  try {
    await createTable();
    await createUsersTable();
    app.listen(PORT, () => {
      console.log(`Attendance backend running on http://localhost:${PORT}`);
      console.log(`Python AI service expected at ${process.env.PYTHON_AI_URL}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();