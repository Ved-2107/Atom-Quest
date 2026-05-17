const express = require('express');
const router = express.Router();
const { SharedGoal } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { department, cycleId } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (cycleId) filter.cycleId = cycleId;
    if (req.user.role === 'employee') filter.assignedTo = req.user._id;

    const goals = await SharedGoal.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email department')
      .populate('cycleId', 'name year');
    res.json({ success: true, data: goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const goal = await SharedGoal.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: goal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const goal = await SharedGoal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: goal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
