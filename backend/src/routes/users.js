const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/users/team  — BEFORE /:id to avoid conflict
router.get('/team', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const managerId = req.user.role === 'manager' ? req.user._id : req.query.managerId;
    if (!managerId) return res.status(400).json({ success: false, message: 'managerId required' });

    const team = await User.find({ managerId, isActive: true })
      .select('-password')
      .sort('name');
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users  — list users
router.get('/', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { role, department } = req.query;
    const filter = { isActive: true };
    if (role)       filter.role       = role;
    if (department) filter.department = department;
    if (req.user.role === 'manager') filter.managerId = req.user._id;

    const users = await User.find(filter)
      .select('-password')
      .populate('managerId', 'name email')
      .sort('name');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/me  — current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('managerId', 'name email department');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('managerId', 'name email department');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/:id  — admin only
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const allowed = ['name', 'department', 'designation', 'role', 'managerId', 'isActive', 'employeeId'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
