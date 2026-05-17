import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Send, Lock, AlertCircle, ChevronDown, ChevronUp, X, Check, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useGoalsStore, useAuthStore } from '../../store';
import { StatusBadge, ProgressBar, EmptyState, SkeletonLoader } from '../../components/shared/index';
import CheckInScheduleBanner from '../../components/shared/CheckInScheduleBanner';
import { cn, formatDate, THRUST_AREAS, UOM_LABELS, UOM_SHORT, calculateProgress, isOverdue } from '../../utils/helpers';
import toast from 'react-hot-toast';

// BRD Section 2.2 — UoM guide tooltip
const UOM_GUIDE = {
  numeric_min: { eg: 'Sales Revenue, NPS Score, Feature Count',    formula: 'Achievement ÷ Target × 100', direction: '↑ Higher is Better' },
  numeric_max: { eg: 'TAT, Cost, Bug Count, Response Time',        formula: 'Target ÷ Achievement × 100', direction: '↓ Lower is Better' },
  timeline:    { eg: 'Project Delivery, Certification Completion', formula: 'Completion Date vs Deadline', direction: '📅 Date-based' },
  zero:        { eg: 'Safety Incidents, System Outages, Escapes',  formula: 'Achievement = 0 → 100%, else 0%', direction: '○ Zero = Success' },
};

