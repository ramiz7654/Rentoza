const router = require('express').Router();
const User = require('../models/User');
const Rental = require('../models/Rental');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { settleMiddleware } = require('../utils/settle');
const { protect, requireRole } = require('../middleware/auth');
const { h, bad, validLoc, CATEGORIES } = require('../utils/helpers');

// Public: owner signup -> owner(pending) + rental(pending). No auto login.
router.post('/register', h(async (req, res) => {
  const b = req.body;
  if (!b.password || b.password.length < 6) bad('Password must be at least 6 characters');
  if (b.password !== b.confirmPassword) bad('Passwords do not match');
  const lat = Number(b.latitude), lng = Number(b.longitude);
  if (!validLoc(lat, lng)) bad('Valid shop latitude and longitude are required');
  const owner = await User.create({ name: b.name, email: b.email, mobile: b.mobile, password: b.password, role: 'owner', ownerApprovalStatus: 'pending' });
  try {
    await Rental.create({
      owner: owner._id, shopName: b.shopName, ownerName: b.name, mobile: b.mobile, email: owner.email,
      address: b.address, city: b.city, state: b.state, pincode: b.pincode,
      location: { type: 'Point', coordinates: [lng, lat] },
    });
  } catch (e) { await User.findByIdAndDelete(owner._id); throw e; }
  res.status(201).json({ message: 'Registration submitted successfully. Please wait for admin approval.' });
}));

router.use(protect, requireRole('owner'), settleMiddleware);
const myRental = async (user) => (await Rental.findOne({ owner: user._id })) || bad('Rental profile not found', 404);

