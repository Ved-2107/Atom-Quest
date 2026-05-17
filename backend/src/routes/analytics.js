const express = require('express');
const router  = express.Router();
const Goal    = require('../models/Goal');
const User    = require('../models/User');
const { AuditLog } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/analytics/overview ──────────────────────────────────────────────
router.get('/overview', protect, authorize('admin','manager'), async (req, res) => {
  try {
    const { cycleId } = req.query;
    const filter = cycleId ? { cycleId } : {};

    const [totalGoals, approvedGoals, pendingGoals, rejectedGoals, totalUsers] = await Promise.all([
      Goal.countDocuments(filter),
      Goal.countDocuments({ ...filter, status: 'approved' }),
      Goal.countDocuments({ ...filter, status: 'submitted' }),
      Goal.countDocuments({ ...filter, status: 'rejected' }),
      User.countDocuments({ isActive: true, role: 'employee' }),
    ]);

    // Department breakdown
    const deptBreakdown = await Goal.aggregate([
      { $match: filter },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $group: {
          _id: '$user.department',
          count:    { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status','approved'] }, 1, 0] } },
          avgProgress: { $avg: '$progress' },
      }},
      { $sort: { count: -1 } },
    ]);

    // UoM distribution
    const uomDist = await Goal.aggregate([
      { $match: filter },
      { $group: { _id: '$uomType', count: { $sum: 1 } } },
    ]);

    // Monthly trend
    const monthlyTrend = await Goal.aggregate([
      { $match: filter },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Thrust area breakdown
    const thrustAreas = await Goal.aggregate([
      { $match: filter },
      { $group: { _id: '$thrustArea', count: { $sum: 1 }, avgProgress: { $avg: '$progress' } } },
      { $sort: { count: -1 } },
    ]);

    // Quarter-on-Quarter achievement trends (per quarter aggregated)
    const qoqTrends = await Goal.aggregate([
      { $match: { ...filter, status: 'approved' } },
      { $unwind: '$checkIns' },
      { $group: {
          _id: '$checkIns.quarter',
          avgAchievementPct: { $avg: '$progress' },
          totalUpdated: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$checkIns.status','completed'] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Completion rate by quarter (who submitted check-ins vs total approved)
    const quarterCompletion = ['Q1','Q2','Q3','Q4'].map(q => {
      const found = qoqTrends.find(t => t._id === q) || {};
      return { quarter: q, updated: found.totalUpdated || 0, completed: found.completed || 0, avgPct: Math.round(found.avgAchievementPct || 0) };
    });

    // Manager effectiveness: check-in approval speed, team completion
    const managerEffectiveness = await Goal.aggregate([
      { $match: { ...filter, status: 'approved', approvedBy: { $ne: null } } },
      { $group: {
          _id: '$approvedBy',
          approvedCount: { $sum: 1 },
          avgProgress: { $avg: '$progress' },
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'manager' } },
      { $unwind: '$manager' },
      { $project: { name: '$manager.name', department: '$manager.department', approvedCount: 1, avgProgress: { $round: ['$avgProgress', 0] } } },
      { $sort: { approvedCount: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: { totalGoals, approvedGoals, pendingGoals, rejectedGoals, totalUsers },
        completionRate: totalGoals ? Math.round((approvedGoals / totalGoals) * 100) : 0,
        deptBreakdown,
        uomDist,
        monthlyTrend,
        thrustAreas,
        quarterCompletion,
        managerEffectiveness,
        qoqTrends,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/analytics/employee/:userId ──────────────────────────────────────
router.get('/employee/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId === 'me' ? req.user._id : req.params.userId;
    const goals  = await Goal.find({ userId }).populate('cycleId', 'name year');

    const byStatus = goals.reduce((acc, g) => {
      acc[g.status] = (acc[g.status] || 0) + 1; return acc;
    }, {});

    const byQuarter = ['Q1','Q2','Q3','Q4'].map(q => {
      const relevant = goals.filter(g => g.checkIns?.some(ci => ci.quarter === q));
      const completed = relevant.filter(g => g.checkIns?.find(c => c.quarter === q)?.status === 'completed');
      return { quarter: q, total: relevant.length, completed: completed.length };
    });

    const approved    = goals.filter(g => g.status === 'approved');
    const avgProgress = approved.length
      ? Math.round(approved.reduce((s, g) => s + (g.progress || 0), 0) / approved.length) : 0;

    // QoQ progress for this employee
    const qoqPersonal = ['Q1','Q2','Q3','Q4'].map(q => {
      const cis = approved.flatMap(g => g.checkIns?.filter(c => c.quarter === q) || []);
      const pcts = approved.map(g => {
        const ci = g.checkIns?.find(c => c.quarter === q);
        if (!ci) return null;
        const t = g.target || 1;
        const a = ci.achievement || 0;
        const uom = g.uomType;
        if (uom === 'numeric_min' || uom === 'max') return Math.min((a/t)*100,100);
        if (uom === 'numeric_max' || uom === 'min') return a === 0 ? 0 : Math.min((t/a)*100,100);
        if (uom === 'zero') return a === 0 ? 100 : 0;
        return 0;
      }).filter(p => p !== null);
      const avg = pcts.length ? Math.round(pcts.reduce((a,b) => a+b,0)/pcts.length) : 0;
      return { quarter: q, avgProgress: avg, updated: cis.length };
    });

    res.json({ success: true, data: { goals, byStatus, byQuarter, avgProgress, totalGoals: goals.length, approvedGoals: approved.length, qoqPersonal } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/analytics/manager ───────────────────────────────────────────────
router.get('/manager', protect, authorize('manager','admin'), async (req, res) => {
  try {
    const { cycleId } = req.query;
    const team    = await User.find({ managerId: req.user._id, isActive: true });
    const teamIds = team.map(u => u._id);
    const filter  = { userId: { $in: teamIds } };
    if (cycleId) filter.cycleId = cycleId;

    const goals = await Goal.find(filter).populate('userId','name department designation avatar');

    const teamPerformance = team.map(member => {
      const mg = goals.filter(g => g.userId._id.toString() === member._id.toString());
      const approved = mg.filter(g => g.status === 'approved');
      const avgProg  = approved.length ? Math.round(approved.reduce((s,g) => s+(g.progress||0),0)/approved.length) : 0;
      // Check-in completion per quarter
      const checkInCompletion = ['Q1','Q2','Q3','Q4'].map(q => {
        const hasCI = approved.filter(g => g.checkIns?.some(c => c.quarter === q));
        return { quarter: q, submitted: hasCI.length, total: approved.length };
      });
      return {
        userId: member._id, name: member.name, department: member.department, designation: member.designation,
        totalGoals: mg.length, approvedGoals: approved.length,
        pendingGoals: mg.filter(g => g.status==='submitted').length,
        draftGoals:   mg.filter(g => g.status==='draft').length,
        avgProgress: avgProg, checkInCompletion,
      };
    });

    const pendingApprovals = goals.filter(g => g.status==='submitted');
    res.json({ success: true, data: { teamPerformance, pendingApprovals: pendingApprovals.length, teamSize: team.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/analytics/completion ────────────────────────────────────────────
// Completion dashboard: who has/hasn't done check-ins (BRD Section 4)
router.get('/completion', protect, authorize('admin','manager'), async (req, res) => {
  try {
    const { cycleId, quarter } = req.query;
    const filter = { status: 'approved' };
    if (cycleId) filter.cycleId = cycleId;

    const goals = await Goal.find(filter)
      .populate('userId','name email department designation');

    // Group by user
    const byUser = {};
    for (const g of goals) {
      const uid = g.userId?._id?.toString();
      if (!uid) continue;
      if (!byUser[uid]) byUser[uid] = { user: g.userId, goals: [], checkInStatus: {} };
      byUser[uid].goals.push(g);
    }

    const quarters = quarter ? [quarter] : ['Q1','Q2','Q3','Q4'];
    const result = Object.values(byUser).map(({ user, goals: uGoals }) => {
      const qStatus = {};
      for (const q of quarters) {
        const submitted = uGoals.filter(g => g.checkIns?.some(c => c.quarter === q));
        const completed = submitted.filter(g => g.checkIns?.find(c => c.quarter === q)?.status === 'completed');
        qStatus[q] = { submitted: submitted.length, completed: completed.length, total: uGoals.length };
      }
      return { user, totalGoals: uGoals.length, checkInStatus: qStatus };
    });

    // Summary stats
    const summary = {};
    for (const q of quarters) {
      const done   = result.filter(r => r.checkInStatus[q]?.submitted === r.totalGoals && r.totalGoals > 0);
      const partial = result.filter(r => r.checkInStatus[q]?.submitted > 0 && r.checkInStatus[q]?.submitted < r.totalGoals);
      const none   = result.filter(r => !r.checkInStatus[q]?.submitted);
      summary[q] = { complete: done.length, partial: partial.length, pending: none.length, total: result.length };
    }

    res.json({ success: true, data: { employees: result, summary, quarters } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/analytics/escalations ──────────────────────────────────────────
router.get('/escalations', protect, authorize('admin','manager'), async (req, res) => {
  try {
    const { cycleId } = req.query;
    const filter = cycleId ? { cycleId } : {};
    const goals  = await Goal.find(filter).populate('userId','name email department managerId');
    const now    = new Date();

    const items = [];
    for (const g of goals) {
      // Rule 1: Draft goals not submitted after 14 days
      const daysSinceCreation = Math.floor((now - new Date(g.createdAt)) / 86400000);
      if (g.status === 'draft' && daysSinceCreation > 14) {
        items.push({ type: 'goal_not_submitted', severity: daysSinceCreation > 21 ? 'high' : 'medium',
          user: g.userId, goal: g.title, message: `Goal "${g.title}" not submitted for ${daysSinceCreation} days`, days: daysSinceCreation, goalId: g._id });
      }
      // Rule 2: Submitted goals not approved after 7 days
      if (g.status === 'submitted' && g.updatedAt) {
        const daysPending = Math.floor((now - new Date(g.updatedAt)) / 86400000);
        if (daysPending > 7) {
          items.push({ type: 'approval_delayed', severity: daysPending > 14 ? 'high' : 'medium',
            user: g.userId, goal: g.title, message: `Goal "${g.title}" pending approval for ${daysPending} days`, days: daysPending, goalId: g._id });
        }
      }
      // Rule 3: Approved goals missing check-ins in active quarter
      if (g.status === 'approved') {
        const month = now.getMonth() + 1;
        let expectedQ = null;
        if (month >= 7 && month < 10)  expectedQ = 'Q1';
        if (month >= 10)               expectedQ = 'Q2';
        if (month === 1 || month === 2) expectedQ = 'Q3';
        if (month >= 3 && month < 5)   expectedQ = 'Q4';
        if (expectedQ && !g.checkIns?.some(c => c.quarter === expectedQ)) {
          items.push({ type: 'checkin_missing', severity: 'medium',
            user: g.userId, goal: g.title, message: `${expectedQ} check-in missing for "${g.title}"`, quarter: expectedQ, goalId: g._id });
        }
      }
    }

    // Sort by severity
    const order = { high: 0, medium: 1, low: 2 };
    items.sort((a,b) => order[a.severity] - order[b.severity]);

    res.json({ success: true, data: items, total: items.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
