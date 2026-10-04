const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { h, bad } = require('../utils/helpers');

const protect = h(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) bad('Please login to continue', 401);
  let payload;
  try { payload = jwt.verify(header.slice(7), process.env.JWT_SECRET); } catch { bad('Session expired. Please login again', 401); }
  const user = await User.findById(payload.id);
  if (!user) bad('Account not found', 401);
  if (!user.isActive) bad('Your account is blocked', 403);
  if (user.role === 'owner' && user.ownerApprovalStatus !== 'approved') bad('Owner account is not approved', 403);
  req.user = user;
  next();
});

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Access denied' });

module.exports = { protect, requireRole };
