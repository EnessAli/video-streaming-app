/* One-time script to create an admin user */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/env');

async function createAdmin() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'admin@videostream.com' });
  if (existing) {
    console.log('Admin user already exists, updating role...');
    existing.role = 'admin';
    await existing.save();
  } else {
    await User.create({
      username: 'admin',
      email: 'admin@videostream.com',
      password: 'Admin123!',
      role: 'admin'
    });
    console.log('Admin user created');
  }

  console.log('\n--- Admin Credentials ---');
  console.log('Email:    admin@videostream.com');
  console.log('Password: Admin123!');
  console.log('-------------------------\n');

  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
