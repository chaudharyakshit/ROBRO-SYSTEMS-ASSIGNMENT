'use strict';

/**
 * seed.js
 * Run once to bootstrap the database with a default Admin account.
 *
 *   node seed.js
 *
 * Safe to re-run — it checks for an existing record before inserting.
 */

require('dotenv').config();

const mongoose = require('mongoose');
const User     = require('./models/User');

const { ROLES } = require('./constants/roles');

const ADMIN_EMAIL    = 'admin@robro.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_NAME     = 'Super Admin';

const run = async () => {
  try {
    console.log('[SEED] Connecting to MongoDB…');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('[SEED] Connected.');

    // Check whether the admin account already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (existing) {
      console.log(`[SEED] Admin account already exists (${ADMIN_EMAIL}). Nothing to do.`);
      return;
    }

    // Create the admin — password is hashed via the pre-save hook
    const admin = await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role:     ROLES.ADMIN,
      isActive: true,
    });

    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║     Admin account created successfully   ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Name    : ${admin.name.padEnd(30)}║`);
    console.log(`║  Email   : ${admin.email.padEnd(30)}║`);
    console.log(`║  Role    : ${admin.role.padEnd(30)}║`);
    console.log(`║  Password: ${ADMIN_PASSWORD.padEnd(30)}║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log('[SEED] Please change the default password after first login.');
  } catch (err) {
    console.error('[SEED] Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('[SEED] Database connection closed.');
  }
};

run();
