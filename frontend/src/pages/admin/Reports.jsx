import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, FileSpreadsheet, TrendingUp, Users, Target, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';
import { SkeletonLoader, StatusBadge, ProgressBar } from '../../components/shared/index';
import { formatDate, calculateProgress, downloadCSV, downloadExcel, CHART_COLORS, UOM_SHORT, QUARTERS } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { key:'planned-vs-actual', label:'Planned vs Actual',    icon:TrendingUp,     desc:'Achievement against targets per employee' },
  { key:'department',        label:'Department Analytics', icon:Users,           desc:'Completion rate and progress by department' },
  { key:'employee-perf',     label:'Employee Performance', icon:Target,          desc:'Individual goal and progress breakdown' },
  { key:'quarterly',         label:'Quarterly Completion', icon:BarChart3,       desc:'Check-in completion rates per quarter' },
];

export default function ReportsPage() {
  const [goals, setGoals]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeReport, setReport] = useState('planned-vs-actual');
  const [search, setSearch]       = useState('');
  const [qoqData, setQoqData]     = useState([]);

  useEffect(() => {
    api.get('/goals').then(r => { setGoals(r.data.data); setLoading(false); }).catch(() => setLoading(false));
    api.get('/analytics/overview').then(r => {
      const qc = r.data.data?.quarterCompletion || [];
      setQoqData(qc.map(q => ({ quarter:q.quarter, Submitted:q.updated||0, Completed:q.completed||0, 'Avg%':q.avgPct||0 })));
    }).catch(() => {});
  }, []);

  const filtered = goals.filter(g =>
    !search ||
    g.title?.toLowerCase().includes(search.toLowerCase()) ||
    g.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.userId?.department?.toLowerCase().includes(search.toLowerCase())
  );

  // Aggregations
  const deptData = Object.values(filtered.reduce((acc, g) => {
    const d = g.userId?.department || 'Unknown';
    if (!acc[d]) acc[d] = { dept:d, total:0, approved:0 };
    acc[d].total++;
    if (g.status==='approved') acc[d].approved++;
    return acc;
  }, {})).map(d => ({ name:d.dept, completion:d.total?Math.round((d.approved/d.total)*100):0, total:d.total, approved:d.approved }));

  // Build planned vs actual table
  const buildReport = () => {
    return filtered.map(g => ({
      Employee: g.userId?.name || '—',
      Department: g.userId?.department || '—',
      'Thrust Area': g.thrustArea,
      Goal: g.title,
      'UoM Type': UOM_SHORT[g.uomType] || g.uomType,
      Target: g.target,
      'Q1 Actual': g.checkIns?.find(c=>c.quarter==='Q1')?.achievement ?? '—',
      'Q2 Actual': g.checkIns?.find(c=>c.quarter==='Q2')?.achievement ?? '—',
      'Q3 Actual': g.checkIns?.find(c=>c.quarter==='Q3')?.achievement ?? '—',
      'Q4 Actual': g.checkIns?.find(c=>c.quarter==='Q4')?.achievement ?? '—',
      Weightage: `${g.weightage}%`,
      Status: g.status,
      Progress: `${g.progress || calculateProgress(g)}%`,
      Deadline: formatDate(g.deadline),
      'Lock Status': g.isLocked ? 'Locked' : 'Open',
    }));
  };

  const handleCSV   = () => { downloadCSV(buildReport(),   `goalflow-${activeReport}`); toast.success('📥 CSV downloaded!'); };
  const handleExcel = () => { downloadExcel(buildReport(), `goalflow-${activeReport}`); toast.success('📊 Excel downloaded!'); };

  const summaryStats = {
    total:    filtered.length,
    approved: filtered.filter(g=>g.status==='approved').length,
    avgProg:  filtered.filter(g=>g.status==='approved').length
      ? Math.round(filtered.filter(g=>g.status==='approved').reduce((s,g)=>s+(g.progress||0),0)/filtered.filter(g=>g.status==='approved').length) : 0,
    employees: new Set(filtered.map(g=>g.userId?._id)).size,
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Achievement reports, department analytics and quarterly summaries — BRD §4</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCSV}   className="btn-secondary"><Download className="w-4 h-4"/> CSV</button>
          <button onClick={handleExcel} className="btn-primary"><FileSpreadsheet className="w-4 h-4"/> Excel</button>
        </div>
      </div>

      {/* Report type */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {REPORT_TYPES.map(({ key, label, icon:Icon, desc }) => (
          <button key={key} onClick={() => setReport(key)}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${activeReport===key?'border-brand-400 bg-brand-50':'border-surface-100 bg-white hover:border-surface-200'}`}>
            <Icon className={`w-5 h-5 mb-2 ${activeReport===key?'text-brand-600':'text-surface-400'}`}/>
            <p className={`text-sm font-semibold ${activeReport===key?'text-brand-700':'text-surface-700'}`}>{label}</p>
            <p className="text-[11px] text-surface-400 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input max-w-sm" placeholder="Filter by employee, department, or goal..."/>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label:'Total Goals',       val:summaryStats.total },
          { label:'Approved',          val:summaryStats.approved },
          { label:'Avg Progress',      val:`${summaryStats.avgProg}%` },
          { label:'Unique Employees',  val:summaryStats.employees },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-surface-900">{s.val}</p>
            <p className="text-xs text-surface-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart section */}
      {(activeReport==='department' || activeReport==='planned-vs-actual') && deptData.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-surface-900 mb-4">Department Completion Rate</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis unit="%" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius:12, border:'none', fontSize:12 }} formatter={v=>[`${v}%`,'Completion']}/>
              <Bar dataKey="completion" name="Completion %" radius={[6,6,0,0]}>
                {deptData.map((_,i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeReport==='quarterly' && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-surface-900 mb-1">Quarter-on-Quarter Completion (BRD §4)</h3>
          <p className="text-xs text-surface-400 mb-4">Planned vs Actual check-in submission rates per quarter</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={qoqData.length ? qoqData : QUARTERS.map(q=>({ quarter:q, Submitted:0, Completed:0, 'Avg%':0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="quarter" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius:12, border:'none', fontSize:12 }}/>
              <Legend wrapperStyle={{ fontSize:11 }}/>
              <Line type="monotone" dataKey="Submitted"  stroke="#6272f3" strokeWidth={2.5} dot={{ r:4 }}/>
              <Line type="monotone" dataKey="Completed"  stroke="#22c55e" strokeWidth={2.5} dot={{ r:4 }}/>
              <Line type="monotone" dataKey="Avg%"       stroke="#f97316" strokeWidth={2}   dot={{ r:3 }} strokeDasharray="4 4"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data table */}
      {loading ? <SkeletonLoader rows={5}/> : (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900">{REPORT_TYPES.find(r=>r.key===activeReport)?.label} — {filtered.length} records</h3>
            <div className="flex gap-2">
              <button onClick={handleCSV}   className="btn-ghost text-xs"><Download className="w-3.5 h-3.5"/> CSV</button>
              <button onClick={handleExcel} className="btn-ghost text-xs"><FileSpreadsheet className="w-3.5 h-3.5"/> Excel</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-100">
                  {['Employee','Goal','Area','UoM','Wt%','Target','Q1','Q2','Status','Progress','Deadline'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {filtered.slice(0,25).map((goal, i) => {
                  const progress = goal.progress || calculateProgress(goal);
                  return (
                    <motion.tr key={goal._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                      className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-surface-900">{goal.userId?.name||'—'}</p>
                        <p className="text-[10px] text-surface-400">{goal.userId?.department}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]"><p className="text-sm text-surface-700 line-clamp-2">{goal.title}</p></td>
                      <td className="px-4 py-3"><span className="badge bg-brand-50 text-brand-600 text-[10px] whitespace-nowrap">{goal.thrustArea?.slice(0,12)}</span></td>
                      <td className="px-4 py-3 text-xs font-mono">{UOM_SHORT[goal.uomType]||goal.uomType}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{goal.weightage}%</td>
                      <td className="px-4 py-3 text-sm">{goal.target}</td>
                      <td className="px-4 py-3 text-sm text-center">{goal.checkIns?.find(c=>c.quarter==='Q1')?.achievement ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-center">{goal.checkIns?.find(c=>c.quarter==='Q2')?.achievement ?? '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={goal.status} size="xs"/></td>
                      <td className="px-4 py-3 w-28"><ProgressBar value={progress} size="sm" showLabel={false}/></td>
                      <td className="px-4 py-3 text-xs text-surface-500 whitespace-nowrap">{formatDate(goal.deadline)}</td>
                    </motion.tr>
                  );
                })}
                {filtered.length===0 && <tr><td colSpan={11} className="text-center py-8 text-surface-400 text-sm">No records found</td></tr>}
              </tbody>
            </table>
          </div>
          {filtered.length > 25 && (
            <div className="px-5 py-3 border-t border-surface-100 text-center text-xs text-surface-400">
              Showing 25 of {filtered.length} records · Export CSV or Excel for full dataset
            </div>
          )}
        </div>
      )}
    </div>
  );
}
