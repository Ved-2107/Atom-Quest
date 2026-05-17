const express = require('express');
const router  = express.Router();
const Goal    = require('../models/Goal');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog }     = require('../middleware/audit');

// ── GET /api/goals ────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { cycleId, status, userId } = req.query;
    let filter = {};

    if (req.user.role === 'employee') {
      filter.userId = req.user._id;
    } else if (req.user.role === 'manager') {
      const User = require('../models/User');
      const team = await User.find({ managerId: req.user._id });
      const teamIds = team.map(u => u._id);
      // If a specific userId is requested, use it; otherwise all team members
      filter.userId = userId ? userId : { $in: [...teamIds, req.user._id] };
    }
    // admin gets all goals (no userId filter) unless one is provided
    if (req.user.role === 'admin' && userId) filter.userId = userId;

    if (cycleId) filter.cycleId = cycleId;
    if (status)  filter.status  = status;

    const goals = await Goal.find(filter)
      .populate('userId',     'name email department designation avatar employeeId')
      .populate('cycleId',    'name year status')
      .populate('approvedBy', 'name email')
      .sort('-createdAt');

    res.json({ success: true, data: goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/goals/submit  (MUST be before /:id routes) ─────────────────────
router.post('/submit', protect, authorize('employee'), async (req, res) => {
  try {
    const { cycleId } = req.body;
    if (!cycleId) return res.status(400).json({ success: false, message: 'cycleId is required' });

    const goals = await Goal.find({
      userId: req.user._id, cycleId,
      status: { $in: ['draft', 'rework'] },
    });

    if (!goals.length)
      return res.status(400).json({ success: false, message: 'No draft/rework goals to submit' });

    // Validate all goals including already-submitted ones total 100%
    const allMyGoals = await Goal.find({
      userId: req.user._id, cycleId,
      status: { $nin: ['rejected'] },
    });
    const totalWeight = allMyGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (totalWeight !== 100)
      return res.status(400).json({ success: false, message: `Total weightage must be exactly 100%. Current: ${totalWeight}%` });

    await Goal.updateMany(
      { userId: req.user._id, cycleId, status: { $in: ['draft', 'rework'] } },
      { status: 'submitted' }
    );

    await createAuditLog(req.user._id, 'SUBMIT', 'GoalSheet', null, null, { cycleId, count: goals.length }, `Goal sheet submitted (${goals.length} goals)`);
    res.json({ success: true, message: `${goals.length} goal(s) submitted for approval` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/goals ───────────────────────────────────────────────────────────
router.post('/', protect, authorize('employee', 'manager', 'admin'), async (req, res) => {
  try {
    const { thrustArea, title, description, uomType, target, weightage, deadline, cycleId, isShared, sharedGoalId } = req.body;

    // Validation
    if (!cycleId)    return res.status(400).json({ success: false, message: 'cycleId is required' });
    if (weightage < 10) return res.status(400).json({ success: false, message: 'Minimum weightage is 10%' });

    const existingGoals = await Goal.find({
      userId: req.user._id, cycleId,
      status: { $nin: ['rejected'] },
    });

    if (existingGoals.length >= 8)
      return res.status(400).json({ success: false, message: 'Maximum 8 goals allowed per cycle' });

    const totalWeight = existingGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (totalWeight + Number(weightage) > 100)
      return res.status(400).json({
        success: false,
        message: `Adding this goal would exceed 100%. Current total: ${totalWeight}%, trying to add: ${weightage}%`
      });

    const goal = await Goal.create({
      userId: req.user._id, thrustArea, title, description,
      uomType: uomType || 'numeric_min', target: Number(target),
      weightage: Number(weightage), deadline, cycleId,
      isShared: !!isShared, sharedGoalId: sharedGoalId || null,
      status: 'draft',
    });

    await createAuditLog(req.user._id, 'CREATE', 'Goal', goal._id, null, { title, weightage, uomType }, `Goal created: "${title}"`);
    const populated = await Goal.findById(goal._id).populate('userId', 'name email department').populate('cycleId', 'name year');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/goals/:id ────────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const isOwner = goal.userId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role === 'employee')
      return res.status(403).json({ success: false, message: 'Not authorized to edit this goal' });

    if (goal.isLocked && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Goal is locked. Contact admin to unlock.' });

    const oldValue = { status: goal.status, weightage: goal.weightage, target: goal.target };
    const allowed  = ['thrustArea', 'title', 'description', 'uomType', 'target', 'weightage', 'deadline'];
    allowed.forEach(f => { if (req.body[f] !== undefined) goal[f] = req.body[f]; });

    // If manager editing, allow comment
    if (req.user.role !== 'employee' && req.body.managerComment !== undefined)
      goal.managerComment = req.body.managerComment;

    await goal.save();
    await createAuditLog(req.user._id, 'UPDATE', 'Goal', goal._id, oldValue, { title: goal.title, weightage: goal.weightage }, `Goal updated: "${goal.title}"`);

    const populated = await Goal.findById(goal._id)
      .populate('userId', 'name email department')
      .populate('cycleId', 'name year')
      .populate('approvedBy', 'name email');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/goals/:id/approve ───────────────────────────────────────────────
router.post('/:id/approve', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id).populate('userId', 'name email department');
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    if (goal.status !== 'submitted')
      return res.status(400).json({ success: false, message: `Cannot approve a goal with status "${goal.status}"` });

    const oldValue = { status: goal.status, target: goal.target, weightage: goal.weightage };
    const { target, weightage, comment } = req.body;

    goal.status      = 'approved';
    goal.isLocked    = true;
    goal.lockDate    = new Date();
    goal.approvedBy  = req.user._id;
    goal.approvedAt  = new Date();
    if (target    !== undefined) goal.target    = Number(target);
    if (weightage !== undefined) goal.weightage = Number(weightage);
    if (comment)                 goal.managerComment = comment;

    await goal.save();
    await createAuditLog(req.user._id, 'APPROVE', 'Goal', goal._id, oldValue,
      { status: 'approved', target: goal.target, weightage: goal.weightage },
      `Goal approved by ${req.user.name}: "${goal.title}"`);

    const populated = await Goal.findById(goal._id)
      .populate('userId', 'name email department')
      .populate('approvedBy', 'name email');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/goals/:id/reject ────────────────────────────────────────────────
router.post('/:id/reject', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const { reason, returnForRework } = req.body;
    const oldStatus = goal.status;

    goal.status          = returnForRework ? 'rework' : 'rejected';
    goal.rejectionReason = reason || '';
    goal.isLocked        = false;

    await goal.save();
    await createAuditLog(req.user._id,
      returnForRework ? 'RETURN' : 'REJECT', 'Goal', goal._id,
      { status: oldStatus },
      { status: goal.status, reason },
      `Goal ${returnForRework ? 'returned for rework' : 'rejected'} by ${req.user.name}`);

    const populated = await Goal.findById(goal._id).populate('userId', 'name email department');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/goals/:id/unlock ────────────────────────────────────────────────
router.post('/:id/unlock', protect, authorize('admin'), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    goal.isLocked = false;
    await goal.save();
    await createAuditLog(req.user._id, 'UNLOCK', 'Goal', goal._id, { isLocked: true }, { isLocked: false }, `Goal unlocked by admin: "${goal.title}"`);
    res.json({ success: true, data: goal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/goals/:id/checkin ────────────────────────────────────────────────
router.put('/:id/checkin', protect, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    if (goal.status !== 'approved')
      return res.status(400).json({ success: false, message: 'Check-ins can only be added to approved goals' });

    const { quarter, achievement, status, notes } = req.body;
    if (!['Q1','Q2','Q3','Q4'].includes(quarter))
      return res.status(400).json({ success: false, message: 'Invalid quarter. Use Q1, Q2, Q3, or Q4' });

    const existingIdx = goal.checkIns.findIndex(c => c.quarter === quarter);
    const ciData      = { quarter, achievement: Number(achievement) || 0, status: status || 'not_started', notes: notes || '', updatedAt: new Date() };

    if (existingIdx >= 0) {
      goal.checkIns[existingIdx] = { ...goal.checkIns[existingIdx].toObject(), ...ciData };
    } else {
      goal.checkIns.push(ciData);
    }

    // Recalculate progress
    goal.progress        = goal.calculateProgress();
    goal.finalAchievement = Number(achievement) || 0;
    await goal.save();

    await createAuditLog(req.user._id, 'CHECKIN', 'Goal', goal._id, null,
      { quarter, achievement, status }, `${quarter} check-in updated for "${goal.title}"`);

    const populated = await Goal.findById(goal._id).populate('userId','name email department');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/goals/:id ─────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    if (!['draft','rework'].includes(goal.status))
      return res.status(400).json({ success: false, message: 'Only draft or rework goals can be deleted' });

    const isOwner = goal.userId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role === 'employee')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await goal.deleteOne();
    await createAuditLog(req.user._id, 'DELETE', 'Goal', goal._id, { title: goal.title }, null, `Goal deleted: "${goal.title}"`);
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
