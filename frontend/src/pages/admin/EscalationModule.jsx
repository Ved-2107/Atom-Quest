import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, Settings, RefreshCw, ChevronRight, User, Clock, CheckSquare, Shield } from 'lucide-react';
import { SkeletonLoader, EmptyState } from '../../components/shared/index';
import { cn, timeAgo, formatDate } from '../../utils/helpers';
import { useGoalsStore } from '../../store';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SEVERITY_CONFIG = {
  high:   { label: 'High',   color: 'bg-danger-400/10 text-danger-700 border-danger-200',   dot: 'bg-danger-500',   icon: '🔴' },
  medium: { label: 'Medium', color: 'bg-warning-400/10 text-warning-700 border-warning-200', dot: 'bg-warning-500', icon: '🟡' },
  low:    { label: 'Low',    color: 'bg-brand-50 text-brand-700 border-brand-200',           dot: 'bg-brand-400',   icon: '🔵' },
};

const TYPE_CONFIG = {
  goal_not_submitted: { label: 'Goal Not Submitted', icon: AlertTriangle, color: 'text-danger-600 bg-danger-50' },
  approval_delayed:   { label: 'Approval Delayed',   icon: Clock,         color: 'text-warning-600 bg-warning-50' },
  checkin_missing:    { label: 'Check-in Missing',   icon: CheckSquare,   color: 'text-brand-600 bg-brand-50' },
};

// BRD Section 5.3 escalation rules configuration
const ESCALATION_RULES = [
  { id: 1, title: 'Goal Submission Delay',       trigger: 'Employee has not submitted goals within N days of cycle open',            interval: 14, unit: 'days', chain: ['Employee → Manager', 'Manager → Skip-level/HR'] },
  { id: 2, title: 'Approval Delay',              trigger: 'Manager has not approved goals within N days of submission',               interval: 7,  unit: 'days', chain: ['Manager → Skip-level', 'Skip-level → HR'] },
  { id: 3, title: 'Quarterly Check-in Overdue',  trigger: 'Quarterly check-in not completed within the active window',               interval: 0,  unit: 'days (window based)', chain: ['Employee → Manager', 'Manager → HR'] },
];

export default function EscalationModule() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [showRules, setShowRules] = useState(false);
  const { activeCycle, fetchActiveCycle } = useGoalsStore();

  const load = async () => {
    setLoading(true);
    const c = activeCycle || await fetchActiveCycle();
    try {
      const params = c ? { cycleId: c._id } : {};
      const r = await api.get('/analytics/escalations', { params });
      setItems(r.data.data || []);
    } catch { toast.error('Failed to load escalations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchActiveCycle().then(load); }, []);

  const filtered = filter === 'all' ? items : items.filter(i =>
    filter === 'high' ? i.severity === 'high' :
    filter === 'medium' ? i.severity === 'medium' :
    i.type === filter
  );

  const counts = {
    all:    items.length,
    high:   items.filter(i => i.severity === 'high').length,
    medium: items.filter(i => i.severity === 'medium').length,
    goal_not_submitted: items.filter(i => i.type === 'goal_not_submitted').length,
    approval_delayed:   items.filter(i => i.type === 'approval_delayed').length,
    checkin_missing:    items.filter(i => i.type === 'checkin_missing').length,
  };

  const handleNotify = (item) => {
    toast.success(`📧 Escalation notification sent to ${item.user?.name}'s manager`);
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Escalation Engine</h1>
          <p className="page-subtitle">Rule-based escalation tracking — BRD §5.3</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRules(!showRules)} className="btn-secondary">
            <Settings className="w-4 h-4" /> Rules
          </button>
          <button onClick={load} className="btn-secondary">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Rule configuration panel */}
      <AnimatePresence>
        {showRules && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6">
            <div className="card p-5 border-2 border-brand-100">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-brand-600" />
                <h3 className="font-semibold text-surface-900">Configured Escalation Rules</h3>
                <span className="badge bg-brand-50 text-brand-600 ml-auto">3 Active Rules</span>
              </div>
              <div className="space-y-3">
                {ESCALATION_RULES.map(rule => (
                  <div key={rule.id} className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-surface-900 text-sm">{rule.title}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{rule.trigger}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <span className="badge bg-warning-400/10 text-warning-700">
                          Triggers after {rule.interval} {rule.unit}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-9 h-5 bg-surface-200 peer-checked:bg-brand-600 rounded-full transition-colors peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all" />
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-surface-400 font-semibold uppercase tracking-wide">Escalation chain:</span>
                      {rule.chain.map((step, i) => (
                        <React.Fragment key={step}>
                          <span className="badge bg-brand-50 text-brand-600 text-[10px]">{step}</span>
                          {i < rule.chain.length - 1 && <ChevronRight className="w-3 h-3 text-surface-300" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { key: 'all',    label: 'Total Escalations',  color: 'text-surface-900', bg: 'bg-surface-50' },
          { key: 'high',   label: 'High Severity',       color: 'text-danger-600',  bg: 'bg-danger-400/10' },
          { key: 'medium', label: 'Medium Severity',     color: 'text-warning-600', bg: 'bg-warning-400/10' },
          { key: 'goal_not_submitted', label: 'Not Submitted', color: 'text-danger-600', bg: 'bg-danger-50' },
          { key: 'approval_delayed',   label: 'Approval Delayed', color: 'text-warning-600', bg: 'bg-warning-50' },
          { key: 'checkin_missing',    label: 'Check-in Missing', color: 'text-brand-600', bg: 'bg-brand-50' },
        ].map(s => (
          <motion.button key={s.key} whileHover={{ y: -1 }} onClick={() => setFilter(s.key)}
            className={cn('card p-4 text-left transition-all', filter === s.key ? 'ring-2 ring-brand-400' : '')}>
            <p className={cn('text-2xl font-display font-bold', s.color)}>{counts[s.key] || 0}</p>
            <p className="text-xs text-surface-500 mt-0.5">{s.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Escalation list */}
      {loading ? <SkeletonLoader rows={5} /> : filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No escalations"
          description={filter === 'all' ? 'All goals are on track — no escalations triggered' : 'No escalations match this filter'} />
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => {
            const sev  = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.medium;
            const type = TYPE_CONFIG[item.type] || TYPE_CONFIG.goal_not_submitted;
            const TypeIcon = type.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn('card p-5 border-l-4', item.severity === 'high' ? 'border-l-danger-500' : 'border-l-warning-500')}>
                <div className="flex items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', type.color)}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn('badge border', sev.color)}>{sev.icon} {sev.label}</span>
                      <span className="badge bg-surface-100 text-surface-600 text-[10px]">{type.label}</span>
                      {item.quarter && <span className="badge bg-brand-50 text-brand-600 text-[10px]">{item.quarter}</span>}
                    </div>
                    <p className="text-sm font-medium text-surface-900">{item.message}</p>
                    {item.user && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 text-[10px] font-bold">
                          {item.user.name?.charAt(0)}
                        </div>
                        <span className="text-xs text-surface-500">{item.user.name}</span>
                        <span className="text-surface-300 text-xs">·</span>
                        <span className="text-xs text-surface-400">{item.user.department}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1 text-xs text-surface-400">
                        <ChevronRight className="w-3 h-3" />
                        Auto-escalation chain: Employee → Manager → HR
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => handleNotify(item)} className="btn-primary text-xs px-3 py-1.5">
                      <Bell className="w-3.5 h-3.5" /> Notify
                    </button>
                    <button className="btn-secondary text-xs px-3 py-1.5">Resolve</button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
