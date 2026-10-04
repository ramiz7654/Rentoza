const router = require('express').Router();
const User = require('../models/User');
const Rental = require('../models/Rental');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const SupportTicket = require('../models/SupportTicket');
const { protect, requireRole } = require('../middleware/auth');
const { h, bad, esc } = require('../utils/helpers');

router.use(protect, requireRole('admin'));
const REVIEWABLE = ['approved', 'rejected'];

router.get('/dashboard', h(async (req, res) => {
  const c = (M, f = {}) => M.countDocuments(f);
  const [totalUsers, customers, owners, totalRentals, approvedRentals, pendingRentals, totalVehicles, approvedVehicles, availableVehicles,
    pendingVehicles, totalBookings, activeBookings, pendingBookings, completedBookings, totalReviews, openTickets, pendingOwners] = await Promise.all([
    c(User, { role: { $ne: 'admin' } }), c(User, { role: 'customer' }), c(User, { role: 'owner' }),
    c(Rental), c(Rental, { status: 'approved' }), c(Rental, { status: 'pending' }),
    c(Vehicle), c(Vehicle, { approvalStatus: 'approved' }), c(Vehicle, { approvalStatus: 'approved', available: true }), c(Vehicle, { approvalStatus: 'pending' }),
    c(Booking), c(Booking, { status: 'confirmed' }), c(Booking, { status: 'pending' }), c(Booking, { status: 'completed' }),
    c(Review), c(SupportTicket, { status: { $ne: 'resolved' } }), c(User, { role: 'owner', ownerApprovalStatus: 'pending' }),
  ]);
  const [rev, byStatus, byCat] = await Promise.all([
    Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, t: { $sum: '$totalAmount' } } }]),
    Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Vehicle.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]),
  ]);
  const months = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-IN', { month: 'short' }), bookings: 0 }); }
  (await Booking.find({ createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } }).select('createdAt').lean())
    .forEach((x) => { const d = new Date(x.createdAt); const m = months.find((y) => y.key === `${d.getFullYear()}-${d.getMonth()}`); if (m) m.bookings++; });
  res.json({ bookingsByStatus: Object.fromEntries(byStatus.map((x) => [x._id, x.n])), vehiclesByCategory: Object.fromEntries(byCat.map((x) => [x._id, x.n])), months,
    stats: { revenue: rev[0]?.t || 0, totalUsers, customers, owners, pendingOwners, totalRentals, approvedRentals, pendingRentals, totalVehicles, approvedVehicles,
    availableVehicles, pendingVehicles, totalBookings, activeBookings, pendingBookings, completedBookings, totalReviews, openTickets } });
}));

/* Users: customers only. Rental owners are managed under Rentals. */
router.get('/users', h(async (req, res) => {
  const users = await User.find({ role: 'customer' }).sort('-createdAt').lean();
  const counts = await Booking.aggregate([{ $group: { _id: '$customer', bookings: { $sum: 1 }, spent: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } } } }]);
  const cm = new Map(counts.map((c) => [String(c._id), c]));
  res.json({ users: users.map((u) => ({ ...u, bookings: cm.get(String(u._id))?.bookings || 0, spent: cm.get(String(u._id))?.spent || 0 })) });
}));
router.patch('/users/:id/approval', h(async (req, res) => {
  const { status, reason } = req.body;
  if (!REVIEWABLE.includes(status)) bad('Status must be approved or rejected');
  const u = (await User.findOne({ _id: req.params.id, role: 'owner' })) || bad('Owner not found', 404);
  if (status === 'rejected' && !reason) bad('Rejection reason is required');
  u.ownerApprovalStatus = status;
  u.ownerRejectionReason = status === 'rejected' ? reason : undefined;
  await u.save();
  res.json({ user: u });
}));
router.patch('/users/:id/active', h(async (req, res) => {
  const u = (await User.findOne({ _id: req.params.id, role: { $ne: 'admin' } })) || bad('User not found', 404);
  u.isActive = !!req.body.isActive;
  await u.save();
  res.json({ user: u });
}));

/* Rentals */
router.get('/rentals', h(async (req, res) => res.json({ rentals: await Rental.find().sort('-createdAt').populate('owner', 'name email mobile ownerApprovalStatus isActive') })));
router.patch('/rentals/:id/status', h(async (req, res) => {
  const { status, reason } = req.body;
  if (!REVIEWABLE.includes(status)) bad('Status must be approved or rejected');
  const r = (await Rental.findById(req.params.id).populate('owner')) || bad('Rental not found', 404);
  if (status === 'approved' && r.owner.ownerApprovalStatus !== 'approved') bad('Approve the owner account first');
  if (status === 'rejected' && !reason) bad('Rejection reason is required');
  r.status = status;
  r.rejectionReason = status === 'rejected' ? reason : undefined;
  await r.save();
  res.json({ rental: r });
}));

