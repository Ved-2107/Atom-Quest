import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Target, CalendarCheck, History, Users, CheckSquare,
  ClipboardList, BarChart3, FileText, ScrollText, Settings2,
  Bell, ChevronDown, LogOut, Moon, Sun, Menu, X, Zap,
  AlertTriangle, TrendingUp, Link2, CheckCircle2
} from 'lucide-react';
import { useAuthStore, useUIStore, useNotificationsStore } from '../../store';
import { cn } from '../../utils/helpers';
import RoleSwitcher from '../shared/RoleSwitcher';
import { NotificationPanel } from '../shared/index';

const NAV = {
  employee: [
    { to:'/dashboard',        icon:LayoutDashboard, label:'Dashboard' },
    { to:'/goals',            icon:Target,          label:'My Goals' },
    { to:'/quarterly-updates',icon:CalendarCheck,   label:'Quarterly Updates' },
    { to:'/goal-history',     icon:History,         label:'Goal History' },
  ],
  manager: [
    { to:'/dashboard',        icon:LayoutDashboard, label:'Dashboard' },
    { to:'/goals',            icon:Target,          label:'My Goals' },
    { to:'/approvals',        icon:CheckSquare,     label:'Approvals', badge:true },
    { to:'/team',             icon:Users,           label:'My Team' },
    { to:'/check-in-review',  icon:ClipboardList,   label:'Check-in Review' },
    { to:'/completion',       icon:CheckCircle2,    label:'Completion View' },
    { to:'/reports',          icon:FileText,        label:'Reports' },
    { to:'/integrations',     icon:Link2,           label:'Integrations' },
  ],
  admin: [
    { to:'/dashboard',            icon:LayoutDashboard,  label:'Dashboard' },
    { to:'/analytics',            icon:BarChart3,        label:'Analytics' },
    { to:'/approvals',            icon:CheckSquare,      label:'Approvals' },
    { to:'/team',                 icon:Users,            label:'All Employees' },
    { to:'/check-in-review',      icon:ClipboardList,    label:'Check-in Review' },
    { to:'/completion',           icon:CheckCircle2,     label:'Completion Dashboard' },
    { to:'/manager-effectiveness',icon:TrendingUp,       label:'Mgr Effectiveness' },
    { to:'/escalations',          icon:AlertTriangle,    label:'Escalations' },
    { to:'/reports',              icon:FileText,         label:'Reports' },
    { to:'/audit-logs',           icon:ScrollText,       label:'Audit Logs' },
    { to:'/cycles',               icon:Settings2,        label:'Cycle Mgmt' },
    { to:'/integrations',         icon:Link2,            label:'Integrations' },
  ],
};

const ROLE_COLORS = { employee:'bg-brand-600', manager:'bg-purple-600', admin:'bg-orange-600' };

export default function AppLayout() {
  const { user, logout }                               = useAuthStore();
  const { sidebarOpen, darkMode, toggleSidebar, toggleDarkMode } = useUIStore();
  const { notifications, unread, fetchNotifications }  = useNotificationsStore();
  const [notifOpen, setNotifOpen]   = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { fetchNotifications(); }, []);

  const navItems = NAV[user?.role] || NAV.employee;
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'U';
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={cn('flex h-screen overflow-hidden bg-surface-50', darkMode && 'dark')}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside initial={{ x:-280, opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:-280, opacity:0 }}
            transition={{ duration:0.25, ease:'easeOut' }}
            className="fixed left-0 top-0 bottom-0 z-40 w-[260px] bg-white border-r border-surface-100 flex flex-col shadow-sm">

            {/* Logo */}
            <div className="flex items-center gap-3 px-5 h-16 border-b border-surface-100 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
                <Zap className="w-4 h-4 text-white"/>
              </div>
              <div>
                <p className="font-display font-bold text-surface-900 text-lg leading-tight">GoalFlow</p>
                <p className="text-[10px] text-surface-400 uppercase tracking-widest">Enterprise</p>
              </div>
            </div>

            {/* User card */}
            <div className="mx-4 mt-4 mb-2 p-3 rounded-2xl bg-gradient-to-br from-brand-50 to-surface-50 border border-brand-100">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm', ROLE_COLORS[user?.role])}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-900 truncate">{user?.name}</p>
                  <p className="text-xs text-surface-400 truncate capitalize">{user?.role} · {user?.department}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
              <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest px-3 mb-2">Navigation</p>
              <div className="space-y-0.5">
                {navItems.map(({ to, icon:Icon, label, badge }) => (
                  <NavLink key={to} to={to}
                    className={({ isActive }) => cn('sidebar-link', isActive && 'active')}>
                    <Icon className="w-4 h-4 flex-shrink-0"/>
                    <span className="flex-1">{label}</span>
                    {badge && unread > 0 && (
                      <span className="bg-danger-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-surface-100 space-y-1">
              <RoleSwitcher/>
              <button onClick={handleLogout} className="btn-ghost w-full text-danger-500 hover:bg-danger-50 hover:text-danger-600">
                <LogOut className="w-4 h-4"/> Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className={cn('flex flex-col flex-1 min-w-0 transition-all duration-250', sidebarOpen ? 'ml-[260px]' : 'ml-0')}>
        {/* Navbar */}
        <header className="h-16 bg-white border-b border-surface-100 flex items-center gap-4 px-6 flex-shrink-0 z-30">
          <button onClick={toggleSidebar} className="btn-ghost p-2">
            {sidebarOpen ? <X className="w-4 h-4"/> : <Menu className="w-4 h-4"/>}
          </button>
          <div className="flex-1"/>

          <button onClick={toggleDarkMode} className="btn-ghost p-2">
            {darkMode ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="btn-ghost p-2 relative">
              <Bell className="w-4 h-4"/>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)}/>}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-50 transition-colors">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold', ROLE_COLORS[user?.role])}>
                {initials}
              </div>
              <span className="text-sm font-medium text-surface-700 hidden sm:block">{user?.name?.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-surface-400"/>
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:4 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-glass border border-surface-100 p-2 z-50">
                  <div className="px-3 py-2 mb-1">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs text-surface-400">{user?.email}</p>
                    <p className="text-[10px] text-surface-300 mt-0.5 capitalize">{user?.role} · {user?.department}</p>
                  </div>
                  <div className="border-t border-surface-100 pt-1">
                    <button onClick={handleLogout} className="btn-ghost w-full text-sm text-danger-500">
                      <LogOut className="w-4 h-4"/> Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <motion.div key={location.pathname}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }}>
              <Outlet/>
            </motion.div>
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={toggleSidebar}/>
      )}
    </div>
  );
}
