const Booking = require('../models/Booking');

// Booking dates are stored as UTC midnight of the chosen day. A day ends at 00:00 India time = 18:30 UTC of that day.
const IST_DAY_END_MS = 18.5 * 3600 * 1000;
let lastRun = 0;

// No cron needed (free hosting sleeps): whenever bookings are read, stale ones are settled (at most once a minute).
//  - confirmed booking whose end date (IST) is over  -> completed
//  - pending booking whose start date (IST) is over  -> expired (owner never confirmed it)
async function settleBookings(force = false) {
  const now = Date.now();
  if (!force && now - lastRun < 60 * 1000) return;
  lastRun = now;
  const cut = new Date(now - IST_DAY_END_MS);
  await Booking.updateMany({ status: 'confirmed', endDate: { $lte: cut } }, { $set: { status: 'completed' } });
  await Booking.updateMany({ status: 'pending', startDate: { $lte: cut } }, { $set: { status: 'expired' } });
}

const settleMiddleware = async (req, res, next) => {
  try { await settleBookings(); } catch (e) { console.error('settleBookings failed:', e.message); }
  next();
};

module.exports = { settleBookings, settleMiddleware, IST_DAY_END_MS };
