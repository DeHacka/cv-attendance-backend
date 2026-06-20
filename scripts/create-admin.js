/**
 * scripts/create-admin.js — One-time script to create your first admin account.
 *
 * Run with: node scripts/create-admin.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { createUsersTable, createUser, findUserByEmail } = require("../db/auth.queries");

const ADMIN_NAME = "Togbe Sako";
const ADMIN_EMAIL = "admin@attendance.com";
const ADMIN_PASSWORD = "ChangeThisPassword123";

const run = async () => {
  await createUsersTable();

  const existing = await findUserByEmail(ADMIN_EMAIL);
  if (existing) {
    console.log("Admin account already exists:", existing.email);
    process.exit(0);
  }

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await createUser({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password_hash,
    role: 'admin',
    status: 'approved',
  });

  console.log("Admin account created:");
  console.log(admin);
  console.log(`\nLogin with: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  process.exit(0);
};

run().catch(err => {
  console.error("Failed to create admin:", err.message);
  process.exit(1);
});