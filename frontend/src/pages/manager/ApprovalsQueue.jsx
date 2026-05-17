import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, X, RotateCcw, ChevronDown, ChevronUp, MessageSquare, Edit2, Check } from 'lucide-react';
import { useGoalsStore, useAuthStore } from '../../store';
import { StatusBadge, SkeletonLoader, EmptyState, ProgressBar } from '../../components/shared/index';
import { cn, formatDate, UOM_LABELS, calculateProgress } from '../../utils/helpers';
import toast from 'react-hot-toast';

function ApprovalModal({ goal, onApprove, onReject, onReturn, onClose }) {
  const [comment, setComment] = useState(goal.managerComment || '');
  const [targetEdit, setTargetEdit] = useState(goal.target);
  const [weightageEdit, setWeightageEdit] = useState(goal.weightage);
  const [rejectReason, setRejectReason] = useState('');
  const [action, setAction] = useState(null);

  const handleAction = async (type) => {
    setAction(type);
    try {
      if (type === 'approve') await onApprove(goal._id, { comment, target: Number(targetEdit), weightage: Number(weightageEdit) });
      else if (type === 'reject') await onReject(goal._id, { reason: rejectReason, returnForRework: false });
      else await onReject(goal._id, { reason: rejectReason, returnForRework: true });
      onClose();
    } finally { setAction(null); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h3 className="font-display font-bold text-surface-900">Review Goal</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="p-4 rounded-2xl bg-surface-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-brand-50 text-brand-600">{goal.thrustArea}</span>
              <span className="badge bg-surface-100 text-surface-500">{UOM_LABELS[goal.uomType]?.split(' ')[0]}</span>
            </div>
            <h4 className="font-semibold text-surface-900 mb-1">{goal.title}</h4>
            {goal.description && <p className="text-sm text-surface-500 mb-3">{goal.description}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded-xl p-3 border border-surface-100">
                <p className="text-xs text-surface-400 mb-0.5">Employee</p>
                <p className="font-medium">{goal.userId?.name}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-surface-100">
                <p className="text-xs text-surface-400 mb-0.5">Deadline</p>
                <p className="font-medium">{formatDate(goal.deadline)}</p>
              </div>
            </div>
          </div>

          {/* Inline editable fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-xs">Target (editable)</label>
              <input type="number" value={targetEdit} onChange={e => setTargetEdit(e.target.value)}
                className="input text-sm" />
            </div>
            <div>
              <label className="label text-xs">Weightage % (editable)</label>
              <input type="number" value={weightageEdit} onChange={e => setWeightageEdit(e.target.value)}
                className="input text-sm" min={10} max={100} />
            </div>
          </div>

          <div>
            <label className="label text-xs">Manager Comment / Feedback</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              className="input resize-none text-sm" rows={3}
              placeholder="Add your feedback or approval notes..." />
          </div>

          <div>
            <label className="label text-xs">Rejection / Return Reason (if applicable)</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="input resize-none text-sm" rows={2}
              placeholder="Reason for rejection or returning for rework..." />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-surface-100 flex gap-3">
          <button onClick={() => handleAction('approve')} disabled={!!action}
            className="btn-primary flex-1 justify-center bg-success-500 hover:bg-success-600">
            {action === 'approve' ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Check className="w-4 h-4" />}
            Approve
          </button>
          <button onClick={() => handleAction('return')} disabled={!!action}
            className="btn-secondary flex-1 justify-center">
            {action === 'return' ? <span className="animate-spin w-4 h-4 border-2 border-surface-400 border-t-transparent rounded-full" /> : <RotateCcw className="w-4 h-4" />}
            Return
          </button>
          <button onClick={() => handleAction('reject')} disabled={!!action}
            className="flex-1 justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-danger-50 text-danger-600 font-medium text-sm hover:bg-danger-100 transition-all">
            {action === 'reject' ? <span className="animate-spin w-4 h-4 border-2 border-danger-400 border-t-transparent rounded-full" /> : <X className="w-4 h-4" />}
            Reject
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ApprovalsQueue() {
  const { goals, loading, fetchGoals, approveGoal, rejectGoal, activeCycle, fetchActiveCycle } = useGoalsStore();
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('submitted');

  useEffect(() => {
    fetchActiveCycle().then(c => { if (c) fetchGoals({ cycleId: c._id }); });
  }, []);

  const pendingGoals = goals.filter(g => {
    const matchStatus = filter === 'all' ? true : g.status === filter;
    const matchSearch = !search || g.title?.toLowerCase().includes(search.toLowerCase()) ||
      g.userId?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const groupedByEmployee = pendingGoals.reduce((acc, g) => {
    const key = g.userId?._id?.toString() || 'unknown';
    if (!acc[key]) acc[key] = { user: g.userId, goals: [] };
    acc[key].goals.push(g);
    return acc;
  }, {});

  const handleApprove = async (id, payload) => {
    await approveGoal(id, payload);
    toast.success('✅ Goal approved and locked!');
  };

  const handleReject = async (id, payload) => {
    await rejectGoal(id, payload);
    toast.success(payload.returnForRework ? '↩️ Goal returned for rework' : '❌ Goal rejected');
  };

  const FILTERS = [
    { key: 'submitted', label: 'Pending', count: goals.filter(g => g.status === 'submitted').length },
    { key: 'approved', label: 'Approved', count: goals.filter(g => g.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: goals.filter(g => g.status === 'rejected').length },
    { key: 'all', label: 'All', count: goals.length },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Approvals Queue</h1>
        <p className="page-subtitle">Review, edit and approve employee goal sheets</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex bg-surface-100 rounded-xl p-1 gap-1">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                filter === f.key ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500 hover:text-surface-700')}>
              {f.label}
              <span className={cn('ml-1.5 text-xs px-1.5 py-0.5 rounded-full', filter === f.key ? 'bg-brand-100 text-brand-700' : 'bg-surface-200 text-surface-500')}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input max-w-xs" placeholder="Search employee or goal..." />
      </div>

      {loading ? <SkeletonLoader rows={4} /> : Object.keys(groupedByEmployee).length === 0 ? (
        <EmptyState icon={CheckSquare} title="No goals to review"
          description={filter === 'submitted' ? 'All pending goals have been reviewed' : 'No goals match this filter'} />
      ) : (
        <div className="space-y-6">
          {Object.values(groupedByEmployee).map(({ user: emp, goals: empGoals }) => {
            const totalWeight = empGoals.reduce((s, g) => s + g.weightage, 0);
            return (
              <div key={emp?._id} className="card overflow-hidden">
                {/* Employee header */}
                <div className="flex items-center justify-between px-5 py-4 bg-surface-50 border-b border-surface-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
                      {emp?.name?.split(' ').map(n => n[0]).join('').slice(0,2) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900">{emp?.name || 'Unknown'}</p>
                      <p className="text-xs text-surface-400">{emp?.department} · {emp?.designation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-surface-400">Total Weightage</p>
                      <p className={cn('font-bold text-sm', totalWeight === 100 ? 'text-success-600' : 'text-warning-600')}>{totalWeight}%</p>
                    </div>
                    <span className={cn('badge', totalWeight === 100 ? 'bg-success-400/10 text-success-600' : 'bg-warning-400/10 text-warning-600')}>
                      {empGoals.length} goals
                    </span>
                  </div>
                </div>

                {/* Goals */}
                <div className="divide-y divide-surface-50">
                  {empGoals.map(goal => (
                    <motion.div key={goal._id} layout className="p-4 hover:bg-surface-50/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <StatusBadge status={goal.status} />
                            <span className="badge bg-brand-50 text-brand-600 text-[10px]">{goal.thrustArea}</span>
                            <span className="badge bg-surface-100 text-surface-500 text-[10px]">{UOM_LABELS[goal.uomType]?.split(' ')[0]}</span>
                          </div>
                          <p className="font-medium text-surface-900 mb-1">{goal.title}</p>
                          {goal.description && <p className="text-xs text-surface-400 mb-2 line-clamp-2">{goal.description}</p>}
                          <div className="flex flex-wrap gap-3 text-xs text-surface-400">
                            <span>Target: <strong className="text-surface-700">{goal.target}</strong></span>
                            <span>Weight: <strong className="text-surface-700">{goal.weightage}%</strong></span>
                            <span>Deadline: <strong className="text-surface-700">{formatDate(goal.deadline)}</strong></span>
                          </div>
                          {goal.managerComment && (
                            <div className="mt-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-1.5">
                              💬 {goal.managerComment}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {goal.status === 'submitted' && (
                            <button onClick={() => setSelectedGoal(goal)} className="btn-primary text-sm px-4 py-2">
                              <Edit2 className="w-3.5 h-3.5" /> Review
                            </button>
                          )}
                          {goal.status === 'approved' && (
                            <span className="badge bg-success-400/10 text-success-600 px-3 py-1.5">✓ Approved</span>
                          )}
                          {goal.status === 'rejected' && (
                            <span className="badge bg-danger-400/10 text-danger-600 px-3 py-1.5">✗ Rejected</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Bulk approve all submitted goals for this employee */}
                {empGoals.some(g => g.status === 'submitted') && (
                  <div className="px-5 py-3 bg-surface-50 border-t border-surface-100 flex items-center justify-between">
                    <p className="text-xs text-surface-500">
                      {empGoals.filter(g => g.status === 'submitted').length} goals awaiting approval
                    </p>
                    <div className="flex gap-2">
                      {empGoals.filter(g => g.status === 'submitted').map(g => (
                        <button key={g._id} onClick={() => setSelectedGoal(g)} className="text-xs btn-ghost text-brand-600 px-3 py-1.5">
                          Review "{g.title.slice(0,20)}..."
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedGoal && (
          <ApprovalModal goal={selectedGoal} onApprove={handleApprove} onReject={handleReject}
            onReturn={handleReject} onClose={() => setSelectedGoal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
