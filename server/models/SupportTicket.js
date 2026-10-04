const { Schema, model } = require('mongoose');

const ticketSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: [true, 'Subject is required'], trim: true, maxlength: 120 },
  message: { type: String, required: [true, 'Message is required'], trim: true, maxlength: 1000 },
  status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' },
  adminResponse: { type: String, default: '' },
}, { timestamps: true });

module.exports = model('SupportTicket', ticketSchema);
