// RoleSwitcher.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, Users, Shield, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';
import { cn } from '../../utils/helpers';

const ROLES = [
  { key: 'employee', label: 'Employee', icon: User, color: 'text-brand-600 bg-brand-50' },
  { key: 'manager', label: 'Manager', icon: Users, color: 'text-purple-600 bg-purple-50' },
  { key: 'admin', label: 'Admin / HR', icon: Shield, color: 'text-orange-600 bg-orange-50' },
];

export default function RoleSwitcher() {
  const { user, switchRole } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSwitch = async (role) => {
    if (role === user?.role) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    try {
      await switchRole(role);
      toast.success(`Switched to ${role} view`);
      navigate('/dashboard');
    } catch {
      toast.error('Failed to switch role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="btn-ghost w-full text-xs text-surface-500 justify-between">
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        <span>🎭 Demo: Switch Role</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-2xl shadow-glass border border-surface-100 p-2 z-50">
            <p className="text-[10px] text-surface-400 px-2 mb-1 uppercase tracking-widest font-medium">Switch Demo Role</p>
            {ROLES.map(({ key, label, icon: Icon, color }) => (
              <button key={key} onClick={() => handleSwitch(key)}
                className={cn('flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-surface-50',
                  user?.role === key ? 'bg-surface-50' : '')}>
                <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', color)}>
                  <Icon className="w-3 h-3" />
                </div>
                {label}
                {user?.role === key && <span className="ml-auto text-[10px] text-surface-400">Current</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
