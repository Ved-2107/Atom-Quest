import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search } from 'lucide-react';
import { ProgressBar, SkeletonLoader, EmptyState, StatusBadge } from '../../components/shared/index';
import { useGoalsStore } from '../../store';
import { cn, calculateProgress } from '../../utils/helpers';
import api from '../../utils/api';

export default function TeamView() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [memberGoals, setMemberGoals] = useState([]);
  const { activeCycle, fetchActiveCycle } = useGoalsStore();

  useEffect(() => {
    fetchActiveCycle();
    api.get('/users/team').then(r => { setTeam(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSelectMember = async (member) => {
    setSelected(member);
    try {
      const cycle = activeCycle;
      const params = { userId: member._id };
      if (cycle) params.cycleId = cycle._id;
      const r = await api.get('/goals', { params });
      setMemberGoals(r.data.data);
    } catch { setMemberGoals([]); }
  };

  const filtered = team.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.department?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Team</h1>
        <p className="page-subtitle">View team members and their goal progress</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Team list */}
        <div className="lg:col-span-2 card p-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="input pl-9 text-sm" placeholder="Search team..." />
            </div>
          </div>

          {loading ? <SkeletonLoader rows={4} /> : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No team members" description="Your team members will appear here" />
          ) : (
            <div className="space-y-2">
              {filtered.map((member, i) => (
                <motion.button key={member._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  onClick={() => handleSelectMember(member)}
                  className={cn('w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                    selected?._id === member._id ? 'bg-brand-50 border-2 border-brand-200' : 'hover:bg-surface-50 border-2 border-transparent')}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {member.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900">{member.name}</p>
                    <p className="text-xs text-surface-400">{member.designation}</p>
                  </div>
                  <span className="badge bg-surface-100 text-surface-500 text-[10px]">{member.department}</span>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Member detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="card h-full flex items-center justify-center py-20">
              <EmptyState icon={Users} title="Select a team member"
                description="Click on a team member to view their goals and progress" />
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-brand-50 to-surface-50 border-b border-surface-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-bold">
                    {selected.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-surface-900">{selected.name}</h3>
                    <p className="text-surface-500 text-sm">{selected.designation} · {selected.department}</p>
                    <p className="text-surface-400 text-xs mt-0.5">{selected.email} · EMP{selected.employeeId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Total Goals', val: memberGoals.length },
                    { label: 'Approved', val: memberGoals.filter(g=>g.status==='approved').length },
                    { label: 'Pending', val: memberGoals.filter(g=>g.status==='submitted').length },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-surface-100">
                      <p className="text-xl font-display font-bold text-surface-900">{s.val}</p>
                      <p className="text-[10px] text-surface-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <h4 className="font-semibold text-surface-700 mb-3">Goals this cycle</h4>
                {memberGoals.length === 0 ? (
                  <p className="text-sm text-surface-400 text-center py-6">No goals found</p>
                ) : (
                  <div className="space-y-3">
                    {memberGoals.map(goal => {
                      const prog = goal.progress || calculateProgress(goal);
                      return (
                        <div key={goal._id} className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-surface-900 flex-1 truncate pr-3">{goal.title}</p>
                            <StatusBadge status={goal.status} size="xs" />
                          </div>
                          <ProgressBar value={prog} size="sm" />
                          <div className="flex gap-3 mt-1 text-[10px] text-surface-400">
                            <span>W: {goal.weightage}%</span>
                            <span>T: {goal.target}</span>
                            <span>{goal.thrustArea}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
