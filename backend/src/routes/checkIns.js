const express = require('express');
const router  = express.Router();
const Goal    = require('../models/Goal');
const User    = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/check-ins  — returns approved goals with their check-ins (role-filtered)
router.get('/', protect, async (req, res) => {
  try {
    const { cycleId, quarter } = req.query;
    let filter = { status: 'approved' };

    if (req.user.role === 'employee') {
      filter.userId = req.user._id;
    } else if (req.user.role === 'manager') {
      const team   = await User.find({ managerId: req.user._id }).select('_id');
      const ids    = team.map(u => u._id);
      filter.userId = { $in: [...ids, req.user._id] };
    }
    // admin sees all

    if (cycleId) filter.cycleId = cycleId;

    const goals = await Goal.find(filter)
      .populate('userId', 'name email department designation')
      .populate('cycleId', 'name year')
      .sort('-createdAt');

    const checkIns = goals.map(g => ({
      goalId:   g._id,
      title:    g.title,
      uomType:  g.uomType,
      target:   g.target,
      weightage:g.weightage,
      userId:   g.userId,
      cycleId:  g.cycleId,
      progress: g.progress,
      checkIns: quarter ? g.checkIns.filter(c => c.quarter === quarter) : g.checkIns,
    }));

    res.json({ success: true, data: checkIns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/check-ins/:goalId/feedback  — manager adds structured feedback
router.post('/:goalId/feedback', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { quarter, feedback } = req.body;
    if (!quarter || !feedback)
      return res.status(400).json({ success: false, message: 'quarter and feedback are required' });

    const goal = await Goal.findById(req.params.goalId);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const ci = goal.checkIns.find(c => c.quarter === quarter);
    if (!ci)
      return res.status(404).json({ success: false, message: `No check-in found for ${quarter}` });

    ci.managerFeedback = feedback;
    await goal.save();

    const populated = await Goal.findById(goal._id).populate('userId', 'name email department');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