router.get('/dashboard', h(async (req, res) => {
  const rental = await myRental(req.user);
  const rid = rental._id;
  const [vehicles, bookings, reviews] = await Promise.all([
    Vehicle.find({ rental: rid }).select('-photo').sort('-createdAt').lean(),
    Booking.find({ rental: rid }).sort('-createdAt').populate('customer', 'name mobile').populate('vehicle', 'name category').lean(),
    Review.find({ rental: rid, status: 'visible' }).sort('-createdAt').populate('customer', 'name').populate('vehicle', 'name').lean(),
  ]);
  const cnt = (st) => bookings.filter((x) => x.status === st).length;
  const earned = bookings.filter((x) => ['confirmed', 'completed'].includes(x.status));
  const revenue = bookings.filter((x) => x.status === 'completed').reduce((t, x) => t + x.totalAmount, 0);
  const upcomingRevenue = bookings.filter((x) => x.status === 'confirmed').reduce((t, x) => t + x.totalAmount, 0);
  // last 6 months (bookings count + earnings)
  const months = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-IN', { month: 'short' }), bookings: 0, amount: 0 }); }
  bookings.forEach((x) => { const d = new Date(x.createdAt); const m = months.find((y) => y.key === `${d.getFullYear()}-${d.getMonth()}`); if (m) { m.bookings++; if (['confirmed', 'completed'].includes(x.status)) m.amount += x.totalAmount; } });
  // bookings per vehicle (top 5)
  const perVeh = {};
  bookings.forEach((x) => { if (x.vehicle && ['confirmed', 'completed'].includes(x.status)) perVeh[x.vehicle.name] = (perVeh[x.vehicle.name] || 0) + 1; });
  const topVehicles = Object.entries(perVeh).sort((p, q) => q[1] - p[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
  const byCategory = {};
  vehicles.forEach((v) => { byCategory[v.category] = (byCategory[v.category] || 0) + 1; });
  const avgRating = reviews.length ? +(reviews.reduce((t, r) => t + r.rating, 0) / reviews.length).toFixed(1) : null;
  res.json({
    rentalStatus: rental.status, rejectionReason: rental.rejectionReason, shopName: rental.shopName, city: rental.city,
    stats: { vehicles: vehicles.length, approvedVehicles: vehicles.filter((v) => v.approvalStatus === 'approved').length,
      availableVehicles: vehicles.filter((v) => v.approvalStatus === 'approved' && v.available).length,
      pendingBookings: cnt('pending'), confirmedBookings: cnt('confirmed'), completedBookings: cnt('completed'),
      totalBookings: bookings.length, revenue, upcomingRevenue, earnedBookings: earned.length, reviews: reviews.length, avgRating },
    months, topVehicles, byCategory,
    vehicles: vehicles.slice(0, 8).map((v) => ({ _id: v._id, name: v.name, category: v.category, image: v.image, pricePerDay: v.pricePerDay, available: v.available, approvalStatus: v.approvalStatus })),
    recentBookings: bookings.slice(0, 5).map((x) => ({ _id: x._id, customer: x.customer?.name, vehicle: x.vehicle?.name, startDate: x.startDate, endDate: x.endDate, days: x.days, totalAmount: x.totalAmount, status: x.status })),
    recentReviews: reviews.slice(0, 4).map((r) => ({ _id: r._id, rating: r.rating, comment: r.comment, customer: r.customer?.name, vehicle: r.vehicle?.name, createdAt: r.createdAt })),
  });
}));

router.get('/rental', h(async (req, res) => res.json({ rental: await myRental(req.user) })));

router.put('/rental', h(async (req, res) => {
  const rental = await myRental(req.user);
  const b = req.body;
  ['shopName', 'mobile', 'address', 'city', 'state', 'pincode'].forEach((k) => { if (b[k] !== undefined) rental[k] = b[k]; });
  if (b.latitude !== undefined && b.longitude !== undefined) {
    const lat = Number(b.latitude), lng = Number(b.longitude);
    if (!validLoc(lat, lng)) bad('Invalid latitude/longitude');
    rental.location = { type: 'Point', coordinates: [lng, lat] };
  }
  // any edit sends approved/rejected rentals back to admin review
  if (rental.status !== 'pending') { rental.status = 'pending'; rental.rejectionReason = undefined; }
  await rental.save();
  res.json({ rental, message: 'Saved. Changes are sent to admin for review.' });
}));

/* ---------- Vehicles ---------- */
const vehicleFields = (b) => {
  const f = { category: b.category, name: b.name, vehicleNumber: b.vehicleNumber, description: b.description, pricePerDay: Number(b.pricePerDay) };
  if (b.photo !== undefined) {
    if (b.photo && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.photo)) bad('Photo must be a JPG, PNG or WEBP image');
    if (b.photo && b.photo.length > 450000) bad('Photo is too large, please choose a smaller one');
    f.photo = b.photo || ''; // empty string removes the photo
  }
  return f;
};

router.post('/vehicles', h(async (req, res) => {
  const rental = await myRental(req.user);
  if (rental.status !== 'approved') bad('Your rental must be approved before adding vehicles', 403);
  const v = await Vehicle.create({ ...vehicleFields(req.body), rental: rental._id, approvalStatus: 'approved' }); // goes live directly, admin can remove later
  res.status(201).json({ vehicle: v });
}));

router.get('/vehicles', h(async (req, res) => {
  const rental = await myRental(req.user);
  res.json({ vehicles: await Vehicle.find({ rental: rental._id }).select('-photo').sort('-createdAt') });
}));

router.get('/vehicles/:id', h(async (req, res) => {
  const rental = await myRental(req.user);
  res.json({ vehicle: (await Vehicle.findOne({ _id: req.params.id, rental: rental._id })) || bad('Vehicle not found', 404) });
}));

router.put('/vehicles/:id', h(async (req, res) => {
  const rental = await myRental(req.user);
  const v = (await Vehicle.findOne({ _id: req.params.id, rental: rental._id })) || bad('Vehicle not found', 404);
  if (req.body.category && !CATEGORIES.includes(req.body.category)) bad('Invalid category');
  Object.entries(vehicleFields(req.body)).forEach(([k, val]) => { if (val !== undefined && !Number.isNaN(val)) v[k] = val; });
  // editing never changes the status: a vehicle removed by admin stays removed until admin restores it
  await v.save();
  res.json({ vehicle: v });
}));

router.patch('/vehicles/:id/availability', h(async (req, res) => {
  const rental = await myRental(req.user);
  const v = (await Vehicle.findOneAndUpdate({ _id: req.params.id, rental: rental._id }, { available: !!req.body.available }, { new: true })) || bad('Vehicle not found', 404);
  res.json({ vehicle: v });
}));

router.delete('/vehicles/:id', h(async (req, res) => {
  const rental = await myRental(req.user);
  const v = (await Vehicle.findOne({ _id: req.params.id, rental: rental._id })) || bad('Vehicle not found', 404);
  if (await Booking.exists({ vehicle: v._id, status: { $in: ['pending', 'confirmed'] } })) bad('Vehicle has active bookings and cannot be deleted');
  await v.deleteOne();
  res.json({ message: 'Vehicle deleted' });
}));

/* ---------- Bookings (owner decides, not admin) ---------- */
router.get('/bookings', h(async (req, res) => {
  const rental = await myRental(req.user);
  const filter = { rental: rental._id };
  if (req.query.status) filter.status = req.query.status;
  const bookings = await Booking.find(filter).sort('-createdAt').populate('customer', 'name mobile email').populate('vehicle', 'name vehicleNumber category');
  res.json({ bookings });
}));

const NEXT = { pending: ['confirmed', 'rejected'], confirmed: ['completed'] };
router.patch('/bookings/:id/status', h(async (req, res) => {
  const rental = await myRental(req.user);
  const booking = (await Booking.findOne({ _id: req.params.id, rental: rental._id })) || bad('Booking not found', 404);
  const { status, ownerNote, rejectionReason } = req.body;
  if (!(NEXT[booking.status] || []).includes(status)) bad(`Cannot change a ${booking.status} booking to ${status}`);
  if (status === 'rejected' && !rejectionReason) bad('Rejection reason is required');
  booking.status = status;
  if (ownerNote) booking.ownerNote = ownerNote;
  if (status === 'rejected') booking.rejectionReason = rejectionReason;
  await booking.save();
  res.json({ booking });
}));

module.exports = router;
