require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('Missing MONGODB_URI or JWT_SECRET in .env');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    await require('./models/Rental').init(); // make sure 2dsphere index exists
    // vehicles no longer need approval: anything still waiting goes live (admin can remove later)
    const moved = await require('./models/Vehicle').updateMany({ approvalStatus: 'pending' }, { approvalStatus: 'approved' });
    if (moved.modifiedCount) console.log(`Auto-approved ${moved.modifiedCount} waiting vehicle(s)`);
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Rentoza API running on http://localhost:${PORT}`));
  })
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
