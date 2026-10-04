const { Schema, model } = require('mongoose');

const rentalSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  shopName: { type: String, required: [true, 'Shop name is required'], trim: true },
  ownerName: { type: String, required: true, trim: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: [true, 'Address is required'], trim: true },
  city: { type: String, required: [true, 'City is required'], trim: true },
  state: { type: String, required: [true, 'State is required'], trim: true },
  pincode: { type: String, required: true, match: [/^\d{6}$/, 'Pincode must be 6 digits'] },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: String,
}, { timestamps: true });

rentalSchema.index({ location: '2dsphere' });
module.exports = model('Rental', rentalSchema);
