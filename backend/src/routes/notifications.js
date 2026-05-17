const express = require('express');
const notifRouter = express.Router();
const { Notification } = require('../models/index');
const { protect } = require('../middleware/auth');

notifRouter.get('/', protect, async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user._id }).sort('-createdAt').limit(25);
    const unread = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ success: true, data: notifs, unread });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// IMPORTANT: mark-all-read BEFORE /:id to avoid route conflict
notifRouter.put('/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

notifRouter.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = notifRouter;
