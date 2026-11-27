require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User     = require('../models/User');
const validateEnv = require('../config/env');

const seed = async () => {
  const config = validateEnv();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim();

  if (!config.MONGO_URI || !email || !password || !name) {
    throw new Error('MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME must be configured.');
  }
  if (password.length < 16 || /replace|change|example|your_password/i.test(password) || /@example\.(com|org|net)$/i.test(email)) {
    throw new Error('Replace example admin credentials with a unique password of at least 16 characters.');
  }

  await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const existing = await User.findOne({ email });
  if (existing && existing.role !== 'admin') {
    throw new Error('ADMIN_EMAIL is already assigned to a non-admin account.');
  }
  const admin = existing || new User({ role: 'admin' });
  admin.name = name;
  admin.email = email;
  admin.password = password;
  admin.isActive = true;

  await admin.save();

  console.log('Admin account created or updated.');
};

seed().catch(error => {
  console.error('Seed failed.', {
    name: error.name || 'Error',
    code: error.code || undefined,
  });
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect().catch(error => {
    console.error(`Database cleanup failed (${error.name || 'Error'}).`);
    process.exitCode = 1;
  });
});
