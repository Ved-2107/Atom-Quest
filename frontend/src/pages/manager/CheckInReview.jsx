// CheckInReview.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, MessageSquare, Save } from 'lucide-react';
import { useGoalsStore } from '../../store';
import { StatusBadge, ProgressBar, SkeletonLoader, EmptyState } from '../../components/shared/index';
import { cn, QUARTERS, calculateProgress } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function CheckInReview() {
  const { goals, loading, fetchGoals, activeCycle, fetchActiveCycle } = useGoalsStore();
  const [activeQ, setActiveQ] = useState('Q2');
  const [feedback, setFeedback] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    fetchActiveCycle().then(c => { if (c) fetchGoals({ cycleId: c._id }); });
  }, []);

  const approvedGoals = goals.filter(g => g.status === 'approved');

  const getCheckIn = (goal) => goal.checkIns?.find(c => c.quarter === activeQ);

  const handleSaveFeedback = async (goalId) => {
    const fb = feedback[goalId];
    if (!fb) return;
    setSaving(p => ({ ...p, [goalId]: true }));
    try {
      await api.post(`/check-ins/${goalId}/feedback`, { quarter: activeQ, feedback: fb });
      toast.success('Feedback saved!');
    } catch { toast.error('Failed to save feedback'); }
    finally { setSaving(p => ({ ...p, [goalId]: false })); }
  };

  const Q_COLORS = { Q1: 'bg-brand-50 text-brand-700 border-brand-200', Q2: 'bg-purple-50 text-purple-700 border-purple-200',
    Q3: 'bg-warning-400/10 text-warning-600 border-warning-400/30', Q4: 'bg-success-400/10 text-success-700 border-success-400/30' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Check-in Review</h1>
        <p className="page-subtitle">Review quarterly progress and add structured feedback</p>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setActiveQ(q)}
            className={cn('px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all',
              activeQ === q ? Q_COLORS[q] : 'bg-white border-surface-100 text-surface-500')}>
            {q}
          </button>
        ))}
      </div>

      {loading ? <SkeletonLoader rows={4} /> : approvedGoals.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No approved goals" description="Goals need to be approved before check-ins are available" />
      ) : (
        <div className="space-y-4">
          {approvedGoals.map((goal, i) => {
            const ci = getCheckIn(goal);
            const progress = goal.progress || calculateProgress(goal);
            return (
              <motion.div key={goal._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge bg-surface-100 text-surface-600 text-xs">{goal.userId?.name}</span>
                      <span className="badge bg-brand-50 text-brand-600 text-[10px]">{goal.thrustArea}</span>
                    </div>
                    <h3 className="font-semibold text-surface-900">{goal.title}</h3>
                    <p className="text-xs text-surface-400 mt-0.5">Target: {goal.target} · Weight: {goal.weightage}%</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-display font-bold text-surface-900">{progress}%</p>
                    <p className="text-[10px] text-surface-400">overall</p>
                  </div>
                </div>

                <ProgressBar value={progress} size="md" className="mb-4" />

                {ci ? (
                  <div className="grid sm:grid-cols-3 gap-3 p-3 rounded-xl bg-surface-50 mb-4">
                    <div>
                      <p className="text-[10px] text-surface-400 uppercase tracking-wide">Achievement</p>
                      <p className="font-bold text-surface-900">{ci.achievement}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-surface-400 uppercase tracking-wide">Status</p>
                      <StatusBadge status={ci.status} />
                    </div>
                    <div>
                      <p className="text-[10px] text-surface-400 uppercase tracking-wide">Employee Notes</p>
                      <p className="text-xs text-surface-600 line-clamp-2">{ci.notes || '—'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-50 mb-4 text-xs text-surface-400 text-center">
                    No check-in submitted for {activeQ}
                  </div>
                )}

                <div className="flex gap-3">
                  <textarea value={feedback[goal._id] || ci?.managerFeedback || ''}
                    onChange={e => setFeedback(p => ({ ...p, [goal._id]: e.target.value }))}
                    className="input flex-1 resize-none text-sm" rows={2}
                    placeholder={`Add your ${activeQ} feedback for ${goal.userId?.name}...`} />
                  <button onClick={() => handleSaveFeedback(goal._id)} disabled={saving[goal._id] || !feedback[goal._id]}
                    className={cn('btn-primary flex-shrink-0', (!feedback[goal._id]) && 'opacity-40 cursor-not-allowed')}>
                    {saving[goal._id] ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
