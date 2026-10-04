const { Schema, model } = require('mongoose');
const { CATEGORIES } = require('../utils/helpers');

const vehicleSchema = new Schema({
  rental: { type: Schema.Types.ObjectId, ref: 'Rental', required: true, index: true },
  category: { type: String, enum: CATEGORIES, required: [true, 'Category is required'] },
  name: { type: String, required: [true, 'Vehicle name is required'], trim: true },
  vehicleNumber: { type: String, required: [true, 'Vehicle number is required'], unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true, default: '' },
  pricePerDay: { type: Number, required: true, min: [1, 'Price must be greater than 0'] },
  image: { type: String, default: '' },  // legacy URL
  photo: { type: String, default: '' },  // optional owner upload (compressed data URL), shown only on the detail page
  available: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }, // approved = live; rejected = removed by admin
  rejectionReason: String,
}, { timestamps: true });

module.exports = model('Vehicle', vehicleSchema);
