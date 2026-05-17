import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Search, RefreshCw, Filter } from 'lucide-react';
import { EmptyState, SkeletonLoader } from '../../components/shared/index';
import { timeAgo, formatDateTime, cn } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ACTION_CONFIG = {
  CREATE: { label: 'Created', color: 'bg-brand-50 text-brand-700', icon: '✨' },
  UPDATE: { label: 'Updated', color: 'bg-surface-100 text-surface-600', icon: '✏️' },
  DELETE: { label: 'Deleted', color: 'bg-danger-400/10 text-danger-700', icon: '🗑️' },
  SUBMIT: { label: 'Submitted', color: 'bg-blue-50 text-blue-700', icon: '📤' },
  APPROVE: { label: 'Approved', color: 'bg-success-400/10 text-success-700', icon: '✅' },
  REJECT: { label: 'Rejected', color: 'bg-danger-400/10 text-danger-700', icon: '❌' },
  RETURN: { label: 'Returned', color: 'bg-warning-400/10 text-warning-700', icon: '↩️' },
  CHECKIN: { label: 'Check-in', color: 'bg-purple-50 text-purple-700', icon: '📋' },
  UNLOCK: { label: 'Unlocked', color: 'bg-orange-50 text-orange-700', icon: '🔓' },
  LOGIN: { label: 'Login', color: 'bg-surface-100 text-surface-600', icon: '🔑' },
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { limit: 25, page };
      if (entityFilter !== 'all') params.entity = entityFilter;
      const r = await api.get('/audit', { params });
      setLogs(r.data.data);
      setTotal(r.data.total);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, entityFilter]);

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      l.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const ENTITIES = ['all', 'Goal', 'GoalSheet', 'User'];
  const ACTIONS = ['all', 'CREATE', 'UPDATE', 'SUBMIT', 'APPROVE', 'REJECT', 'RETURN', 'CHECKIN', 'UNLOCK', 'LOGIN'];

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Complete activity trail — who changed what, when</p>
        </div>
        <button onClick={fetchLogs} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-64" placeholder="Search logs..." />
        </div>
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
          className="input w-36">
          {ENTITIES.map(e => <option key={e} value={e}>{e === 'all' ? 'All entities' : e}</option>)}
        </select>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input w-36">
          {ACTIONS.map(a => <option key={a} value={a}>{a === 'all' ? 'All actions' : a}</option>)}
        </select>
        <div className="flex items-center gap-2 ml-auto text-xs text-surface-400">
          <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
          {total} total events
        </div>
      </div>

      {loading ? <SkeletonLoader rows={6} /> : filtered.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit logs" description="Activity will appear here as users interact with the system" />
      ) : (
        <div className="space-y-2">
          {filtered.map((log, i) => {
            const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
            return (
              <motion.div key={log._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card p-4 flex gap-4 items-start hover:bg-surface-50 transition-colors">
                {/* Timeline dot */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center text-base">
                    {cfg.icon}
                  </div>
                  {i < filtered.length - 1 && <div className="w-px h-3 bg-surface-100 mt-1" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={cn('badge text-xs', cfg.color)}>{cfg.label}</span>
                    <span className="badge bg-surface-100 text-surface-500 text-[10px]">{log.entity}</span>
                    <span className="text-xs text-surface-400">{timeAgo(log.createdAt)}</span>
                  </div>
                  <p className="text-sm text-surface-700">{log.description || `${log.action} on ${log.entity}`}</p>
                  {log.userId && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-5 h-5 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 text-[10px] font-bold">
                        {log.userId.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-xs text-surface-500">{log.userId.name}</span>
                      <span className="text-[10px] text-surface-300">·</span>
                      <span className={cn('text-[10px] font-medium capitalize',
                        log.userId.role === 'admin' ? 'text-orange-500' :
                        log.userId.role === 'manager' ? 'text-purple-500' : 'text-brand-500')}>
                        {log.userId.role}
                      </span>
                    </div>
                  )}

                  {(log.oldValue || log.newValue) && (
                    <div className="mt-2 flex gap-3 text-[11px]">
                      {log.oldValue && (
                        <div className="px-2 py-1 rounded-lg bg-danger-400/5 border border-danger-400/20">
                          <span className="text-danger-600 font-medium">Before: </span>
                          <span className="text-surface-500 font-mono">{JSON.stringify(log.oldValue).slice(0, 60)}</span>
                        </div>
                      )}
                      {log.newValue && (
                        <div className="px-2 py-1 rounded-lg bg-success-400/5 border border-success-400/20">
                          <span className="text-success-600 font-medium">After: </span>
                          <span className="text-surface-500 font-mono">{JSON.stringify(log.newValue).slice(0, 60)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-surface-300">{formatDateTime(log.createdAt)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4">← Prev</button>
          <span className="text-sm text-surface-500">Page {page} of {Math.ceil(total / 25)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 25)} className="btn-secondary px-4">Next →</button>
        </div>
      )}
    </div>
  );
}
