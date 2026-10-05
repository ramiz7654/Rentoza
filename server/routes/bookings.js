const router = require('express').Router();
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Rental = require('../models/Rental');
const Review = require('../models/Review');
const { protect, requireRole } = require('../middleware/auth');
const { h, bad } = require('../utils/helpers');
const { settleMiddleware, IST_DAY_END_MS } = require('../utils/settle');

router.use(protect, settleMiddleware);

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
  if (role === 'customer' && ['pending', 'confirmed'].includes(b.status)) {
    // how far this booking can be extended: up to the start of the next booking of the same vehicle
    const next = await Booking.findOne({ vehicle: b.vehicle._id, _id: { $ne: b._id }, status: { $in: ['pending', 'confirmed'] }, startDate: { $gte: b.endDate } }).sort('startDate').select('startDate').lean();
    b.extendMaxDate = next ? next.startDate : null;
    b.dailyRate = b.totalAmount / b.days;
  }
  res.json({ booking: b });
}));

// Customer extends his own booking (no owner approval). Only if no other booking of the vehicle clashes.
router.patch('/:id/extend', requireRole('customer'), h(async (req, res) => {
  const b = (await Booking.findOne({ _id: req.params.id, customer: req.user._id })) || bad('Booking not found', 404);
  if (!['pending', 'confirmed'].includes(b.status)) bad(`A ${b.status} booking cannot be extended`);
  if (Date.now() >= b.endDate.getTime() + IST_DAY_END_MS) bad('This booking has already ended. Please make a new booking.');
  const newEnd = new Date(req.body.endDate);
  if (isNaN(newEnd)) bad('A valid new end date is required');
  const extra = Math.round((newEnd - b.endDate) / 86400000);
  if (extra < 1) bad('New end date must be after the current end date');
  if (extra > 30) bad('You can extend by at most 30 days at a time');
  const vehicle = (await Vehicle.findById(b.vehicle)) || bad('Vehicle not found', 404);
  if (vehicle.approvalStatus !== 'approved' || !vehicle.available) bad('This vehicle cannot be extended right now. Please contact the rental shop.');
  const clash = await Booking.findOne({ vehicle: b.vehicle, _id: { $ne: b._id }, status: { $in: ['pending', 'confirmed'] }, startDate: { $lt: newEnd }, endDate: { $gt: b.endDate } }).sort('startDate').select('startDate');
  if (clash) bad(`The vehicle is booked by someone else from ${clash.startDate.toISOString().slice(0, 10)}, so you can extend only up to that date.`, 409);
  const rate = b.totalAmount / b.days; // keep the rate this booking was made at
  if (!b.originalEndDate) b.originalEndDate = b.endDate;
  b.endDate = newEnd;
  b.days += extra;
  b.extendedDays += extra;
  b.totalAmount = Math.round(b.totalAmount + rate * extra);
  await b.save();
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
