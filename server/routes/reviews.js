const router = require('express').Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { protect, requireRole } = require('../middleware/auth');
const { h, bad } = require('../utils/helpers');

router.post('/', protect, requireRole('customer'), h(async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const booking = (await Booking.findOne({ _id: bookingId, customer: req.user._id })) || bad('Booking not found', 404);
  if (booking.status !== 'completed') bad('You can review only completed bookings');
  if (await Review.exists({ booking: booking._id })) bad('You already reviewed this booking', 409);
  const review = await Review.create({ customer: req.user._id, vehicle: booking.vehicle, rental: booking.rental, booking: booking._id, rating: Number(rating), comment });
  res.status(201).json({ review });
}));

router.get('/', h(async (req, res) => {
  if (!req.query.vehicle) bad('vehicle query is required');
  const reviews = await Review.find({ vehicle: req.query.vehicle, status: 'visible' }).sort('-createdAt').populate('customer', 'name');
  res.json({ reviews });
}));

module.exports = router;
