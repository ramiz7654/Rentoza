const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const pointSchema = { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } };

const userSchema = new Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  mobile: { type: String, required: [true, 'Mobile is required'], match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'] },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['customer', 'owner', 'admin'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  ownerApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
  ownerRejectionReason: String,
  savedLocations: [{ label: String, location: pointSchema }], // only filled when customer explicitly saves
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.matches = function (plain) { return bcrypt.compare(plain, this.password); };

module.exports = model('User', userSchema);
