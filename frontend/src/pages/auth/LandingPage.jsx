import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Target, BarChart3, Users, CheckCircle, ArrowRight, Star } from 'lucide-react';

const FEATURES = [
  { icon: Target, title: 'Smart Goal Setting', desc: 'Create SMART goals with weighted KPIs, UoM types, and thrust area alignment.' },
  { icon: CheckCircle, title: 'Approval Workflows', desc: 'Structured manager review with inline editing, comments, and approval tracking.' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Live dashboards with progress heatmaps, trend charts, and completion rates.' },
  { icon: Users, title: 'Team Performance', desc: 'Manager insights, team views, and quarterly check-in reviews in one place.' },
];

const STATS = [
  { value: '98%', label: 'Goal Completion Rate' },
  { value: '3x', label: 'Faster Approvals' },
  { value: '500+', label: 'Enterprise Clients' },
  { value: '4.9★', label: 'User Rating' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-surface-900">GoalFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/login" className="btn-primary text-sm">Get Started <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="absolute top-20 right-20 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold mb-6">
              <Star className="w-3 h-3" /> Enterprise Goal Management Platform
            </span>
            <h1 className="text-5xl sm:text-6xl font-display font-extrabold text-surface-900 leading-tight mb-6">
              Align. Track. <span className="text-gradient">Achieve.</span>
            </h1>
            <p className="text-lg text-surface-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              GoalFlow is the enterprise-grade goal setting and performance tracking platform that connects employee objectives to business outcomes — with real-time analytics and structured approval workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="btn-primary px-8 py-3 text-base shadow-brand">
                Launch Demo <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="btn-secondary px-8 py-3 text-base">
                See Features
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-surface-900">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <p className="text-3xl font-display font-extrabold text-white">{s.value}</p>
              <p className="text-surface-400 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-surface-900 mb-4">Everything you need for performance excellence</h2>
            <p className="text-surface-500 max-w-xl mx-auto">From goal creation to quarterly check-ins, GoalFlow handles the entire performance management lifecycle.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="card p-6 flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 mb-1">{title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-brand-600 to-brand-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-display font-bold text-white mb-4">Ready to transform performance management?</h2>
          <p className="text-brand-200 mb-8">Try the live demo with pre-loaded data across all three roles.</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-700 rounded-xl font-semibold hover:bg-brand-50 transition-colors shadow-lg">
            Launch Demo Portal <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-surface-100 text-center text-sm text-surface-400">
        <p>© 2025 GoalFlow · Built for enterprise performance management</p>
      </footer>
    </div>
  );
}
