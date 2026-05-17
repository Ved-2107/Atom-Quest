import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, Loader2, User, Users, Shield, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';
import { cn } from '../../utils/helpers';

const DEMO_ACCOUNTS = [
  { role: 'employee', email: 'employee@demo.com', label: 'Employee', icon: User, color: 'border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700' },
  { role: 'manager', email: 'manager@demo.com', label: 'Manager', icon: Users, color: 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700' },
  { role: 'admin', email: 'admin@demo.com', label: 'Admin', icon: Shield, color: 'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (acc) => {
    setLoading(true);
    setEmail(acc.email);
    setPassword('password123');
    try {
      await login(acc.email, 'password123');
      toast.success(`Logged in as ${acc.label}`);
      navigate('/dashboard');
    } catch {
      toast.error('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-brand-700 to-brand-900 p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-white">GoalFlow</span>
        </div>

        <div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-4xl font-display font-extrabold text-white leading-tight mb-4">
              Your goals.<br />Your growth.<br />Your story.
            </h2>
            <p className="text-brand-200 text-lg leading-relaxed">
              Set meaningful goals, track quarterly progress, and unlock your full potential with data-driven insights.
            </p>
          </motion.div>

          <div className="mt-12 space-y-4">
            {['Goal setting with weighted KPIs', 'Manager approval workflows', 'Quarterly check-ins & analytics'].map((f, i) => (
              <motion.div key={f} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 text-brand-100 text-sm">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                  </svg>
                </div>
                {f}
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-brand-400 text-sm">© 2025 GoalFlow Enterprise</p>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl">GoalFlow</span>
          </div>

          <h1 className="text-2xl font-display font-bold text-surface-900 mb-1">Welcome back</h1>
          <p className="text-surface-500 text-sm mb-8">Sign in to your performance portal</p>

          {/* Quick Demo Access */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-widest mb-3">⚡ Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.role} onClick={() => quickLogin(acc)} disabled={loading}
                  className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all', acc.color)}>
                  <acc.icon className="w-4 h-4" />
                  {acc.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-surface-400 mt-2 text-center">Password: password123</p>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-surface-200" />
            <span className="text-xs text-surface-400">or sign in manually</span>
            <div className="flex-1 h-px bg-surface-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input pl-10" placeholder="you@company.com" required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input pl-10 pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-base">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-surface-400 mt-6">
            <Link to="/" className="text-brand-600 hover:underline">← Back to home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
