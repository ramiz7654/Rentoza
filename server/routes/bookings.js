const router = require('express').Router();
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Rental = require('../models/Rental');
const Review = require('../models/Review');
const { protect, requireRole } = require('../middleware/auth');
const { h, bad } = require('../utils/helpers');

router.use(protect);

router.post('/', requireRole('customer'), h(async (req, res) => {
  const { vehicleId, startDate, endDate, customerNote } = req.body;
  const start = new Date(startDate), end = new Date(endDate);
  if (isNaN(start) || isNaN(end)) bad('Valid start and end dates are required');
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  if (start < today) bad('Start date cannot be in the past');
  if (end <= start) bad('End date must be after start date');
  const vehicle = (await Vehicle.findById(vehicleId)) || bad('Vehicle not found', 404);
  const rental = await Rental.findById(vehicle.rental);
  if (vehicle.approvalStatus !== 'approved' || !rental || rental.status !== 'approved') bad('Vehicle is not available for booking');
  if (!vehicle.available) bad('Vehicle is currently unavailable');
  const clash = await Booking.exists({ vehicle: vehicle._id, status: { $in: ['pending', 'confirmed'] }, startDate: { $lt: end }, endDate: { $gt: start } });
  if (clash) bad('Vehicle is already booked for these dates', 409);
  const days = Math.ceil((end - start) / 86400000);
  const booking = await Booking.create({
    customer: req.user._id, rental: rental._id, vehicle: vehicle._id, startDate: start, endDate: end,
    days, totalAmount: days * vehicle.pricePerDay, // calculated on server only
    customerNote: customerNote || '',
  });
  res.status(201).json({ booking });
}));

router.get('/mine', requireRole('customer'), h(async (req, res) => {
  const bookings = await Booking.find({ customer: req.user._id }).sort('-createdAt')
    .populate('vehicle', 'name category image vehicleNumber').populate('rental', 'shopName city').lean();
  const reviewed = new Set((await Review.find({ booking: { $in: bookings.map((b) => b._id) } }).select('booking')).map((r) => String(r.booking)));
  res.json({ bookings: bookings.map((b) => ({ ...b, reviewed: reviewed.has(String(b._id)) })) });
}));

router.get('/pending-reviews', requireRole('customer'), h(async (req, res) => {
  const done = await Booking.find({ customer: req.user._id, status: 'completed', reviewDismissed: { $ne: true } }).sort('-updatedAt')
    .populate('vehicle', 'name category image').populate('rental', 'shopName city').lean();
  const reviewed = new Set((await Review.find({ booking: { $in: done.map((b) => b._id) } }).select('booking')).map((r) => String(r.booking)));
  res.json({ bookings: done.filter((b) => !reviewed.has(String(b._id))) });
}));

router.patch('/:id/dismiss-review', requireRole('customer'), h(async (req, res) => {
  const b = (await Booking.findOne({ _id: req.params.id, customer: req.user._id })) || bad('Booking not found', 404);
  b.reviewDismissed = true;
  await b.save();
  res.json({ ok: true });
}));

router.get('/:id', h(async (req, res) => {
  const b = (await Booking.findById(req.params.id).populate('vehicle', 'name category vehicleNumber pricePerDay')
    .populate('rental', 'shopName address city state mobile owner location').populate('customer', 'name mobile email').lean()) || bad('Booking not found', 404);
  const { role, _id } = req.user;
  const allowed = role === 'admin' || (role === 'customer' && String(b.customer._id) === String(_id)) || (role === 'owner' && String(b.rental.owner) === String(_id));
  if (!allowed) bad('Booking not found', 404); // do not reveal other people's bookings
  b.reviewed = !!(await Review.exists({ booking: b._id }));
  res.json({ booking: b });
}));

router.patch('/:id/cancel', requireRole('customer'), h(async (req, res) => {
  const b = (await Booking.findOne({ _id: req.params.id, customer: req.user._id })) || bad('Booking not found', 404);
  if (!['pending', 'confirmed'].includes(b.status)) bad(`A ${b.status} booking cannot be cancelled`);
  b.status = 'cancelled';
  await b.save();
  res.json({ booking: b });
}));

module.exports = router;
