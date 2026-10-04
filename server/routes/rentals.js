const router = require('express').Router();
const Rental = require('../models/Rental');
const { rentalsNear } = require('../utils/geo');
const { h, bad, esc } = require('../utils/helpers');

const pub = (r) => ({ _id: r._id, shopName: r.shopName, address: r.address, city: r.city, state: r.state, pincode: r.pincode, mobile: r.mobile,
  location: r.location, distanceKm: r.distance != null ? +(r.distance / 1000).toFixed(1) : undefined });

router.get('/', h(async (req, res) => {
  const lat = req.query.lat !== undefined ? Number(req.query.lat) : NaN;
  const lng = req.query.lng !== undefined ? Number(req.query.lng) : NaN;
  const match = {};
  if (req.query.q) { const rx = new RegExp(esc(req.query.q), 'i'); match.$or = [{ shopName: rx }, { city: rx }, { state: rx }]; }
  const rentals = await rentalsNear({ lat, lng, radiusKm: req.query.radius, match });
  res.json({ rentals: rentals.map(pub) });
}));

router.get('/:id', h(async (req, res) => {
  const r = (await Rental.findOne({ _id: req.params.id, status: 'approved' }).lean()) || bad('Rental not found', 404);
  res.json({ rental: pub(r) });
}));

module.exports = router;
