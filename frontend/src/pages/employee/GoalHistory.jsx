import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Download, FileSpreadsheet } from 'lucide-react';
import { useAuthStore } from '../../store';
import { StatusBadge, ProgressBar, SkeletonLoader, EmptyState } from '../../components/shared/index';
import { formatDate, calculateProgress, UOM_SHORT, downloadCSV, downloadExcel } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const FILTERS = [
  { key: 'all',       label: 'All Goals' },
  { key: 'approved',  label: 'Approved' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'draft',     label: 'Draft' },
  { key: 'rework',    label: 'Rework' },
  { key: 'rejected',  label: 'Rejected' },
];

export default function GoalHistory() {
  const { user }          = useAuthStore();
  const [allGoals, set]   = useState([]);
  const [loading, setL]   = useState(true);
  const [filter, setF]    = useState('all');
  const [search, setS]    = useState('');

  useEffect(() => {
    api.get('/goals')
      .then(r => { set(r.data.data || []); setL(false); })
      .catch(() => setL(false));
  }, []);

  const myGoals = allGoals.filter(g =>
    g.userId?._id === user?._id || g.userId === user?._id
  );

  const filtered = myGoals.filter(g => {
    const matchStatus = filter === 'all' || g.status === filter;
    const matchSearch = !search ||
      g.title?.toLowerCase().includes(search.toLowerCase()) ||
      g.thrustArea?.toLowerCase().includes(search.toLowerCase()) ||
      g.cycleId?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleExportCSV = () => {
    if (!filtered.length) return toast.error('No data to export');
    const rows = filtered.map(g => ({
      Title: g.title,
      'Thrust Area': g.thrustArea,
      'UoM Type': UOM_SHORT[g.uomType] || g.uomType,
      Target: g.target,
      'Weightage %': g.weightage,
      Status: g.status,
      'Progress %': g.progress || calculateProgress(g),
      Deadline: formatDate(g.deadline),
      Cycle: g.cycleId?.name || '—',
      'Q1 Achievement': g.checkIns?.find(c => c.quarter === 'Q1')?.achievement ?? '—',
      'Q2 Achievement': g.checkIns?.find(c => c.quarter === 'Q2')?.achievement ?? '—',
      'Q3 Achievement': g.checkIns?.find(c => c.quarter === 'Q3')?.achievement ?? '—',
      'Q4 Achievement': g.checkIns?.find(c => c.quarter === 'Q4')?.achievement ?? '—',
    }));
    downloadCSV(rows, 'my-goal-history');
    toast.success('CSV downloaded!');
  };

  const handleExportExcel = () => {
    if (!filtered.length) return toast.error('No data to export');
    const rows = filtered.map(g => ({
      Title: g.title,
      'Thrust Area': g.thrustArea,
      'UoM Type': UOM_SHORT[g.uomType] || g.uomType,
      Target: g.target,
      'Weightage %': g.weightage,
      Status: g.status,
      'Progress %': g.progress || calculateProgress(g),
      Deadline: formatDate(g.deadline),
      Cycle: g.cycleId?.name || '—',
    }));
    downloadExcel(rows, 'my-goal-history');
    toast.success('Excel downloaded!');
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Goal History</h1>
          <p className="page-subtitle">All your goals across cycles — searchable and exportable</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV}   className="btn-secondary text-sm"><Download className="w-4 h-4"/> CSV</button>
          <button onClick={handleExportExcel} className="btn-primary  text-sm"><FileSpreadsheet className="w-4 h-4"/> Excel</button>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex bg-surface-100 rounded-xl p-1 gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setF(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.key ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500 hover:text-surface-700'
              }`}>
              {f.label}
              <span className="ml-1 text-xs opacity-60">
                ({f.key === 'all' ? myGoals.length : myGoals.filter(g => g.status === f.key).length})
              </span>
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setS(e.target.value)}
          className="input max-w-xs" placeholder="Search goals, thrust area…" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Goals',    val: myGoals.length },
          { label: 'Approved',       val: myGoals.filter(g => g.status === 'approved').length },
          { label: 'Avg Progress',   val: myGoals.filter(g => g.status === 'approved').length
              ? `${Math.round(myGoals.filter(g=>g.status==='approved').reduce((s,g)=>s+(g.progress||0),0)/myGoals.filter(g=>g.status==='approved').length)}%` : '—' },
          { label: 'Cycles Covered', val: new Set(myGoals.map(g => g.cycleId?.name).filter(Boolean)).size },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-surface-900">{s.val}</p>
            <p className="text-xs text-surface-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? <SkeletonLoader rows={5} /> : filtered.length === 0 ? (
        <EmptyState icon={History} title="No goals found" description="Try changing the filter or search term" />
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-100 text-xs text-surface-400">
            {filtered.length} goal{filtered.length !== 1 ? 's' : ''} found
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  {['Goal', 'Thrust Area', 'UoM', 'Cycle', 'Weight', 'Status', 'Progress', 'Deadline'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {filtered.map((goal, i) => {
                  const progress = goal.progress || calculateProgress(goal);
                  return (
                    <motion.tr key={goal._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-surface-50 transition-colors">
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="text-sm font-medium text-surface-900 line-clamp-2">{goal.title}</p>
                        {goal.description && <p className="text-xs text-surface-400 mt-0.5 line-clamp-1">{goal.description}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <span className="badge bg-brand-50 text-brand-600 text-[10px] whitespace-nowrap">{goal.thrustArea}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-mono text-surface-600">{UOM_SHORT[goal.uomType] || goal.uomType}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-surface-500 whitespace-nowrap">{goal.cycleId?.name || '—'}</td>
                      <td className="px-4 py-4 text-center font-bold text-surface-900">{goal.weightage}%</td>
                      <td className="px-4 py-4"><StatusBadge status={goal.status} /></td>
                      <td className="px-4 py-4 w-32"><ProgressBar value={progress} size="sm" /></td>
                      <td className="px-4 py-4 text-xs text-surface-500 whitespace-nowrap">{formatDate(goal.deadline)}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
