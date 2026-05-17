import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { CHECKIN_SCHEDULE, getCurrentPhase, cn } from '../../utils/helpers';

const PHASE_COLORS = {
  'Goal Setting': 'from-brand-500 to-brand-700',
  'Q1':           'from-purple-500 to-purple-700',
  'Q2':           'from-orange-500 to-orange-700',
  'Q3':           'from-teal-500 to-teal-700',
  'Q4':           'from-green-500 to-green-700',
};

export default function CheckInScheduleBanner({ compact = false }) {
  const currentPhase = getCurrentPhase();

  if (compact) {
    const current = CHECKIN_SCHEDULE.find(s => s.phase === currentPhase);
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${PHASE_COLORS[currentPhase] || 'from-brand-500 to-brand-700'} text-white text-xs font-medium`}>
        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
        {current?.label || currentPhase} Active
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="card mb-6 overflow-hidden">
      <div className={`bg-gradient-to-r ${PHASE_COLORS[currentPhase]} p-4`}>
        <div className="flex items-center gap-2 text-white">
          <Calendar className="w-4 h-4" />
          <span className="font-semibold text-sm">Check-in Schedule — FY 2025-26</span>
          <span className="ml-auto text-white/70 text-xs">BRD Section 2.3</span>
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {CHECKIN_SCHEDULE.map((s, i) => {
            const isActive = s.phase === currentPhase;
            const isPast   = CHECKIN_SCHEDULE.findIndex(x => x.phase === currentPhase) > i;
            return (
              <React.Fragment key={s.phase}>
                <div className={cn(
                  'flex flex-col items-center px-4 py-3 rounded-xl text-center min-w-[120px] transition-all',
                  isActive ? 'bg-brand-600 text-white shadow-brand' :
                  isPast   ? 'bg-success-400/10 text-success-700' :
                             'bg-surface-50 text-surface-500'
                )}>
                  {isPast
                    ? <CheckCircle className="w-4 h-4 mb-1 text-success-500" />
                    : isActive
                      ? <Clock className="w-4 h-4 mb-1 animate-pulse" />
                      : <Calendar className="w-4 h-4 mb-1 opacity-40" />
                  }
                  <p className={cn('text-xs font-bold mb-0.5', isActive ? 'text-white' : '')}>{s.label}</p>
                  <p className={cn('text-[10px]', isActive ? 'text-white/80' : 'text-surface-400')}>{s.window}</p>
                  {isActive && <span className="mt-1 text-[9px] bg-white/20 px-2 py-0.5 rounded-full">● Active</span>}
                </div>
                {i < CHECKIN_SCHEDULE.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-surface-300 self-center flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
