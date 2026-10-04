const jwt = require('jsonwebtoken');

const bad = (message, status = 400) => { const e = new Error(message); e.status = status; throw e; };
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CATEGORIES = ['scooty', 'bike', 'sport-heavy-bike', 'car', 'suv'];
const safeUser = (u) => ({
  id: u._id, name: u.name, email: u.email, mobile: u.mobile, role: u.role,
  isActive: u.isActive, ownerApprovalStatus: u.ownerApprovalStatus, savedLocations: u.savedLocations,
});
const validLoc = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

module.exports = { bad, h, signToken, esc, CATEGORIES, safeUser, validLoc };