/* Vehicles: live as soon as owners add them. Admin can filter, and remove / restore. */
router.get('/vehicles', h(async (req, res) => {
  const { category, status, number, shop, q } = req.query;
  const f = {};
  if (category && category !== 'all') f.category = category;
  if (status === 'live') f.approvalStatus = 'approved';
  else if (status === 'removed') f.approvalStatus = 'rejected';
  else if (status === 'available') { f.approvalStatus = 'approved'; f.available = true; }
  if (number && number.trim()) { const n = number.replace(/[\s-]+/g, ''); if (n) f.vehicleNumber = new RegExp(n.split('').map(esc).join('[\\s-]*'), 'i'); }  if (q && q.trim()) f.name = new RegExp(esc(q.trim()), 'i');
  if (shop && shop.trim()) {
    const rx = new RegExp(esc(shop.trim()), 'i');
    f.rental = { $in: (await Rental.find({ $or: [{ shopName: rx }, { city: rx }] }).select('_id')).map((r) => r._id) };
  }
  const vehicles = await Vehicle.find(f).select('-photo').sort('-createdAt').limit(300).populate('rental', 'shopName status city state mobile').lean();
  const ids = vehicles.map((v) => v._id);
  const [rev, bk] = await Promise.all([
    Review.aggregate([{ $match: { vehicle: { $in: ids } } }, { $group: { _id: '$vehicle', n: { $sum: 1 }, avg: { $avg: '$rating' }, low: { $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] } } } }]),
    Booking.aggregate([{ $match: { vehicle: { $in: ids } } }, { $group: { _id: '$vehicle', n: { $sum: 1 } } }]),
  ]);
  const rm = new Map(rev.map((x) => [String(x._id), x])), bm = new Map(bk.map((x) => [String(x._id), x.n]));
  res.json({ vehicles: vehicles.map((v) => {
    const r = rm.get(String(v._id));
    return { ...v, reviewCount: r?.n || 0, avgRating: r ? +r.avg.toFixed(1) : null, lowRatings: r?.low || 0, bookingCount: bm.get(String(v._id)) || 0 };
  }) });
}));
router.patch('/vehicles/:id/status', h(async (req, res) => {
  const { status, reason } = req.body;
  if (!REVIEWABLE.includes(status)) bad('Status must be approved (restore) or rejected (remove)');
  const v = (await Vehicle.findById(req.params.id).populate('rental')) || bad('Vehicle not found', 404);
  if (status === 'approved' && v.rental.status !== 'approved') bad('The rental shop is not approved');
  if (status === 'rejected' && !reason) bad('A reason for removing the vehicle is required');
  v.approvalStatus = status;
  v.rejectionReason = status === 'rejected' ? reason : undefined;
  await v.save();
  res.json({ vehicle: v });
}));

/* Bookings: monitoring only, no status changes here */
router.get('/bookings', h(async (req, res) => res.json({ bookings: await Booking.find().sort('-createdAt').limit(200)
  .populate('customer', 'name').populate('vehicle', 'name').populate('rental', 'shopName') })));

/* Reviews */
router.get('/reviews', h(async (req, res) => res.json({ reviews: await Review.find().sort('-createdAt').populate('customer', 'name').populate('vehicle', 'name') })));
router.patch('/reviews/:id/status', h(async (req, res) => {
  if (!['visible', 'hidden'].includes(req.body.status)) bad('Status must be visible or hidden');
  const r = (await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })) || bad('Review not found', 404);
  res.json({ review: r });
}));

/* Support */
router.get('/support', h(async (req, res) => res.json({ tickets: await SupportTicket.find().sort('-createdAt').populate('customer', 'name email') })));
router.patch('/support/:id', h(async (req, res) => {
  const { status, adminResponse } = req.body;
  const t = (await SupportTicket.findById(req.params.id)) || bad('Ticket not found', 404);
  if (status) { if (!['open', 'in-progress', 'resolved'].includes(status)) bad('Invalid status'); t.status = status; }
  if (adminResponse !== undefined) t.adminResponse = adminResponse;
  await t.save();
  res.json({ ticket: t });
}));

module.exports = router;
