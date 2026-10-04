const router = require('express').Router();
const Vehicle = require('../models/Vehicle');
const Rental = require('../models/Rental');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { rentalsNear } = require('../utils/geo');
const { h, bad, esc, CATEGORIES } = require('../utils/helpers');

// Customers only ever see: approved + available vehicles of approved rentals
router.get('/', h(async (req, res) => {
  const { q, category, radius, sort = 'nearest' } = req.query;
  const lat = req.query.lat !== undefined && req.query.lat !== '' ? Number(req.query.lat) : NaN;
  const lng = req.query.lng !== undefined && req.query.lng !== '' ? Number(req.query.lng) : NaN;
  const rentals = await rentalsNear({ lat, lng, radiusKm: radius });
  const rmap = new Map(rentals.map((r) => [String(r._id), r]));
  const filter = { rental: { $in: [...rmap.keys()] }, approvalStatus: 'approved', available: true };
  if (category && category !== 'all') { if (!CATEGORIES.includes(category)) bad('Invalid category'); filter.category = category; }
  if (q) {
    const rx = new RegExp(esc(q), 'i');
    const shopIds = rentals.filter((r) => rx.test(r.shopName) || rx.test(r.city) || rx.test(r.state)).map((r) => r._id);
    filter.$or = [{ name: rx }, { rental: { $in: shopIds } }];
  }
  let list = (await Vehicle.find(filter).select('-photo').lean()).map((v) => {
    const r = rmap.get(String(v.rental));
    return { ...v, rental: { _id: r._id, shopName: r.shopName, city: r.city, state: r.state, lat: r.location?.coordinates?.[1], lng: r.location?.coordinates?.[0], distanceKm: r.distance != null ? +(r.distance / 1000).toFixed(1) : undefined } };
  });
  const by = {
    nearest: (a, b) => (a.rental.distanceKm ?? 1e9) - (b.rental.distanceKm ?? 1e9),
    'price-low': (a, b) => a.pricePerDay - b.pricePerDay,
    'price-high': (a, b) => b.pricePerDay - a.pricePerDay,
    name: (a, b) => a.name.localeCompare(b.name),
    shop: (a, b) => a.rental.shopName.localeCompare(b.rental.shopName),
  };
  list.sort(by[sort] || by.nearest);
  res.json({ vehicles: list });
}));

const loadVisible = async (id) => {
  const v = (await Vehicle.findOne({ _id: id, approvalStatus: 'approved' }).lean()) || bad('Vehicle not found', 404);
  const rental = (await Rental.findOne({ _id: v.rental, status: 'approved' }).lean()) || bad('Vehicle not found', 404);
  return { v, rental };
};

router.get('/:id', h(async (req, res) => {
  const { v, rental } = await loadVisible(req.params.id);
  const reviews = await Review.find({ vehicle: v._id, status: 'visible' }).sort('-createdAt').limit(20).populate('customer', 'name').lean();
  const avg = reviews.length ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  res.json({
    vehicle: { ...v, rental: { _id: rental._id, shopName: rental.shopName, address: rental.address, city: rental.city, state: rental.state, mobile: rental.mobile, lat: rental.location?.coordinates?.[1], lng: rental.location?.coordinates?.[0] } },
    reviews: reviews.map((r) => ({ _id: r._id, rating: r.rating, comment: r.comment, customerName: r.customer?.name, createdAt: r.createdAt })),
    averageRating: avg,
  });
}));

router.get('/:id/availability', h(async (req, res) => {
  const { v } = await loadVisible(req.params.id);
  const booked = await Booking.find({ vehicle: v._id, status: { $in: ['pending', 'confirmed'] }, endDate: { $gt: new Date() } }).select('startDate endDate -_id').sort('startDate').lean();
  let available = v.available;
  const { start, end } = req.query;
  if (start && end) {
    const s = new Date(start), e = new Date(end);
    if (isNaN(s) || isNaN(e) || e <= s) bad('Invalid date range');
    available = v.available && !(await Booking.exists({ vehicle: v._id, status: { $in: ['pending', 'confirmed'] }, startDate: { $lt: e }, endDate: { $gt: s } }));
  }
  res.json({ available, bookedRanges: booked });
}));

module.exports = router;
