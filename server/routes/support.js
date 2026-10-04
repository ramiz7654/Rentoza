const router = require('express').Router();
const SupportTicket = require('../models/SupportTicket');
const { protect, requireRole } = require('../middleware/auth');
const { h } = require('../utils/helpers');

router.use(protect, requireRole('customer'));
router.post('/tickets', h(async (req, res) => {
  const t = await SupportTicket.create({ customer: req.user._id, subject: req.body.subject, message: req.body.message });
  res.status(201).json({ ticket: t });
}));
router.get('/tickets', h(async (req, res) => res.json({ tickets: await SupportTicket.find({ customer: req.user._id }).sort('-createdAt') })));

module.exports = router;
