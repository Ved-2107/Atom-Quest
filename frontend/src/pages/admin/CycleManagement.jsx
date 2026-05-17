import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Plus, Calendar, CheckCircle, AlertCircle, X, Edit2 } from 'lucide-react';
import { formatDate, cn } from '../../utils/helpers';
import { EmptyState, SkeletonLoader } from '../../components/shared/index';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'bg-surface-100 text-surface-600' },
  active: { label: 'Active', color: 'bg-success-400/10 text-success-600' },
  closed: { label: 'Closed', color: 'bg-surface-100 text-surface-400' },
};

function CycleForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState(initial || {
    name: '', year: new Date().getFullYear(), startDate: '', endDate: '',
    submissionDeadline: '', status: 'active',
    quarters: [
      { name: 'Q1', startDate: '', endDate: '', checkInDeadline: '', isActive: false },
      { name: 'Q2', startDate: '', endDate: '', checkInDeadline: '', isActive: true },
      { name: 'Q3', startDate: '', endDate: '', checkInDeadline: '', isActive: false },
      { name: 'Q4', startDate: '', endDate: '', checkInDeadline: '', isActive: false },
    ]
  });

  const updateQ = (idx, field, val) => {
    const qs = [...form.quarters];
    qs[idx] = { ...qs[idx], [field]: val };
    setForm(f => ({ ...f, quarters: qs }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 flex-shrink-0">
          <h3 className="font-display font-bold text-surface-900">{initial ? 'Edit Cycle' : 'New Performance Cycle'}</h3>
          <button onClick={onCancel} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Cycle Name *</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. FY 2026-27" />
            </div>
            <div>
              <label className="label">Year *</label>
              <input type="number" className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input type="date" className="input" value={form.startDate?.slice(0,10) || ''}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input type="date" className="input" value={form.endDate?.slice(0,10) || ''}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Submission Deadline</label>
              <input type="date" className="input" value={form.submissionDeadline?.slice(0,10) || ''}
                onChange={e => setForm(f => ({ ...f, submissionDeadline: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <p className="label mb-3">Quarters</p>
            <div className="space-y-3">
              {form.quarters.map((q, i) => (
                <div key={q.name} className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-brand-600 text-sm">{q.name}</span>
                    <label className="flex items-center gap-1.5 ml-auto text-xs text-surface-500 cursor-pointer">
                      <input type="checkbox" checked={q.isActive} onChange={e => updateQ(i, 'isActive', e.target.checked)}
                        className="rounded" />
                      Active quarter
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-surface-400 mb-1 block">Start</label>
                      <input type="date" className="input text-sm" value={q.startDate?.slice(0,10) || ''}
                        onChange={e => updateQ(i, 'startDate', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-surface-400 mb-1 block">End</label>
                      <input type="date" className="input text-sm" value={q.endDate?.slice(0,10) || ''}
                        onChange={e => updateQ(i, 'endDate', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-surface-400 mb-1 block">Check-in Deadline</label>
                      <input type="date" className="input text-sm" value={q.checkInDeadline?.slice(0,10) || ''}
                        onChange={e => updateQ(i, 'checkInDeadline', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-surface-100 flex gap-3 flex-shrink-0">
          <button onClick={() => onSubmit(form)} className="btn-primary flex-1 justify-center">
            <CheckCircle className="w-4 h-4" /> {initial ? 'Update Cycle' : 'Create Cycle'}
          </button>
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CycleManagement() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    api.get('/cycles').then(r => { setCycles(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async (form) => {
    try {
      const r = await api.post('/cycles', form);
      setCycles(c => [r.data.data, ...c]);
      setShowForm(false);
      toast.success('Cycle created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleUpdate = async (form) => {
    try {
      const r = await api.put(`/cycles/${editing._id}`, form);
      setCycles(c => c.map(x => x._id === editing._id ? r.data.data : x));
      setEditing(null);
      toast.success('Cycle updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Cycle Management</h1>
          <p className="page-subtitle">Manage performance cycles and quarter schedules</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Cycle
        </button>
      </div>

      {loading ? <SkeletonLoader rows={3} /> : cycles.length === 0 ? (
        <EmptyState icon={Calendar} title="No cycles yet"
          description="Create your first performance cycle to get started"
          action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" />Create Cycle</button>} />
      ) : (
        <div className="space-y-4">
          {cycles.map((cycle, i) => (
            <motion.div key={cycle._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-display font-bold text-xl text-surface-900">{cycle.name}</h3>
                    <span className={cn('badge', STATUS_CONFIG[cycle.status]?.color)}>{STATUS_CONFIG[cycle.status]?.label}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-surface-400">
                    <span>📅 {formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}</span>
                    {cycle.submissionDeadline && <span>📤 Submission: {formatDate(cycle.submissionDeadline)}</span>}
                  </div>
                </div>
                <button onClick={() => setEditing(cycle)} className="btn-ghost p-2">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quarters */}
              <div className="grid grid-cols-4 gap-3">
                {cycle.quarters?.map(q => (
                  <div key={q.name} className={cn('p-3 rounded-xl border text-center',
                    q.isActive ? 'bg-brand-50 border-brand-200' : 'bg-surface-50 border-surface-100')}>
                    <p className={cn('font-bold text-sm mb-1', q.isActive ? 'text-brand-700' : 'text-surface-500')}>{q.name}</p>
                    {q.isActive && <span className="text-[10px] text-brand-500 font-medium">● Active</span>}
                    {q.startDate && <p className="text-[10px] text-surface-400 mt-1">{formatDate(q.startDate)}</p>}
                    {q.checkInDeadline && <p className="text-[10px] text-orange-500 mt-0.5">CI: {formatDate(q.checkInDeadline)}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && <CycleForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}
        {editing && <CycleForm onSubmit={handleUpdate} onCancel={() => setEditing(null)} initial={editing} />}
      </AnimatePresence>
    </div>
  );
}
