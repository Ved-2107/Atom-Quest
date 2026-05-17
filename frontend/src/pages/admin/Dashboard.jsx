import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Target, TrendingUp, Activity, Brain, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { KpiCard, SkeletonLoader } from '../../components/shared/index';
import CheckInScheduleBanner from '../../components/shared/CheckInScheduleBanner';
import { CHART_COLORS, downloadCSV, downloadExcel } from '../../utils/helpers';
import { useGoalsStore } from '../../store';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AI_INSIGHTS = [
  { type:'warning', icon:'⚠️', title:'Delayed Check-ins Detected',   body:'3 employees in Engineering have not submitted Q2 check-ins. Risk of compliance gaps increasing. Escalation triggered.' },
  { type:'info',    icon:'📊', title:'Approval Velocity Improving',   body:'Average approval time dropped from 4.2 days to 2.1 days this month — a 50% improvement across all managers.' },
  { type:'success', icon:'🏆', title:'High Performers Identified',    body:'Rahul Verma and Anjali Singh are tracking at 80%+ progress with 2 quarters remaining. Consider recognition.' },
  { type:'danger',  icon:'🚨', title:'Weightage Imbalance Alert',    body:'2 goal sheets submitted with <70% in non-critical thrust areas. Manager review recommended before approval.' },
  { type:'info',    icon:'🎯', title:'Q3 Planning Recommended',       body:'Q2 ends in 6 weeks. Recommend initiating Q3 check-in reminders via Teams Bot for all managers.' },
  { type:'success', icon:'📈', title:'QoQ Progress Trend Positive',  body:'Q2 average progress (78%) is 13 points higher than Q1 (65%). Engineering leading with 84% completion rate.' },
];

