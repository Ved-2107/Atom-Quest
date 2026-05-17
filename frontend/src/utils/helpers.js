import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter } from 'date-fns';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatDate = (date) => date ? format(new Date(date), 'dd MMM yyyy') : '—';
export const formatDateTime = (date) => date ? format(new Date(date), 'dd MMM yyyy, HH:mm') : '—';
export const timeAgo = (date) => date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '—';
export const isOverdue = (date) => date ? isAfter(new Date(), new Date(date)) : false;

// ─── BRD-Aligned UoM Types ────────────────────────────────────────────────────
// Per BRD Section 2.2 table:
// numeric_min = Higher is better, Formula: Achievement ÷ Target  (e.g. Sales Revenue)
// numeric_max = Lower is better,  Formula: Target ÷ Achievement  (e.g. TAT, Cost)
// timeline    = Date-based completion (Completion date vs Deadline)
// zero        = Zero = Success e.g. Safety incidents → 100% if 0, else 0%

export const UOM_LABELS = {
  numeric_min: 'Min – Higher is Better (Achievement ÷ Target)',
  numeric_max: 'Max – Lower is Better (Target ÷ Achievement)',
  timeline:    'Timeline – Date-based Completion',
  zero:        'Zero – Zero = Success (e.g. Incidents)',
};

export const UOM_SHORT = {
  numeric_min: 'Min',
  numeric_max: 'Max',
  timeline:    'Timeline',
  zero:        'Zero',
};

// Legacy mapping for older seeded data
const LEGACY_UOM = { max: 'numeric_min', min: 'numeric_max' };
const normalizeUom = (t) => LEGACY_UOM[t] || t;

export const calculateProgress = (goal) => {
  const uomType = normalizeUom(goal.uomType);
  const checkIns = goal.checkIns || [];
  // Pick latest quarter with data
  const order = ['Q4', 'Q3', 'Q2', 'Q1'];
  const latest = order.map(q => checkIns.find(c => c.quarter === q)).find(Boolean);
  if (!latest && uomType !== 'timeline') return 0;

  const achievement = latest?.achievement ?? 0;
  const target = goal.target || 1;
  let progress = 0;

  switch (uomType) {
    case 'numeric_min': // Higher is better: Achievement ÷ Target
      progress = Math.min((achievement / target) * 100, 100);
      break;
    case 'numeric_max': // Lower is better: Target ÷ Achievement
      progress = achievement === 0 ? 0 : Math.min((target / achievement) * 100, 100);
      break;
    case 'zero':        // Zero = 100%, else 0%
      progress = achievement === 0 ? 100 : 0;
      break;
    case 'timeline': {  // Completion date vs Deadline
      const now = Date.now();
      const start = new Date(goal.createdAt || Date.now()).getTime();
      const end = new Date(goal.deadline).getTime();
      if (end <= start) { progress = 100; break; }
      progress = Math.min(((now - start) / (end - start)) * 100, 100);
      break;
    }
    default: progress = 0;
  }
  return Math.round(Math.max(0, progress));
};

export const getStatusConfig = (status) => {
  const map = {
    draft:       { label: 'Draft',       color: 'text-surface-500', bg: 'bg-surface-100',      dot: 'bg-surface-400' },
    submitted:   { label: 'Submitted',   color: 'text-brand-600',   bg: 'bg-brand-50',          dot: 'bg-brand-400' },
    approved:    { label: 'Approved',    color: 'text-success-600', bg: 'bg-success-400/10',    dot: 'bg-success-500' },
    rejected:    { label: 'Rejected',    color: 'text-danger-600',  bg: 'bg-danger-400/10',     dot: 'bg-danger-500' },
    rework:      { label: 'Rework',      color: 'text-warning-600', bg: 'bg-warning-400/10',    dot: 'bg-warning-500' },
    not_started: { label: 'Not Started', color: 'text-surface-500', bg: 'bg-surface-100',      dot: 'bg-surface-400' },
    on_track:    { label: 'On Track',    color: 'text-brand-600',   bg: 'bg-brand-50',          dot: 'bg-brand-500' },
    completed:   { label: 'Completed',   color: 'text-success-600', bg: 'bg-success-400/10',    dot: 'bg-success-500' },
    delayed:     { label: 'Delayed',     color: 'text-danger-600',  bg: 'bg-danger-400/10',     dot: 'bg-danger-500' },
  };
  return map[status] || map.draft;
};

export const getProgressColor = (pct) => {
  if (pct >= 80) return 'bg-success-500';
  if (pct >= 50) return 'bg-brand-500';
  if (pct >= 25) return 'bg-warning-500';
  return 'bg-danger-500';
};

export const THRUST_AREAS = [
  'Business Growth', 'Customer Experience', 'Operational Excellence',
  'People Development', 'Innovation', 'Digital Transformation',
  'Risk & Compliance', 'Financial Performance',
];

export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// BRD Section 2.3 — Check-in Schedule
export const CHECKIN_SCHEDULE = [
  { phase: 'Goal Setting',  opensMonth: 5,  label: 'Phase 1 – Goal Setting',  action: 'Goal Creation, Submission & Approval', window: '1st May' },
  { phase: 'Q1',           opensMonth: 7,  label: 'Q1 Check-in',             action: 'Progress Update — Planned vs. Actual',  window: 'July' },
  { phase: 'Q2',           opensMonth: 10, label: 'Q2 Check-in',             action: 'Progress Update — Planned vs. Actual',  window: 'October' },
  { phase: 'Q3',           opensMonth: 1,  label: 'Q3 Check-in',             action: 'Progress Update — Planned vs. Actual',  window: 'January' },
  { phase: 'Q4',           opensMonth: 3,  label: 'Q4 / Annual',             action: 'Final Achievement Capture',             window: 'March / April' },
];

export const getCurrentPhase = () => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 5 && month < 7)  return 'Goal Setting';
  if (month >= 7 && month < 10) return 'Q1';
  if (month >= 10 && month < 12) return 'Q2';
  if (month === 12 || month < 3) return 'Q3';
  if (month >= 3 && month < 5)  return 'Q4';
  return 'Q4';
};

export const CHECK_IN_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'on_track',    label: 'On Track' },
  { value: 'completed',   label: 'Completed' },
  { value: 'delayed',     label: 'Delayed' },
];

export const downloadCSV = (data, filename) => {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

export const downloadExcel = (data, filename) => {
  // Simulate Excel export as CSV with .xls extension for hackathon demo
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const tsv = [
    headers.join('\t'),
    ...data.map(row => headers.map(h => String(row[h] ?? '')).join('\t'))
  ].join('\n');
  const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.xls`; a.click();
  URL.revokeObjectURL(url);
};

export const CHART_COLORS = [
  '#6272f3','#22c55e','#f97316','#ef4444','#a855f7',
  '#06b6d4','#eab308','#ec4899','#14b8a6','#f43f5e',
];
