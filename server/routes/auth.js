const router = require('express').Router();
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { h, bad, signToken, safeUser } = require('../utils/helpers');

const LABEL = { customer: 'Customer', owner: 'Rental Owner', admin: 'Admin' };

// Customer signup. Owner signup lives in /api/owner/register. Admin has no signup.
router.post('/register', h(async (req, res) => {
  const { name, email, mobile, password, confirmPassword, role } = req.body;
  if (role && role !== 'customer') bad('Use the Rental Owner form to register as an owner');
  if (!password || password.length < 6) bad('Password must be at least 6 characters');
  if (password !== confirmPassword) bad('Passwords do not match');
  await User.create({ name, email, mobile, password, role: 'customer' });
  res.status(201).json({ message: 'Account created. You can login now.' });
}));

router.post('/login', h(async (req, res) => {
  const { email, password, role } = req.body;
  if (!LABEL[role]) bad('Select a valid login type');
  if (!email || !password) bad('Email and password are required');
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matches(password))) bad('Invalid email or password', 401);
  if (user.role !== role) bad(`This account is not a ${LABEL[role]} account. Choose the correct login type.`, 403);
  if (!user.isActive) bad('Your account is blocked. Contact support.', 403);
  if (user.role === 'owner') {
    if (user.ownerApprovalStatus === 'pending') bad('Your registration is waiting for admin approval.', 403);
    if (user.ownerApprovalStatus === 'rejected') bad(`Registration rejected${user.ownerRejectionReason ? ': ' + user.ownerRejectionReason : ''}`, 403);
  }
  res.json({ token: signToken(user), user: safeUser(user) });
}));

router.get('/me', protect, (req, res) => res.json({ user: safeUser(req.user) }));

router.patch('/me', protect, h(async (req, res) => {
  const { name, mobile } = req.body;
  if (name) req.user.name = name;
  if (mobile) req.user.mobile = mobile;
  await req.user.save();
  res.json({ user: safeUser(req.user) });
}));

// Customer may explicitly save a location (live location is never stored automatically)
router.post('/me/locations', protect, h(async (req, res) => {
  const { label, latitude, longitude } = req.body;
  const lat = Number(latitude), lng = Number(longitude);
  if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) bad('Label and valid coordinates are required');
  req.user.savedLocations.push({ label, location: { type: 'Point', coordinates: [lng, lat] } });
  await req.user.save();
  res.status(201).json({ user: safeUser(req.user) });
}));

router.delete('/me/locations/:id', protect, h(async (req, res) => {
  req.user.savedLocations.pull(req.params.id);
  await req.user.save();
  res.json({ user: safeUser(req.user) });
}));

// Password reset: token is hashed in DB. In dev the link is printed to the server console (no email service).
router.post('/forgot-password', h(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() });
  if (user && user.role !== 'admin') {
    const raw = crypto.randomBytes(24).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(raw).digest('hex');
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
    await user.save();
    console.log(`[DEV] Password reset link: ${process.env.CLIENT_URL}/forgot-password?token=${raw}`);
  }
  res.json({ message: 'If this email is registered, a reset link has been generated.' });
}));

router.post('/reset-password', h(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 6) bad('Valid token and password (min 6 chars) required');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hash, passwordResetExpires: { $gt: Date.now() } }).select('+passwordResetToken +passwordResetExpires');
  if (!user) bad('Reset link is invalid or expired');
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ message: 'Password updated. You can login now.' });
}));

// Change login credentials. Needs the current password. Email change is admin-only
// (owners' rental email is stored separately).
router.patch('/credentials', protect, h(async (req, res) => {
  const { currentPassword, newPassword, email } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!currentPassword || !(await user.matches(currentPassword))) bad('Current password is incorrect', 401);
  if (!newPassword && !email) bad('Enter a new email or a new password');
  if (email && String(email).toLowerCase().trim() !== user.email) {
    if (user.role !== 'admin') bad('Email can only be changed by admin', 403);
    const e = String(email).toLowerCase().trim();
    if (!/^\S+@\S+\.\S+$/.test(e)) bad('Invalid email');
    if (await User.exists({ email: e })) bad('Email already in use', 409);
    user.email = e;
  }
  if (newPassword) {
    if (newPassword.length < 6) bad('New password must be at least 6 characters');
    user.password = newPassword;
  }
  await user.save();
  res.json({ user: safeUser(user), message: 'Saved. Use the new details next time you login.' });
}));

module.exports = router;