function GoalForm({ onSubmit, onCancel, initialData, currentTotalWeight, isEdit }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: initialData || {
      thrustArea: '', title: '', description: '',
      uomType: 'numeric_min', target: '', weightage: '', deadline: '',
    },
  });
  const weightage = watch('weightage');
  const uomType   = watch('uomType');
  const guide     = UOM_GUIDE[uomType] || UOM_GUIDE.numeric_min;
  const newTotal  = isEdit
    ? currentTotalWeight - (initialData?.weightage || 0) + Number(weightage || 0)
    : currentTotalWeight + Number(weightage || 0);

  return (
    <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
      className="card p-6 mb-6 border-2 border-brand-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-surface-900">{isEdit ? 'Edit Goal' : 'Add New Goal'}</h3>
        <button onClick={onCancel} className="btn-ghost p-1.5"><X className="w-4 h-4"/></button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Thrust Area *</label>
            <select className="input" {...register('thrustArea', { required: true })}>
              <option value="">Select thrust area</option>
              {THRUST_AREAS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.thrustArea && <p className="text-xs text-danger-500 mt-1">Required</p>}
          </div>

          <div>
            <label className="label">UoM Type * <span className="text-surface-400 font-normal">(BRD §2.2)</span></label>
            <select className="input" {...register('uomType', { required: true })}>
              {Object.entries(UOM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* UoM Guide box */}
        <div className="flex gap-2 p-3 rounded-xl bg-brand-50 border border-brand-100 text-xs text-brand-700">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5"/>
          <div>
            <span className="font-semibold">{guide.direction}</span>
            <span className="mx-2 text-brand-400">·</span>
            <span>Formula: <code className="font-mono bg-brand-100 px-1 rounded">{guide.formula}</code></span>
            <span className="mx-2 text-brand-400">·</span>
            <span>e.g. {guide.eg}</span>
          </div>
        </div>

        <div>
          <label className="label">Goal Title *</label>
          <input className="input" placeholder="e.g. Increase Customer NPS to 70+" {...register('title', { required: true })}/>
          {errors.title && <p className="text-xs text-danger-500 mt-1">Required</p>}
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={2} placeholder="What does success look like? How will it be measured?" {...register('description')}/>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Target Value *</label>
            <input type="number" className="input" placeholder="e.g. 100" step="any" {...register('target', { required: true, min: 0 })}/>
            {errors.target && <p className="text-xs text-danger-500 mt-1">Required, ≥ 0</p>}
          </div>
          <div>
            <label className="label">Weightage (%) * <span className="text-surface-400 font-normal">min 10%</span></label>
            <input type="number" className="input" placeholder="10–100" {...register('weightage', { required: true, min: 10, max: 100 })}/>
            {errors.weightage && <p className="text-xs text-danger-500 mt-1">Min 10%, max 100%</p>}
            {weightage && (
              <p className={cn('text-xs mt-1 font-medium', newTotal > 100 ? 'text-danger-500' : newTotal === 100 ? 'text-success-600' : 'text-surface-400')}>
                Total after: {newTotal}%
              </p>
            )}
          </div>
          <div>
            <label className="label">Deadline *</label>
            <input type="date" className="input" {...register('deadline', { required: true })}/>
            {errors.deadline && <p className="text-xs text-danger-500 mt-1">Required</p>}
          </div>
        </div>

        {newTotal > 100 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-400/10 text-danger-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0"/>
            Total weightage cannot exceed 100%. Reduce by {newTotal - 100}%.
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={newTotal > 100} className={cn('btn-primary', newTotal > 100 && 'opacity-40 cursor-not-allowed')}>
            <Check className="w-4 h-4"/> {isEdit ? 'Update Goal' : 'Add Goal'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </motion.div>
  );
}

export default function GoalSheet() {
  const { goals, loading, fetchGoals, createGoal, updateGoal, deleteGoal, submitGoals, activeCycle, fetchActiveCycle } = useGoalsStore();
  const { user } = useAuthStore();
  const [showForm, setShowForm]     = useState(false);
  const [editingGoal, setEditing]   = useState(null);
  const [expanded, setExpanded]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActiveCycle().then(c => { if (c) fetchGoals({ cycleId: c._id }); });
  }, []);

  const myGoals     = goals.filter(g => g.userId?._id === user?._id || g.userId === user?._id);
  const totalWeight = myGoals.filter(g => g.status !== 'rejected').reduce((s,g) => s+g.weightage, 0);
  const draftGoals  = myGoals.filter(g => g.status === 'draft');
  const canSubmit   = draftGoals.length > 0 && totalWeight === 100;
  const canAddMore  = myGoals.filter(g => g.status !== 'rejected').length < 8;

  const handleCreate = async (data) => {
    if (!activeCycle) return toast.error('No active cycle');
    try {
      await createGoal({ ...data, cycleId: activeCycle._id });
      toast.success('Goal added!'); setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create goal'); }
  };

  const handleUpdate = async (data) => {
    try {
      await updateGoal(editingGoal._id, data);
      toast.success('Goal updated!'); setEditing(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try { await deleteGoal(id); toast.success('Goal deleted'); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await submitGoals(activeCycle._id);
      toast.success('🎯 Goal sheet submitted for manager approval!');
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">My Goal Sheet</h1>
          <p className="page-subtitle">{activeCycle?.name} · Create, manage and submit your annual goals</p>
        </div>
        <div className="flex gap-3">
          {canAddMore && !showForm && !editingGoal && (
            <button onClick={() => setShowForm(true)} className="btn-secondary">
              <Plus className="w-4 h-4"/> Add Goal
            </button>
          )}
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            className={cn('btn-primary', (!canSubmit || submitting) && 'opacity-50 cursor-not-allowed')}>
            <Send className="w-4 h-4"/> {submitting ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </div>
      </div>

      {/* Check-in schedule */}
      <CheckInScheduleBanner />

      {/* Weightage progress */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-medium text-surface-700">Total Weightage</span>
            <span className="badge bg-surface-100 text-surface-500 text-xs ml-2">
              {myGoals.filter(g=>g.status!=='rejected').length} / 8 goals
            </span>
          </div>
          <span className={cn('text-xl font-display font-bold',
            totalWeight===100?'text-success-600':totalWeight>100?'text-danger-600':'text-surface-700')}>
            {totalWeight}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden">
          <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(totalWeight,100)}%` }} transition={{ duration:0.8 }}
            className={cn('h-full rounded-full', totalWeight===100?'bg-success-500':totalWeight>100?'bg-danger-500':'bg-brand-500')}/>
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-surface-400">
          <span className="flex items-center gap-4">
            <span>Validation Rules (BRD §2.1):</span>
            <span className={totalWeight>=100?'text-success-600 font-medium':'text-surface-400'}>✓ Total = 100%</span>
            <span>✓ Min 10% per goal</span>
            <span>✓ Max 8 goals</span>
          </span>
          <span className={totalWeight===100?'text-success-600 font-medium':'text-warning-600'}>
            {totalWeight===100?'✓ Ready to submit':`${100-totalWeight}% remaining`}
          </span>
        </div>
        {!canAddMore && <p className="text-xs text-warning-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Maximum 8 goals per cycle reached</p>}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && !editingGoal && (
          <GoalForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} currentTotalWeight={totalWeight} isEdit={false}/>
        )}
      </AnimatePresence>

      {/* Goals list */}
      {loading ? <SkeletonLoader rows={4}/> : myGoals.length===0 ? (
        <EmptyState icon={Plus} title="No goals yet"
          description="Add up to 8 goals with a total weightage of exactly 100% (min 10% per goal)"
          action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4"/> Add Your First Goal</button>}/>
      ) : (
        <div className="space-y-3">
          {myGoals.map((goal, i) => {
            const progress  = goal.progress || calculateProgress(goal);
            const isExpanded = expanded === goal._id;
            const isEditing  = editingGoal?._id === goal._id;
            const canEdit    = !goal.isLocked && ['draft','rework'].includes(goal.status);

            return (
              <motion.div key={goal._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                className="card overflow-hidden">
                {isEditing ? (
                  <div className="p-4">
                    <GoalForm onSubmit={handleUpdate} onCancel={() => setEditing(null)}
                      initialData={{ ...goal, uomType: goal.uomType || 'numeric_min', deadline: goal.deadline?.slice(0,10) }}
                      currentTotalWeight={totalWeight} isEdit={true}/>
                  </div>
                ) : (
                  <>
                    <div className="p-4 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <StatusBadge status={goal.status}/>
                          {goal.isLocked && <span className="badge bg-surface-100 text-surface-500 text-[10px]"><Lock className="w-3 h-3 mr-0.5"/> Locked</span>}
                          <span className="badge bg-brand-50 text-brand-600 text-[10px]">{goal.thrustArea}</span>
                          <span className="badge bg-surface-100 text-surface-500 text-[10px]">{UOM_SHORT[goal.uomType] || goal.uomType}</span>
                        </div>
                        <h3 className="font-semibold text-surface-900 mb-1">{goal.title}</h3>
                        {goal.description && <p className="text-xs text-surface-400 mb-2 line-clamp-1">{goal.description}</p>}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-surface-400">
                          <span>Target: <strong className="text-surface-700">{goal.target}</strong></span>
                          <span>Deadline: <strong className="text-surface-700">{formatDate(goal.deadline)}</strong></span>
                          {isOverdue(goal.deadline) && <span className="text-danger-500 font-medium">⚠️ Overdue</span>}
                        </div>
                        {goal.status === 'approved' && <div className="mt-2"><ProgressBar value={progress} size="sm"/></div>}
                        {(goal.managerComment || goal.rejectionReason) && (
                          <div className="mt-2 p-2.5 rounded-lg bg-surface-50 border border-surface-100 text-xs text-surface-600">
                            <span className="font-medium">Manager: </span>
                            {goal.managerComment || goal.rejectionReason}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="text-right mr-3">
                          <p className="text-2xl font-display font-bold text-surface-900">{goal.weightage}%</p>
                          <p className="text-[10px] text-surface-400">weight</p>
                        </div>
                        {canEdit && (
                          <>
                            <button onClick={() => setEditing(goal)} className="btn-ghost p-2"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => handleDelete(goal._id)} className="btn-ghost p-2 text-danger-500 hover:bg-danger-50"><Trash2 className="w-4 h-4"/></button>
                          </>
                        )}
                        <button onClick={() => setExpanded(isExpanded ? null : goal._id)} className="btn-ghost p-2">
                          {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }} className="overflow-hidden border-t border-surface-100">
                          <div className="p-4 bg-surface-50">
                            <p className="text-xs font-semibold text-surface-500 uppercase tracking-widest mb-3">Check-in History</p>
                            {!goal.checkIns?.length
                              ? <p className="text-xs text-surface-400">No check-ins yet</p>
                              : <div className="grid sm:grid-cols-2 gap-3">
                                  {goal.checkIns.map(ci => (
                                    <div key={ci.quarter} className="bg-white rounded-xl p-3 border border-surface-100">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-brand-600">{ci.quarter}</span>
                                        <StatusBadge status={ci.status} size="xs"/>
                                      </div>
                                      <p className="text-sm font-semibold">Achievement: <span className="text-brand-600">{ci.achievement}</span></p>
                                      <p className="text-xs text-surface-400 mt-0.5">Target: {goal.target} · UoM: {UOM_SHORT[goal.uomType]}</p>
                                      {ci.notes && <p className="text-xs text-surface-500 mt-1 border-t border-surface-50 pt-1">{ci.notes}</p>}
                                      {ci.managerFeedback && <p className="text-xs text-purple-600 mt-1 italic">💬 {ci.managerFeedback}</p>}
                                    </div>
                                  ))}
                                </div>
                            }
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
