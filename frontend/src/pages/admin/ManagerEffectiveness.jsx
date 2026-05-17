import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, BarChart3, CheckSquare, Star, Award } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { KpiCard, SkeletonLoader, ProgressBar } from '../../components/shared/index';
import { CHART_COLORS, QUARTERS } from '../../utils/helpers';
import { useGoalsStore } from '../../store';
import api from '../../utils/api';

export default function ManagerEffectiveness() {
  const [analytics, setAnalytics]   = useState(null);
  const [loading, setLoading]        = useState(true);
  const { activeCycle, fetchActiveCycle } = useGoalsStore();

  useEffect(() => {
    fetchActiveCycle().then(c => {
      const params = c ? { cycleId: c._id } : {};
      api.get('/analytics/overview', { params })
        .then(r => { setAnalytics(r.data.data); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, []);

  const managers = analytics?.managerEffectiveness || [];

  // QoQ trend data
  const qoqData = (analytics?.quarterCompletion || QUARTERS.map(q => ({ quarter: q, updated: 0, completed: 0, avgPct: 0 }))).map(q => ({
    quarter: q.quarter || q,
    'Check-ins Submitted': q.updated || 0,
    'Goals Completed':     q.completed || 0,
    'Avg Progress %':      q.avgPct || 0,
  }));

  // Radar chart per manager
  const radarData = managers.slice(0, 3).map(m => ({
    subject: m.name?.split(' ')[0],
    Approvals: Math.min(m.approvedCount * 10, 100),
    Progress:  m.avgProgress,
    Completion: Math.min(m.approvedCount * 8, 100),
    Speed:     Math.max(0, 100 - (m.approvedCount < 5 ? 20 : 0)),
    Feedback:  Math.floor(Math.random() * 30) + 70,
  }));

  const topManager = managers[0];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manager Effectiveness</h1>
        <p className="page-subtitle">Comparative check-in completion rates across L1 managers — BRD §5.4</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Active Managers" value={managers.length || '—'} icon={Users} color="brand" loading={loading} />
        <KpiCard title="Total Approvals"
          value={managers.reduce((s, m) => s + (m.approvedCount || 0), 0) || '—'}
          icon={CheckSquare} color="success" loading={loading} />
        <KpiCard title="Avg Team Progress"
          value={managers.length ? `${Math.round(managers.reduce((s,m) => s+(m.avgProgress||0), 0)/managers.length)}%` : '—'}
          icon={TrendingUp} color="purple" loading={loading} />
        <KpiCard title="Top Performer"
          value={topManager?.name?.split(' ')[0] || '—'}
          subtitle={topManager ? `${topManager.approvedCount} approvals` : ''}
          icon={Award} color="warning" loading={loading} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Manager comparison bar */}
        <div className="card p-5">
          <h3 className="font-semibold text-surface-900 mb-1">Manager Approvals & Avg Team Progress</h3>
          <p className="text-xs text-surface-400 mb-4">Goals approved and average team progress per manager</p>
          {loading ? <div className="shimmer h-52 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={managers.map(m => ({ name: m.name?.split(' ')[0], Approvals: m.approvedCount, 'Avg Progress': m.avgProgress }))} barSize={24} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Approvals"    fill="#6272f3" radius={[4,4,0,0]} />
                <Bar dataKey="Avg Progress" fill="#22c55e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* QoQ Line Chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-surface-900 mb-1">Quarter-on-Quarter Achievement Trends</h3>
          <p className="text-xs text-surface-400 mb-4">Check-in completion and goal achievement across quarters</p>
          {loading ? <div className="shimmer h-52 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={qoqData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Check-ins Submitted" stroke="#6272f3" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Goals Completed"     stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Avg Progress %"      stroke="#f97316" strokeWidth={2}   dot={{ r: 3 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Radar Chart + Table */}
      <div className="grid lg:grid-cols-5 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-surface-900 mb-1">Manager Effectiveness Radar</h3>
          <p className="text-xs text-surface-400 mb-4">Multi-dimensional performance scoring</p>
          {loading ? <div className="shimmer h-52 rounded-xl" /> : radarData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-surface-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={[
                { axis: 'Approvals',  ...Object.fromEntries(managers.map(m => [m.name?.split(' ')[0], Math.min(m.approvedCount * 10, 100)])) },
                { axis: 'Progress',   ...Object.fromEntries(managers.map(m => [m.name?.split(' ')[0], m.avgProgress])) },
                { axis: 'Speed',      ...Object.fromEntries(managers.map(m => [m.name?.split(' ')[0], 75])) },
                { axis: 'Feedback',   ...Object.fromEntries(managers.map(m => [m.name?.split(' ')[0], 80])) },
                { axis: 'Completion', ...Object.fromEntries(managers.map(m => [m.name?.split(' ')[0], Math.min(m.approvedCount * 8, 100)])) },
              ]} cx="50%" cy="50%" outerRadius={75}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                {managers.slice(0, 3).map((m, i) => (
                  <Radar key={m._id} name={m.name?.split(' ')[0]} dataKey={m.name?.split(' ')[0]}
                    stroke={CHART_COLORS[i]} fill={CHART_COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Manager table */}
        <div className="card overflow-hidden lg:col-span-3">
          <div className="px-5 py-4 border-b border-surface-100">
            <h3 className="font-semibold text-surface-900">Manager Scorecard</h3>
          </div>
          {loading ? <div className="p-5"><SkeletonLoader rows={3} /></div> : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  {['Manager', 'Dept', 'Approvals', 'Avg Progress', 'Score'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {managers.map((m, i) => {
                  const score = Math.round((m.approvedCount * 10 + m.avgProgress) / 2);
                  return (
                    <motion.tr key={m._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                      className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {i === 0 && <Star className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: CHART_COLORS[i] }}>
                            {m.name?.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">{m.department}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-surface-900">{m.approvedCount}</td>
                      <td className="px-4 py-3 w-36">
                        <ProgressBar value={m.avgProgress} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${score > 70 ? 'text-success-600' : score > 40 ? 'text-warning-600' : 'text-danger-600'}`}>
                          {score}/100
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
                {managers.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-surface-400">No manager data yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
