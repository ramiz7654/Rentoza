// Creates the admin from .env. If an admin already exists, its email and password are RESET to the .env values.
// (No public admin signup exists. To change admin details you can also use Admin > Account in the app.)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  if (ADMIN_PASSWORD.length < 6) throw new Error('ADMIN_PASSWORD must be at least 6 characters');
  await mongoose.connect(MONGODB_URI);
  const admin = await User.findOne({ role: 'admin' });
  if (admin) {
    admin.email = ADMIN_EMAIL;
    admin.password = ADMIN_PASSWORD;
    admin.isActive = true;
    await admin.save();
    console.log('Admin updated from .env:', admin.email);
  } else {
    await User.create({ name: 'Rentoza Admin', email: ADMIN_EMAIL, mobile: '9999999999', password: ADMIN_PASSWORD, role: 'admin' });
    console.log('Admin created:', ADMIN_EMAIL);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
