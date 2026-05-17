import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Save, CheckCircle2, Info } from 'lucide-react';
import { useGoalsStore, useAuthStore } from '../../store';
import { StatusBadge, ProgressBar, SkeletonLoader, EmptyState } from '../../components/shared/index';
import CheckInScheduleBanner from '../../components/shared/CheckInScheduleBanner';
import { cn, QUARTERS, CHECK_IN_STATUSES, calculateProgress, UOM_SHORT, getCurrentPhase } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Q_STYLE = {
  Q1: { active:'bg-brand-600 text-white border-brand-600',   inactive:'bg-white border-surface-200 text-surface-500', card:'bg-brand-50 border-brand-200 text-brand-700' },
  Q2: { active:'bg-purple-600 text-white border-purple-600', inactive:'bg-white border-surface-200 text-surface-500', card:'bg-purple-50 border-purple-200 text-purple-700' },
  Q3: { active:'bg-orange-600 text-white border-orange-600', inactive:'bg-white border-surface-200 text-surface-500', card:'bg-orange-50 border-orange-200 text-orange-700' },
  Q4: { active:'bg-green-600 text-white border-green-600',   inactive:'bg-white border-surface-200 text-surface-500', card:'bg-green-50 border-green-200 text-green-700' },
};

export default function QuarterlyUpdates() {
  const { goals, loading, fetchGoals, updateCheckIn, activeCycle, fetchActiveCycle } = useGoalsStore();
  const { user } = useAuthStore();
  const [activeQ, setActiveQ] = useState(getCurrentPhase() === 'Goal Setting' ? 'Q1' : getCurrentPhase());
  const [edits, setEdits]   = useState({});   // key: `${goalId}-${quarter}`
  const [saving, setSaving] = useState({});

  useEffect(() => {
    fetchActiveCycle().then(c => {
      if (c) fetchGoals({ cycleId: c._id });
    });
  }, []);

  // Only show approved goals belonging to this employee
  const approvedGoals = goals.filter(g =>
    g.status === 'approved' &&
    (g.userId?._id === user?._id || g.userId === user?._id || String(g.userId) === String(user?._id))
  );

  const getSaved  = (goal, q) => goal.checkIns?.find(c => c.quarter === q) || { quarter: q, achievement: '', status: 'not_started', notes: '' };
  const getCurrent = (goal, q) => edits[`${goal._id}-${q}`] || getSaved(goal, q);
  const isDirty   = (goal, q) => !!edits[`${goal._id}-${q}`];

  const handleEdit = (goalId, quarter, field, value) => {
    const key = `${goalId}-${quarter}`;
    const goal = approvedGoals.find(g => g._id === goalId);
    const base = getSaved(goal, quarter);
    setEdits(prev => ({ ...prev, [key]: { ...base, ...prev[key], [field]: value } }));
  };

  const handleSave = async (goal, quarter) => {
    const key  = `${goal._id}-${quarter}`;
    const data = edits[key];
    if (!data) return;
    setSaving(p => ({ ...p, [key]: true }));
    try {
      await updateCheckIn(goal._id, {
        quarter,
        achievement: Number(data.achievement) || 0,
        status:      data.status || 'not_started',
        notes:       data.notes  || '',
      });
      toast.success(`${quarter} check-in saved!`);
      setEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save check-in');
    } finally {
      setSaving(p => ({ ...p, [key]: false }));
    }
  };

  const completedThisQ = approvedGoals.filter(g => g.checkIns?.find(c => c.quarter === activeQ)?.status === 'completed').length;
  const submittedThisQ = approvedGoals.filter(g => g.checkIns?.some(c => c.quarter === activeQ)).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quarterly Check-ins</h1>
        <p className="page-subtitle">Update your achievement progress for each quarter — BRD §2.3</p>
      </div>

      <CheckInScheduleBanner />

      {/* Quarter selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setActiveQ(q)}
            className={cn('px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all',
              activeQ === q ? Q_STYLE[q].active : Q_STYLE[q].inactive)}>
            {q}
            {activeQ === q && approvedGoals.length > 0 && (
              <span className="ml-2 text-xs opacity-80">
                {submittedThisQ}/{approvedGoals.length} updated
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {approvedGoals.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label:'Not Started', count: approvedGoals.filter(g => { const c=getCurrent(g,activeQ); return (c.status||'not_started')==='not_started'; }).length, color:'text-surface-500 bg-surface-50' },
            { label:'On Track',    count: approvedGoals.filter(g => getCurrent(g,activeQ).status==='on_track').length,   color:'text-brand-600 bg-brand-50' },
            { label:'Completed',   count: approvedGoals.filter(g => getCurrent(g,activeQ).status==='completed').length,  color:'text-success-600 bg-success-400/10' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-2xl p-4 text-center', s.color)}>
              <p className="text-2xl font-display font-bold">{s.count}</p>
              <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? <SkeletonLoader rows={3}/> : approvedGoals.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No approved goals"
          description="Your goals need to be approved by your manager before you can add quarterly check-ins." />
      ) : (
        <div className="space-y-4">
          {approvedGoals.map((goal, i) => {
            const current  = getCurrent(goal, activeQ);
            const saved    = getSaved(goal, activeQ);
            const dirty    = isDirty(goal, activeQ);
            const progress = goal.progress || calculateProgress(goal);
            const key      = `${goal._id}-${activeQ}`;

            return (
              <motion.div key={goal._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                className="card overflow-hidden">
                {/* Goal header */}
                <div className="p-5 border-b border-surface-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn('badge border text-[10px]', Q_STYLE[activeQ].card)}>{activeQ}</span>
                        <span className="badge bg-surface-100 text-surface-500 text-[10px]">{UOM_SHORT[goal.uomType] || goal.uomType}</span>
                        <span className="badge bg-brand-50 text-brand-600 text-[10px]">{goal.thrustArea}</span>
                      </div>
                      <h3 className="font-semibold text-surface-900">{goal.title}</h3>
                      <p className="text-xs text-surface-400 mt-0.5">Target: <strong className="text-surface-700">{goal.target}</strong> · Weight: <strong className="text-surface-700">{goal.weightage}%</strong></p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-display font-bold text-surface-900">{progress}%</p>
                      <p className="text-[10px] text-surface-400">overall progress</p>
                    </div>
                  </div>
                  <div className="mt-3"><ProgressBar value={progress} size="md"/></div>
                </div>

                {/* Check-in form */}
                <div className="p-5 bg-surface-50/50">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label text-xs">Achievement Value *</label>
                      <input type="number" step="any"
                        value={current.achievement ?? ''}
                        onChange={e => handleEdit(goal._id, activeQ, 'achievement', e.target.value)}
                        className="input text-sm"
                        placeholder={`Target: ${goal.target}`}/>
                      <p className="text-[10px] text-surface-400 mt-1">UoM: {UOM_SHORT[goal.uomType]} — enter actual value</p>
                    </div>
                    <div>
                      <label className="label text-xs">Status *</label>
                      <select value={current.status || 'not_started'}
                        onChange={e => handleEdit(goal._id, activeQ, 'status', e.target.value)}
                        className="input text-sm">
                        {CHECK_IN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={() => handleSave(goal, activeQ)}
                        disabled={!dirty || saving[key]}
                        className={cn('btn-primary w-full justify-center', (!dirty || saving[key]) && 'opacity-40 cursor-not-allowed')}>
                        {saving[key]
                          ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>
                          : <Save className="w-4 h-4"/>}
                        {saving[key] ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="label text-xs">Notes / Comments</label>
                    <textarea value={current.notes || ''}
                      onChange={e => handleEdit(goal._id, activeQ, 'notes', e.target.value)}
                      className="input resize-none text-sm" rows={2}
                      placeholder={`Describe your ${activeQ} achievements and challenges…`}/>
                  </div>

                  {saved.managerFeedback && (
                    <div className="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-700">
                      💬 <span className="font-semibold">Manager Feedback:</span> {saved.managerFeedback}
                    </div>
                  )}

                  {dirty && (
                    <p className="text-xs text-warning-600 mt-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning-500 inline-block animate-pulse"/>
                      Unsaved changes — click Save to persist
                    </p>
                  )}

                  {!dirty && saved.achievement !== undefined && saved.achievement !== '' && (
                    <p className="text-xs text-success-600 mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3"/> Saved — Achievement: {saved.achievement}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
