const express = require('express');
const router = express.Router();
const { AuditLog } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

// GET /api/audit - Get audit logs
router.get('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { entity, userId, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (entity) filter.entity = entity;
    if (userId) filter.userId = userId;

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);
    res.json({ success: true, data: logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
