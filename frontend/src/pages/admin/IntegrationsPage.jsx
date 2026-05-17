import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MessageSquare, Bell, Check, ExternalLink, Settings, ChevronRight, Shield, Users, Link2, Zap } from 'lucide-react';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ── Teams Adaptive Card ───────────────────────────────────────────────────────
function TeamsCard({ title, sender, action, type }) {
  const [done, setDone] = useState(false);
  const borderColor = { submission:'border-brand-400', approval:'border-success-500', reminder:'border-warning-500' }[type] || 'border-surface-200';
  return (
    <div className={`bg-white rounded-xl border-l-4 ${borderColor} shadow-card p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#6264A7] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">T</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#6264A7]">GoalFlow Bot</p>
          <p className="text-[10px] text-surface-400">via Microsoft Teams</p>
        </div>
        <span className="text-[10px] text-surface-400 flex-shrink-0">Just now</span>
      </div>
      <p className="text-sm font-semibold text-surface-900 mb-1">{title}</p>
      <p className="text-xs text-surface-500 mb-2">From: <strong>{sender}</strong></p>
      <p className="text-xs text-surface-600 bg-surface-50 rounded-lg p-2 mb-3 leading-relaxed">{action}</p>
      <div className="flex gap-2">
        <button onClick={() => { setDone(true); toast.success('Opened in Teams!'); }}
          className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all',
            done ? 'bg-success-500 text-white' : 'bg-[#6264A7] text-white hover:bg-[#4f51a3]')}>
          {done ? <span className="flex items-center justify-center gap-1"><Check className="w-3 h-3"/>Done</span> : 'View Goal Sheet'}
        </button>
        <button className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs text-surface-600 hover:bg-surface-50">
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ── Email Preview ─────────────────────────────────────────────────────────────
function EmailPreview({ subject, to, preview, type }) {
  const [sent, setSent] = useState(false);
  const icons = { approval:'✅', reminder:'🔔', rejection:'❌', submission:'📤' };
  return (
    <div className="border border-surface-100 rounded-xl overflow-hidden hover:shadow-card transition-all">
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-50 border-b border-surface-100">
        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-base flex-shrink-0">
          {icons[type] || '📧'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-900 truncate">{subject}</p>
          <p className="text-[10px] text-surface-400">To: {to}</p>
        </div>
        <button onClick={() => { setSent(true); toast.success(`Email queued to ${to}`); }}
          className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0',
            sent ? 'bg-success-500 text-white' : 'bg-brand-600 text-white hover:bg-brand-700')}>
          {sent ? '✓ Sent' : 'Send'}
        </button>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-surface-500 leading-relaxed">{preview}</p>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-brand-600 cursor-pointer hover:underline flex items-center gap-1">
            <ExternalLink className="w-3 h-3"/> Deep-link to Goal Sheet
          </span>
          <span className="text-surface-200 text-[10px]">·</span>
          <span className="text-[10px] text-surface-400">GoalFlow Notification Engine</span>
        </div>
      </div>
    </div>
  );
}

const TEAMS_CARDS = [
  { title:'New Goal Sheet Submitted', sender:'Rahul Verma', type:'submission',
    action:'Rahul has submitted 6 goals for FY 2025-26 with 100% weightage. Total goals: 6. Approval required by May 31.' },
  { title:'Q2 Check-in Window Open 🔔', sender:'GoalFlow System', type:'reminder',
    action:'Q2 check-in window closes October 31. 4 team members have not yet submitted progress updates. Please follow up.' },
  { title:'Goal Approved ✅', sender:'Priya Sharma (Manager)', type:'approval',
    action:'Your goal "Deliver 5 Major Product Features" has been approved and locked. Target: 5 features, Weightage: 25%.' },
];

const EMAILS = [
  { subject:'Goal Sheet Submitted — Rahul Verma', to:'manager@demo.com', type:'submission',
    preview:'Hi Priya, Rahul Verma has submitted 6 goals for FY 2025-26 totalling 100% weightage. Please review and approve by May 31, 2025. Deep-link: [Open GoalFlow]' },
  { subject:'⏰ Reminder: Goal Awaits Your Approval', to:'manager@demo.com', type:'reminder',
    preview:"Reminder: Anjali Singh's goal sheet has been pending your approval for 5 days. Please review to keep the team on track for the FY 2025-26 cycle." },
  { subject:'Your Goal Has Been Approved ✅', to:'employee@demo.com', type:'approval',
    preview:'Hi Rahul! Great news — your goal "Deliver 5 Major Product Features" has been approved by Priya Sharma. Your goal sheet is now locked. Start working towards your Q1 targets!' },
  { subject:'Goal Returned for Revision ↩️', to:'employee@demo.com', type:'rejection',
    preview:"Hi Rahul, your goal 'API Response Time <200ms' has been returned for revision. Manager feedback: Please add more specific measurement criteria, milestone dates, and intermediate targets per quarter." },
];

const NOTIFICATION_TRIGGERS = [
  { event:'Goal Submitted',       recipients:'Manager',          enabled:true  },
  { event:'Goal Approved',        recipients:'Employee',          enabled:true  },
  { event:'Goal Rejected/Return', recipients:'Employee',          enabled:true  },
  { event:'Check-in Reminder',    recipients:'Employee + Manager',enabled:true  },
  { event:'Deadline Approaching', recipients:'Employee',          enabled:false },
  { event:'Escalation Triggered', recipients:'Manager + HR',      enabled:true  },
  { event:'Weekly Digest',        recipients:'All Users',         enabled:false },
  { event:'Cycle Opening',        recipients:'All Employees',     enabled:true  },
];

export default function IntegrationsPage() {
  const [azureConnected,  setAzure]  = useState(false);
  const [teamsConnected,  setTeams]  = useState(false);
  const [activeTab, setTab]          = useState('email');
  const [triggers, setTriggers]      = useState(NOTIFICATION_TRIGGERS.map(t => ({ ...t })));

  const toggleTrigger = (i) => {
    setTriggers(prev => prev.map((t, idx) => idx === i ? { ...t, enabled: !t.enabled } : t));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Integrations & Notifications</h1>
        <p className="page-subtitle">Microsoft Entra ID SSO · Teams Bot · Email Notification Engine — BRD §5.1, §5.2</p>
      </div>

      {/* Azure AD */}
      <div className="card p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0078D4]/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-[#0078D4]"/>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="font-semibold text-surface-900">Microsoft Entra ID (Azure AD)</h3>
              <span className={cn('badge', azureConnected ? 'bg-success-400/10 text-success-700' : 'bg-surface-100 text-surface-500')}>
                {azureConnected ? '✓ Connected' : '○ Not Connected'}
              </span>
            </div>
            <p className="text-sm text-surface-500 mb-4">Single Sign-On for all employees. Auto-sync org hierarchy and role assignments from Azure AD groups — BRD §5.1</p>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              {[
                { icon:Users,  label:'SSO Login',       desc:'Sign in with M365 credentials' },
                { icon:Link2,  label:'Org Hierarchy',   desc:'Reporting lines synced from AD' },
                { icon:Shield, label:'Role Mapping',    desc:'Roles auto-assigned from AD groups' },
              ].map(({ icon:Icon, label, desc }) => (
                <div key={label} className="p-3 rounded-xl bg-[#0078D4]/5 border border-[#0078D4]/20">
                  <Icon className="w-4 h-4 text-[#0078D4] mb-1.5"/>
                  <p className="text-xs font-semibold text-surface-800">{label}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setAzure(v => !v); toast.success(azureConnected ? 'Azure AD disconnected' : '🔗 Azure AD connected (demo mode)'); }}
              className={azureConnected ? 'btn-secondary text-sm' : 'btn-primary text-sm'}>
              {azureConnected ? 'Disconnect Azure AD' : 'Connect Azure AD'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-surface-100 rounded-xl p-1 gap-1 w-fit mb-6">
        {[
          { key:'email',  label:'📧 Email Notifications' },
          { key:'teams',  label:'💬 Teams Integration'   },
        ].map(tab => (
          <button key={tab.key} onClick={() => setTab(tab.key)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500 hover:text-surface-700')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Email Tab */}
      {activeTab === 'email' && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-surface-900">Email Notification Queue</h3>
                <button onClick={() => toast.success('All 4 emails queued!')} className="btn-primary text-sm">
                  <Mail className="w-4 h-4"/> Send All
                </button>
              </div>
              {EMAILS.map((e, i) => <EmailPreview key={i} {...e}/>)}
            </div>
            <div className="card p-5 h-fit">
              <h3 className="font-semibold text-surface-900 mb-4">Notification Triggers</h3>
              <div className="space-y-2">
                {triggers.map((t, i) => (
                  <div key={t.event} className="flex items-center justify-between py-2 border-b border-surface-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{t.event}</p>
                      <p className="text-[10px] text-surface-400">→ {t.recipients}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" checked={t.enabled} onChange={() => toggleTrigger(i)} className="sr-only peer"/>
                      <div className="w-9 h-5 bg-surface-200 peer-checked:bg-brand-600 rounded-full transition-colors
                        relative after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4
                        after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"/>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6264A7] flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white"/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900">GoalFlow Teams Bot</h3>
                    <span className={cn('badge text-[10px]', teamsConnected ? 'bg-success-400/10 text-success-700' : 'bg-surface-100 text-surface-500')}>
                      {teamsConnected ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { setTeams(v => !v); toast.success(teamsConnected ? 'Teams Bot disconnected' : '💬 Teams Bot connected (demo)'); }}
                  className={cn('text-sm', teamsConnected ? 'btn-secondary' : 'btn-primary bg-[#6264A7] hover:bg-[#4f51a3]')}>
                  {teamsConnected ? 'Disconnect' : 'Connect Teams'}
                </button>
              </div>
              <p className="text-sm text-surface-500 mb-5">Adaptive card notifications with deep-link support directly to goal sheets. BRD §5.2</p>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-widest">Live Adaptive Card Previews</p>
                {TEAMS_CARDS.map((c, i) => <TeamsCard key={i} {...c}/>)}
              </div>
            </div>
            <div className="card p-5 h-fit">
              <h3 className="font-semibold text-surface-900 mb-4">Bot Configuration</h3>
              <div className="space-y-2">
                {[
                  { label:'Goal submission alert',  on:true },
                  { label:'Approval notifications', on:true },
                  { label:'Check-in reminders',     on:true },
                  { label:'Escalation alerts',      on:true },
                  { label:'Weekly performance digest', on:false },
                  { label:'Manager effectiveness',  on:false },
                ].map((item, i) => (
                  <label key={item.label} className="flex items-center justify-between cursor-pointer py-1.5">
                    <span className="text-sm text-surface-700">{item.label}</span>
                    <input type="checkbox" defaultChecked={item.on} className="rounded accent-brand-600"/>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-surface-100">
                <p className="text-xs text-surface-500 mb-2">Incoming Webhook URL</p>
                <div className="flex gap-2">
                  <input defaultValue="https://outlook.office.com/webhook/…" readOnly
                    className="input text-xs flex-1 font-mono"/>
                  <button onClick={() => toast.success('Copied!')} className="btn-secondary text-xs px-3 flex-shrink-0">
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
