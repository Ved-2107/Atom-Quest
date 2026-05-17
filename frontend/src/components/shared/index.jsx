import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNotificationsStore } from '../../store';
import { cn, timeAgo, getStatusConfig, getProgressColor } from '../../utils/helpers';

// ── NotificationPanel ────────────────────────────────────────────────────────
export function NotificationPanel({ onClose }) {
  const { notifications, unread, markRead, markAllRead } = useNotificationsStore();

  const typeIcon = (type) => {
    const map = { success: '✅', warning: '⚠️', error: '❌', reminder: '🔔', info: 'ℹ️' };
    return map[type] || 'ℹ️';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-glass border border-surface-100 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-surface-600" />
          <span className="font-semibold text-sm">Notifications</span>
          {unread > 0 && <span className="badge bg-brand-50 text-brand-600">{unread} new</span>}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-ghost p-1.5 text-xs">
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-surface-400 text-sm">No notifications</div>
        ) : notifications.map(n => (
          <button key={n._id} onClick={() => markRead(n._id)}
            className={cn('flex gap-3 w-full text-left px-4 py-3 hover:bg-surface-50 transition-colors border-b border-surface-50 last:border-0',
              !n.isRead && 'bg-brand-50/50')}>
            <span className="text-base mt-0.5">{typeIcon(n.type)}</span>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', !n.isRead ? 'text-surface-900' : 'text-surface-600')}>{n.title}</p>
              <p className="text-xs text-surface-400 mt-0.5 leading-relaxed">{n.message}</p>
              <p className="text-[10px] text-surface-300 mt-1">{timeAgo(n.createdAt)}</p>
            </div>
            {!n.isRead && <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default NotificationPanel;

// ── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status, size = 'sm' }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={cn('badge', cfg.bg, cfg.color, size === 'xs' ? 'text-[10px] px-2' : '')}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, showLabel = true, size = 'md', className }) {
  const pct = Math.min(100, Math.max(0, value));
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-surface-400">Progress</span>
          <span className="text-xs font-semibold text-surface-700">{pct}%</span>
        </div>
      )}
      <div className={cn('w-full bg-surface-100 rounded-full overflow-hidden', heights[size])}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', getProgressColor(pct))} />
      </div>
    </div>
  );
}

// ── KpiCard ──────────────────────────────────────────────────────────────────
export function KpiCard({ title, value, subtitle, icon: Icon, trend, color = 'brand', loading }) {
  const colors = {
    brand: 'from-brand-500 to-brand-600 shadow-brand',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    danger: 'from-danger-500 to-danger-600',
    purple: 'from-purple-500 to-purple-600',
  };
  if (loading) return (
    <div className="stat-card">
      <div className="shimmer h-4 w-24 rounded-lg" />
      <div className="shimmer h-8 w-16 rounded-lg" />
    </div>
  );
  return (
    <motion.div whileHover={{ y: -2 }} className="stat-card relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-display font-bold text-surface-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-surface-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-sm', colors[color])}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          <span className={cn('text-xs font-medium', trend >= 0 ? 'text-success-600' : 'text-danger-600')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-surface-400">vs last quarter</span>
        </div>
      )}
    </motion.div>
  );
}

// ── SkeletonLoader ────────────────────────────────────────────────────────────
export function SkeletonLoader({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-4 flex gap-4 items-center">
          <div className="shimmer w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="shimmer h-4 rounded-lg w-3/4" />
            <div className="shimmer h-3 rounded-lg w-1/2" />
          </div>
          <div className="shimmer h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-surface-400" />
      </div>}
      <h3 className="font-semibold text-surface-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
