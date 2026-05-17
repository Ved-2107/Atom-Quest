import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, Clock, TrendingUp, AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuthStore, useGoalsStore } from '../../store';
import { KpiCard, StatusBadge, ProgressBar, SkeletonLoader, EmptyState } from '../../components/shared/index';
import CheckInScheduleBanner from '../../components/shared/CheckInScheduleBanner';
import { formatDate, getProgressColor, CHART_COLORS, calculateProgress, isOverdue, getCurrentPhase } from '../../utils/helpers';
import api from '../../utils/api';

const Q_TREND = [
  { quarter:'Q1', target:100, achieved:65, teamAvg:72 },
  { quarter:'Q2', target:100, achieved:78, teamAvg:80 },
  { quarter:'Q3', target:100, achieved:0,  teamAvg:0  },
  { quarter:'Q4', target:100, achieved:0,  teamAvg:0  },
];

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const { goals, loading, fetchGoals, activeCycle, fetchActiveCycle } = useGoalsStore();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchActiveCycle().then(c => { if (c) fetchGoals({ cycleId: c._id }); });
    api.get('/analytics/employee/me').then(r => setAnalytics(r.data.data)).catch(() => {});
  }, []);

  const myGoals    = goals.filter(g => g.userId?._id === user?._id || g.userId === user?._id);
  const approved   = myGoals.filter(g => g.status === 'approved');
  const pending    = myGoals.filter(g => g.status === 'submitted');
  const draft      = myGoals.filter(g => g.status === 'draft');
  const totalWeight = myGoals.filter(g => !['rejected'].includes(g.status)).reduce((s,g) => s+g.weightage, 0);
  const avgProgress = approved.length ? Math.round(approved.reduce((s,g) => s+(g.progress||calculateProgress(g)),0)/approved.length) : 0;
  const overdue    = approved.filter(g => isOverdue(g.deadline));

  const pieData = [
    { name:'Approved', value:approved.length, color:'#22c55e' },
    { name:'Pending',  value:pending.length,  color:'#6272f3' },
    { name:'Draft',    value:draft.length,    color:'#94a3b8' },
    { name:'Rejected', value:myGoals.filter(g=>g.status==='rejected').length, color:'#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'},{' '}
            <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="page-subtitle">{activeCycle?.name || 'FY 2025-26'} · {user?.department} · {user?.designation}</p>
        </div>
        <Link to="/goals" className="btn-primary"><Plus className="w-4 h-4" /> New Goal</Link>
      </div>

      {/* BRD Section 2.3 — Check-in schedule */}
      <CheckInScheduleBanner />

      {/* KPI Cards */}
      {loading
        ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{[...Array(4)].map((_,i)=><div key={i} className="stat-card"><div className="shimmer h-20 rounded-xl"/></div>)}</div>
        : <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard title="Total Goals"      value={myGoals.length} subtitle="Max 8 allowed"    icon={Target}        color="brand" />
            <KpiCard title="Avg Progress"     value={`${avgProgress}%`} subtitle="Approved goals" icon={TrendingUp}   color="success" />
            <KpiCard title="Pending Approval" value={pending.length}  subtitle="Awaiting review" icon={Clock}         color="warning" />
            <KpiCard title="Overdue Goals"    value={overdue.length}  subtitle="Past deadline"   icon={AlertTriangle} color={overdue.length>0?'danger':'success'} />
          </div>
      }

      {/* Weightage bar */}
      {myGoals.length > 0 && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="card p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-surface-700">Goal Sheet Weightage</p>
              <p className="text-xs text-surface-400">Must total exactly 100% before submission</p>
            </div>
            <span className={`text-2xl font-display font-bold ${totalWeight===100?'text-success-600':totalWeight>100?'text-danger-600':'text-warning-600'}`}>{totalWeight}%</span>
          </div>
          <div className="w-full h-3 bg-surface-100 rounded-full overflow-hidden">
            <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(totalWeight,100)}%` }} transition={{ duration:1 }}
              className={`h-full rounded-full ${totalWeight===100?'bg-success-500':totalWeight>100?'bg-danger-500':'bg-brand-500'}`} />
          </div>
          <div className="flex justify-between text-xs text-surface-400 mt-1">
            <span>0%</span>
            <span className={totalWeight===100?'text-success-600 font-medium':''}>
              {totalWeight===100?'✓ Ready to submit':`${100-totalWeight}% remaining`}
            </span>
            <span>100%</span>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Quarterly Trend */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-surface-900">Quarterly Achievement Trend</h3>
              <p className="text-xs text-surface-400">Your progress vs team average</p>
            </div>
            <span className="badge bg-brand-50 text-brand-600">FY 2025-26</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={Q_TREND}>
              <defs>
                <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6272f3" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6272f3" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="quarter" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} unit="%"/>
              <Tooltip contentStyle={{ borderRadius:12, border:'none', boxShadow:'0 8px 32px rgba(0,0,0,0.1)', fontSize:12 }}/>
              <Area type="monotone" dataKey="achieved" stroke="#6272f3" strokeWidth={2} fill="url(#gradA)" name="Your Progress %" />
              <Area type="monotone" dataKey="teamAvg" stroke="#22c55e" strokeWidth={2} strokeDasharray="4 4" fill="none" name="Team Avg %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Goal Status Pie */}
        <div className="card p-5">
          <h3 className="font-semibold text-surface-900 mb-1">Goal Status</h3>
          <p className="text-xs text-surface-400 mb-4">Distribution overview</p>
          {pieData.length > 0
            ? <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:12, border:'none', fontSize:12 }}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }}/>
                </PieChart>
              </ResponsiveContainer>
            : <div className="flex items-center justify-center h-40 text-surface-400 text-sm">No goals yet</div>
          }
        </div>
      </div>

      {/* Goals List */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-surface-900">My Goals — {activeCycle?.name}</h3>
          <Link to="/goals" className="text-brand-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Manage <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>
        {loading ? <SkeletonLoader rows={4}/> : myGoals.length===0 ? (
          <EmptyState icon={Target} title="No goals yet" description="Start by creating your first goal for this cycle"
            action={<Link to="/goals" className="btn-primary"><Plus className="w-4 h-4"/>Create Goal</Link>}/>
        ) : (
          <div className="space-y-3">
            {myGoals.slice(0,6).map((goal, i) => {
              const progress = goal.progress || calculateProgress(goal);
              return (
                <motion.div key={goal._id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-white border border-surface-200 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-brand-500"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-surface-900 truncate">{goal.title}</p>
                      <StatusBadge status={goal.status} size="xs"/>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressBar value={progress} showLabel={false} size="sm" className="flex-1"/>
                      <span className="text-xs font-medium text-surface-500 w-8 text-right">{progress}%</span>
                    </div>
                    <p className="text-[10px] text-surface-400 mt-1">{goal.thrustArea}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-display font-bold text-surface-900">{goal.weightage}%</p>
                    <p className="text-[10px] text-surface-400">weight</p>
                  </div>
                </motion.div>
              );
            })}
            {myGoals.length > 6 && (
              <Link to="/goals" className="block text-center text-sm text-brand-600 font-medium pt-2 hover:underline">
                View all {myGoals.length} goals →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
