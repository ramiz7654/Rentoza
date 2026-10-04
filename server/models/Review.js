const { Schema, model } = require('mongoose');

const reviewSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  rental: { type: Schema.Types.ObjectId, ref: 'Rental', required: true },
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true }, // one review per booking
  rating: { type: Number, required: true, min: 1, max: 5, validate: { validator: Number.isInteger, message: 'Rating must be a whole number' } },
  comment: { type: String, trim: true, maxlength: 600, default: '' },
  status: { type: String, enum: ['visible', 'hidden'], default: 'visible' },
}, { timestamps: true });

module.exports = model('Review', reviewSchema);
