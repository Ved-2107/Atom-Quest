import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Download, RefreshCw, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SkeletonLoader, EmptyState } from '../../components/shared/index';
import { cn, downloadCSV, downloadExcel, QUARTERS } from '../../utils/helpers';
import { useGoalsStore } from '../../store';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Q_COLORS = {
  Q1: { active: 'bg-brand-600 text-white', inactive: 'bg-brand-50 text-brand-700 border-brand-200' },
  Q2: { active: 'bg-purple-600 text-white', inactive: 'bg-purple-50 text-purple-700 border-purple-200' },
  Q3: { active: 'bg-orange-600 text-white', inactive: 'bg-orange-50 text-orange-700 border-orange-200' },
  Q4: { active: 'bg-green-600 text-white', inactive: 'bg-green-50 text-green-700 border-green-200' },
};

const STATUS_ICON = {
  complete: <CheckCircle className="w-4 h-4 text-success-500" />,
  partial:  <Clock className="w-4 h-4 text-warning-500" />,
  pending:  <XCircle className="w-4 h-4 text-danger-400" />,
};

export default function CompletionDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeQ, setActiveQ] = useState('Q2');
  const { activeCycle, fetchActiveCycle } = useGoalsStore();

  const load = async () => {
    setLoading(true);
    const c = activeCycle || await fetchActiveCycle();
    try {
      const params = c ? { cycleId: c._id } : {};
      const r = await api.get('/analytics/completion', { params });
      setData(r.data.data);
    } catch { toast.error('Failed to load completion data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchActiveCycle().then(load); }, []);

  const handleExport = () => {
    if (!data) return;
    const rows = data.employees.map(e => ({
      Employee: e.user?.name, Department: e.user?.department,
      'Total Goals': e.totalGoals,
      'Q1 Submitted': e.checkInStatus?.Q1?.submitted || 0,
      'Q2 Submitted': e.checkInStatus?.Q2?.submitted || 0,
      'Q3 Submitted': e.checkInStatus?.Q3?.submitted || 0,
      'Q4 Submitted': e.checkInStatus?.Q4?.submitted || 0,
      'Overall Status': QUARTERS.every(q => e.checkInStatus?.[q]?.submitted === e.totalGoals) ? 'Complete' : 'Pending',
    }));
    downloadCSV(rows, 'completion-dashboard');
    toast.success('Exported!');
  };

  const summary = data?.summary?.[activeQ] || {};
  const barData = QUARTERS.map(q => ({
    quarter: q,
    complete: data?.summary?.[q]?.complete || 0,
    partial:  data?.summary?.[q]?.partial  || 0,
    pending:  data?.summary?.[q]?.pending  || 0,
  }));

  const getEmployeeStatus = (emp, q) => {
    const ci = emp.checkInStatus?.[q];
    if (!ci || ci.total === 0) return 'na';
    if (ci.submitted === ci.total) return 'complete';
    if (ci.submitted > 0)         return 'partial';
    return 'pending';
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Completion Dashboard</h1>
          <p className="page-subtitle">Real-time view of who has completed quarterly check-ins — BRD §4</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Refresh</button>
          <button onClick={handleExport} className="btn-primary"><Download className="w-4 h-4" /> Export</button>
        </div>
      </div>

      {/* Quarter selector */}
      <div className="flex gap-2 mb-6">
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setActiveQ(q)}
            className={cn('px-5 py-2 rounded-xl text-sm font-semibold border-2 transition-all',
              activeQ === q ? Q_COLORS[q].active : Q_COLORS[q].inactive + ' border-2')}>
            {q}
          </button>
        ))}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { key: 'complete', label: 'Fully Submitted', icon: CheckCircle, color: 'text-success-600 bg-success-400/10' },
          { key: 'partial',  label: 'Partially Done',  icon: Clock,        color: 'text-warning-600 bg-warning-400/10' },
          { key: 'pending',  label: 'Not Started',     icon: XCircle,      color: 'text-danger-600 bg-danger-400/10'   },
        ].map(({ key, label, icon: Icon, color }) => (
          <motion.div key={key} whileHover={{ y: -2 }} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-surface-500 uppercase tracking-wide">{label}</p>
                <p className="text-3xl font-display font-bold text-surface-900">
                  {loading ? '—' : summary[key] || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-surface-400">out of {summary.total || 0} employees</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mb-8">
        {/* Bar chart across quarters */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-surface-900 mb-1">All Quarters Overview</h3>
          <p className="text-xs text-surface-400 mb-4">Submission count per quarter</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Bar dataKey="complete" name="Complete" fill="#22c55e" radius={[4,4,0,0]} stackId="a" />
              <Bar dataKey="partial"  name="Partial"  fill="#f97316" radius={[0,0,0,0]} stackId="a" />
              <Bar dataKey="pending"  name="Pending"  fill="#ef4444" radius={[0,0,4,4]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Heatmap grid */}
        <div className="card p-5 lg:col-span-3 overflow-auto">
          <h3 className="font-semibold text-surface-900 mb-4">Employee × Quarter Heatmap</h3>
          {loading ? <SkeletonLoader rows={4} /> : (
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left pb-2 text-xs text-surface-500 font-semibold">Employee</th>
                  {QUARTERS.map(q => (
                    <th key={q} className={cn('text-center pb-2 text-xs font-bold', q === activeQ ? 'text-brand-600' : 'text-surface-400')}>{q}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {(data?.employees || []).map(emp => (
                  <tr key={emp.user?._id} className="hover:bg-surface-50">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 text-[10px] font-bold">
                          {emp.user?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-surface-900">{emp.user?.name}</p>
                          <p className="text-[10px] text-surface-400">{emp.user?.department}</p>
                        </div>
                      </div>
                    </td>
                    {QUARTERS.map(q => {
                      const status = getEmployeeStatus(emp, q);
                      const ci = emp.checkInStatus?.[q];
                      return (
                        <td key={q} className="py-2.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            {status === 'complete' && <div className="w-7 h-7 rounded-lg bg-success-400/20 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 text-success-600" /></div>}
                            {status === 'partial'  && <div className="w-7 h-7 rounded-lg bg-warning-400/20 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-warning-600" /></div>}
                            {status === 'pending'  && <div className="w-7 h-7 rounded-lg bg-danger-400/10 flex items-center justify-center"><XCircle className="w-3.5 h-3.5 text-danger-400" /></div>}
                            {status === 'na'       && <div className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center"><span className="text-surface-300 text-xs">—</span></div>}
                            {ci && <span className="text-[9px] text-surface-400">{ci.submitted}/{ci.total}</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detailed list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">{activeQ} Check-in Details</h3>
        </div>
        {loading ? <div className="p-5"><SkeletonLoader rows={5} /></div> : (
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-100">
                {['Employee','Department','Goals','Submitted','Completed','Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {(data?.employees || []).map((emp, i) => {
                const ci = emp.checkInStatus?.[activeQ] || {};
                const status = getEmployeeStatus(emp, activeQ);
                return (
                  <motion.tr key={emp.user?._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                          {emp.user?.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-surface-900">{emp.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-surface-500">{emp.user?.department}</td>
                    <td className="px-5 py-3 text-sm font-medium">{emp.totalGoals}</td>
                    <td className="px-5 py-3 text-sm">{ci.submitted || 0}</td>
                    <td className="px-5 py-3 text-sm">{ci.completed || 0}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {STATUS_ICON[status] || <span className="text-surface-300 text-xs">N/A</span>}
                        <span className={cn('text-xs font-medium capitalize',
                          status === 'complete' ? 'text-success-600' :
                          status === 'partial'  ? 'text-warning-600' :
                          status === 'pending'  ? 'text-danger-600' : 'text-surface-400')}>
                          {status === 'na' ? 'No Goals' : status}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