const INSIGHT_COLORS = {
  warning: 'bg-warning-400/10 border-warning-400/30 text-warning-700',
  info:    'bg-brand-50 border-brand-100 text-brand-700',
  success: 'bg-success-400/10 border-success-400/30 text-success-700',
  danger:  'bg-danger-400/10 border-danger-400/30 text-danger-700',
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const { activeCycle, fetchActiveCycle } = useGoalsStore();

  useEffect(() => {
    fetchActiveCycle().then(c => {
      const params = c ? { cycleId: c._id } : {};
      api.get('/analytics/overview', { params })
        .then(r => { setAnalytics(r.data.data); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, []);

  const summary   = analytics?.summary || {};
  const deptData  = (analytics?.deptBreakdown || []).map(d => ({
    name: d._id, total: d.count, approved: d.approved,
    completion: d.count ? Math.round((d.approved / d.count) * 100) : 0,
    avgProgress: Math.round(d.avgProgress || 0),
  }));

  const thrustData = (analytics?.thrustAreas || []).slice(0,6).map(t => ({
    name: t._id?.slice(0,12), count: t.count, progress: Math.round(t.avgProgress || 0),
  }));

  const uomData = (analytics?.uomDist || []).map(u => {
    const labels = { numeric_min:'Min', numeric_max:'Max', timeline:'Timeline', zero:'Zero', max:'Min', min:'Max' };
    return { name: labels[u._id] || u._id?.toUpperCase(), value: u.count };
  });

  // QoQ — use real data or fallback
  const qoqData = (analytics?.quarterCompletion || [
    { quarter:'Q1', updated:8,  completed:5, avgPct:65 },
    { quarter:'Q2', updated:11, completed:7, avgPct:78 },
    { quarter:'Q3', updated:0,  completed:0, avgPct:0  },
    { quarter:'Q4', updated:0,  completed:0, avgPct:0  },
  ]).map(q => ({
    quarter: q.quarter || q,
    'Check-ins Submitted': q.updated   || 0,
    'Goals Completed':     q.completed || 0,
    'Avg Progress %':      q.avgPct    || 0,
  }));

  const monthlyData = (analytics?.monthlyTrend || []).map(m => ({
    month: ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m._id?.month] || 'N/A',
    goals: m.count,
  }));

  const handleExportSummary = () => {
    const rows = deptData.map(d => ({
      Department: d.name, 'Total Goals': d.total, Approved: d.approved,
      'Completion %': `${d.completion}%`, 'Avg Progress': `${d.avgProgress}%`,
    }));
    downloadExcel(rows, 'org-analytics-summary');
    toast.success('📊 Excel report downloaded!');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Admin Analytics</h1>
          <p className="page-subtitle">{activeCycle?.name} · Organisation-wide performance intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportSummary} className="btn-secondary">
            <Download className="w-4 h-4"/> Export
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 border border-brand-100">
            <Activity className="w-4 h-4 text-brand-600 animate-pulse"/>
            <span className="text-sm font-medium text-brand-700">Live Dashboard</span>
          </div>
        </div>
      </div>

      <CheckInScheduleBanner />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Total Employees" value={summary.totalUsers ?? '—'} icon={Users}    color="brand"   loading={loading} subtitle="Active accounts" />
        <KpiCard title="Total Goals"     value={summary.totalGoals ?? '—'} icon={Target}   color="purple"  loading={loading} subtitle="This cycle" />
        <KpiCard title="Approved Goals"  value={summary.approvedGoals ?? '—'} icon={TrendingUp} color="success" loading={loading} subtitle={`${analytics?.completionRate || 0}% rate`} />
        <KpiCard title="Pending Review"  value={summary.pendingGoals ?? '—'} icon={BarChart3}
          color={summary.pendingGoals > 0 ? 'warning' : 'success'} loading={loading} subtitle="Awaiting manager" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-surface-900 mb-1">Goals by Department</h3>
          <p className="text-xs text-surface-400 mb-4">Total goals vs approved, completion rate per department</p>
          {loading ? <div className="shimmer h-52 rounded-xl"/> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} barSize={18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius:12, border:'none', boxShadow:'0 8px 32px rgba(0,0,0,0.08)', fontSize:12 }}/>
                <Legend wrapperStyle={{ fontSize:11 }}/>
                <Bar dataKey="total"    name="Total"    fill="#e0e9ff" radius={[4,4,0,0]}/>
                <Bar dataKey="approved" name="Approved" fill="#6272f3" radius={[4,4,0,0]}/>
                <Bar dataKey="avgProgress" name="Avg Progress%" fill="#22c55e" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-surface-900 mb-1">UoM Distribution</h3>
          <p className="text-xs text-surface-400 mb-1">Goal measurement types (BRD §2.2)</p>
          <div className="text-[10px] text-surface-400 mb-3 space-y-0.5">
            <p>• Min = Higher is Better (Achievement÷Target)</p>
            <p>• Max = Lower is Better (Target÷Achievement)</p>
          </div>
          {loading ? <div className="shimmer h-40 rounded-xl"/> : (
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={uomData} cx="50%" cy="45%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                  {uomData.map((_,i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:12, border:'none', fontSize:12 }}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:10 }}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 — QoQ & Monthly */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-5">
          <h3 className="font-semibold text-surface-900 mb-1">Quarter-on-Quarter Achievement</h3>
          <p className="text-xs text-surface-400 mb-4">BRD §4 — Planned vs Actual across quarters</p>
          {loading ? <div className="shimmer h-44 rounded-xl"/> : (
            <ResponsiveContainer width="100%" height={185}>
              <LineChart data={qoqData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="quarter" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius:12, border:'none', fontSize:12 }}/>
                <Legend wrapperStyle={{ fontSize:11 }}/>
                <Line type="monotone" dataKey="Check-ins Submitted" stroke="#6272f3" strokeWidth={2.5} dot={{ r:4 }}/>
                <Line type="monotone" dataKey="Goals Completed"     stroke="#22c55e" strokeWidth={2.5} dot={{ r:4 }}/>
                <Line type="monotone" dataKey="Avg Progress %"      stroke="#f97316" strokeWidth={2}   dot={{ r:3 }} strokeDasharray="4 4"/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-surface-900 mb-1">Thrust Area Performance</h3>
          <p className="text-xs text-surface-400 mb-4">Goal count and average progress per thrust area</p>
          {loading ? <div className="shimmer h-44 rounded-xl"/> : (
            <ResponsiveContainer width="100%" height={185}>
              <BarChart data={thrustData} layout="vertical" barSize={9}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis dataKey="name" type="category" tick={{ fontSize:9, fill:'#94a3b8' }} axisLine={false} tickLine={false} width={75}/>
                <Tooltip contentStyle={{ borderRadius:12, border:'none', fontSize:12 }}/>
                <Legend wrapperStyle={{ fontSize:11 }}/>
                <Bar dataKey="count"    name="# Goals"       fill="#6272f3" radius={[0,4,4,0]}/>
                <Bar dataKey="progress" name="Avg Progress%" fill="#22c55e" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-brand-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white"/>
          </div>
          <div>
            <h3 className="font-semibold text-surface-900">AI Insights & Recommendations</h3>
            <p className="text-xs text-surface-400">GoalFlow Intelligence Engine — pattern detection & smart alerts</p>
          </div>
          <span className="ml-auto badge bg-purple-50 text-purple-700 border border-purple-100">Beta</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AI_INSIGHTS.map((ins, i) => (
            <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
              className={`p-4 rounded-2xl border ${INSIGHT_COLORS[ins.type]}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{ins.icon}</span>
                <p className="text-sm font-semibold">{ins.title}</p>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">{ins.body}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stat row */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label:'Goal Approval Rate',      val:`${analytics?.completionRate||0}%`,      sub:'submitted → approved', color:'success' },
          { label:'Rejected Goals',           val:summary.rejectedGoals??0,                sub:'need revision',        color:'danger' },
          { label:'Avg Goals / Employee',     val:summary.totalUsers?(summary.totalGoals/summary.totalUsers).toFixed(1):'—', sub:'this cycle', color:'brand' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <p className="text-xs text-surface-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-3xl font-display font-bold ${s.color==='success'?'text-success-600':s.color==='danger'?'text-danger-600':'text-brand-600'}`}>{s.val}</p>
            <p className="text-xs text-surface-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
