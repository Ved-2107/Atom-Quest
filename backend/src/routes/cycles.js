const express = require('express');
const cycleRouter = express.Router();
const { Cycle }   = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

// GET /api/cycles/active  — MUST be before /:id
cycleRouter.get('/active', protect, async (req, res) => {
  try {
    const cycle = await Cycle.findOne({ status: 'active' }).sort('-year');
    res.json({ success: true, data: cycle || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/cycles
cycleRouter.get('/', protect, async (req, res) => {
  try {
    const cycles = await Cycle.find().sort('-year').populate('createdBy', 'name email');
    res.json({ success: true, data: cycles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cycles  — admin only
cycleRouter.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const cycle = await Cycle.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: cycle });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/cycles/:id  — admin only
cycleRouter.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const cycle = await Cycle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found' });
    res.json({ success: true, data: cycle });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/cycles/:id
cycleRouter.get('/:id', protect, async (req, res) => {
  try {
    const cycle = await Cycle.findById(req.params.id);
    if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found' });
    res.json({ success: true, data: cycle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = { cycleRouter };
