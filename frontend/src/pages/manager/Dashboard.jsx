import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckSquare, TrendingUp, Clock, ArrowRight, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuthStore, useGoalsStore } from '../../store';
import { KpiCard, StatusBadge, ProgressBar, SkeletonLoader, EmptyState } from '../../components/shared/index';
import CheckInScheduleBanner from '../../components/shared/CheckInScheduleBanner';
import { formatDate, calculateProgress } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  const { user }  = useAuthStore();
  const { goals, loading, fetchGoals, activeCycle, fetchActiveCycle } = useGoalsStore();
  const [analytics, setAnalytics]   = useState(null);
  const [loadingA, setLoadingA]     = useState(true);

  useEffect(() => {
    fetchActiveCycle().then(c => { if (c) fetchGoals({ cycleId: c._id }); });
    api.get('/analytics/manager')
      .then(r => { setAnalytics(r.data.data); setLoadingA(false); })
      .catch(() => setLoadingA(false));
  }, []);

  const pendingGoals  = goals.filter(g => g.status === 'submitted');
  const approvedGoals = goals.filter(g => g.status === 'approved');
  const teamPerf      = analytics?.teamPerformance || [];

  const barData = teamPerf.map(m => ({
    name:     m.name?.split(' ')[0] || '?',
    Approved: m.approvedGoals  || 0,
    Pending:  m.pendingGoals   || 0,
    'Avg%':   m.avgProgress    || 0,
  }));

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Manager Dashboard</h1>
          <p className="page-subtitle">{activeCycle?.name} · Team overview and pending actions</p>
        </div>
        <Link to="/approvals" className="btn-primary">
          <CheckSquare className="w-4 h-4"/> Review Approvals
          {pendingGoals.length > 0 && (
            <span className="bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingGoals.length}</span>
          )}
        </Link>
      </div>

      <CheckInScheduleBanner />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Team Size"         value={analytics?.teamSize ?? teamPerf.length ?? '—'}  icon={Users}       color="brand"   loading={loadingA} subtitle="Active members" />
        <KpiCard title="Pending Approvals" value={pendingGoals.length}  icon={CheckSquare} color={pendingGoals.length > 0 ? 'warning' : 'success'} subtitle="Awaiting review" />
        <KpiCard title="Approved Goals"    value={approvedGoals.length} icon={TrendingUp}  color="success" subtitle="This cycle" />
        <KpiCard title="Avg Team Progress"
          value={teamPerf.length
            ? `${Math.round(teamPerf.reduce((s,m) => s + (m.avgProgress||0), 0) / teamPerf.length)}%`
            : '—'}
          icon={BarChart2} color="purple" loading={loadingA} subtitle="Approved goals" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mb-8">
        {/* Team bar chart */}
        <div className="card p-5 lg:col-span-3">
          <h3 className="font-semibold text-surface-900 mb-1">Team Goal Overview</h3>
          <p className="text-xs text-surface-400 mb-4">Approved vs pending per team member</p>
          {loadingA ? <div className="shimmer h-48 rounded-xl"/> : barData.length === 0 ? (
            <EmptyState icon={Users} title="No team data" description="Team data will appear here after goals are submitted" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={16} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius:12, border:'none', boxShadow:'0 8px 32px rgba(0,0,0,0.1)', fontSize:12 }}/>
                <Legend wrapperStyle={{ fontSize:11 }}/>
                <Bar dataKey="Approved" fill="#22c55e" radius={[4,4,0,0]}/>
                <Bar dataKey="Pending"  fill="#6272f3" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pending approvals panel */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">Pending Approvals</h3>
            <Link to="/approvals" className="text-brand-600 text-xs font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3"/>
            </Link>
          </div>
          {loading ? <SkeletonLoader rows={3}/> : pendingGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-success-400/10 flex items-center justify-center mb-2">
                <CheckSquare className="w-5 h-5 text-success-500"/>
              </div>
              <p className="text-sm text-surface-500 font-medium">All caught up!</p>
              <p className="text-xs text-surface-400 mt-0.5">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingGoals.slice(0, 5).map(goal => (
                <div key={goal._id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-700">
                    {goal.userId?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 truncate">{goal.title}</p>
                    <p className="text-xs text-surface-400">{goal.userId?.name} · {goal.weightage}%</p>
                  </div>
                  <Clock className="w-3.5 h-3.5 text-warning-500 flex-shrink-0"/>
                </div>
              ))}
              {pendingGoals.length > 5 && (
                <Link to="/approvals" className="block text-center text-xs text-brand-600 font-medium pt-1">
                  +{pendingGoals.length - 5} more →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Team performance table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">Team Performance</h3>
          <Link to="/team" className="text-brand-600 text-sm font-medium flex items-center gap-1">
            Full view <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>
        {loadingA ? <div className="p-5"><SkeletonLoader rows={4}/></div> : teamPerf.length === 0 ? (
          <div className="p-8 text-center text-surface-400 text-sm">No team data available</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-100">
                {['Employee', 'Goals', 'Approved', 'Pending', 'Avg Progress'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {teamPerf.map((m, i) => (
                <motion.tr key={String(m.userId)} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.05 }}
                  className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                        {m.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900">{m.name}</p>
                        <p className="text-xs text-surface-400">{m.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium">{m.totalGoals}</td>
                  <td className="px-5 py-4"><span className="badge bg-success-400/10 text-success-600">{m.approvedGoals}</span></td>
                  <td className="px-5 py-4">
                    {m.pendingGoals > 0
                      ? <span className="badge bg-warning-400/10 text-warning-600">{m.pendingGoals}</span>
                      : <span className="text-surface-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-4 w-44">
                    <div className="flex items-center gap-3">
                      <ProgressBar value={m.avgProgress} showLabel={false} size="sm" className="flex-1"/>
                      <span className="text-xs font-medium text-surface-600 w-8">{m.avgProgress}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
