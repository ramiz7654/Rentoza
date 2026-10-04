const Rental = require('../models/Rental');

// Approved rentals, optionally sorted by distance using MongoDB $geoNear (2dsphere index)
async function rentalsNear({ lat, lng, radiusKm, match = {} }) {
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const maxDistance = Math.min(Number(radiusKm) || 25, 100) * 1000;
    return Rental.aggregate([{
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance', maxDistance, spherical: true,
        query: { status: 'approved', ...match },
      },
    }]);
  }
  return Rental.find({ status: 'approved', ...match }).lean();
}
module.exports = { rentalsNear };
