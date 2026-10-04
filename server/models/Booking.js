const { Schema, model } = require('mongoose');

const bookingSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rental: { type: Schema.Types.ObjectId, ref: 'Rental', required: true, index: true },
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'], default: 'pending' },
  customerNote: { type: String, default: '', maxlength: 500 },
  ownerNote: { type: String, default: '', maxlength: 500 },
  rejectionReason: String,
  reviewDismissed: { type: Boolean, default: false }, // customer removed the review popup for this ride
}, { timestamps: true });

module.exports = model('Booking', bookingSchema);
