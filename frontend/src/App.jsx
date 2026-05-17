import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import api from './utils/api';
import AppLayout from './components/layout/AppLayout';

// Auth
import LoginPage   from './pages/auth/LoginPage';
import LandingPage from './pages/auth/LandingPage';

// Employee
import EmployeeDashboard from './pages/employee/Dashboard';
import GoalSheet         from './pages/employee/GoalSheet';
import QuarterlyUpdates  from './pages/employee/QuarterlyUpdates';
import GoalHistory       from './pages/employee/GoalHistory';

// Manager
import ManagerDashboard from './pages/manager/Dashboard';
import ApprovalsQueue   from './pages/manager/ApprovalsQueue';
import CheckInReview    from './pages/manager/CheckInReview';
import TeamView         from './pages/manager/TeamView';

// Admin
import AdminDashboard       from './pages/admin/Dashboard';
import ReportsPage          from './pages/admin/Reports';
import AuditLogs            from './pages/admin/AuditLogs';
import CycleManagement      from './pages/admin/CycleManagement';
import CompletionDashboard  from './pages/admin/CompletionDashboard';
import EscalationModule     from './pages/admin/EscalationModule';
import ManagerEffectiveness from './pages/admin/ManagerEffectiveness';
import IntegrationsPage     from './pages/admin/IntegrationsPage';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const RoleDashboard = () => {
  const { user } = useAuthStore();
  if (user?.role === 'admin')   return <AdminDashboard />;
  if (user?.role === 'manager') return <ManagerDashboard />;
  return <EmployeeDashboard />;
};

export default function App() {
  const { token } = useAuthStore();
  useEffect(() => {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [token]);

  return (
    <Routes>
      <Route path="/"      element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<RoleDashboard />} />

        {/* Employee */}
        <Route path="goals"             element={<ProtectedRoute roles={['employee','manager','admin']}><GoalSheet /></ProtectedRoute>} />
        <Route path="quarterly-updates" element={<ProtectedRoute roles={['employee','manager','admin']}><QuarterlyUpdates /></ProtectedRoute>} />
        <Route path="goal-history"      element={<ProtectedRoute roles={['employee','manager','admin']}><GoalHistory /></ProtectedRoute>} />

        {/* Manager */}
        <Route path="approvals"         element={<ProtectedRoute roles={['manager','admin']}><ApprovalsQueue /></ProtectedRoute>} />
        <Route path="team"              element={<ProtectedRoute roles={['manager','admin']}><TeamView /></ProtectedRoute>} />
        <Route path="check-in-review"   element={<ProtectedRoute roles={['manager','admin']}><CheckInReview /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="analytics"          element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="reports"            element={<ProtectedRoute roles={['admin','manager']}><ReportsPage /></ProtectedRoute>} />
        <Route path="audit-logs"         element={<ProtectedRoute roles={['admin']}><AuditLogs /></ProtectedRoute>} />
        <Route path="cycles"             element={<ProtectedRoute roles={['admin']}><CycleManagement /></ProtectedRoute>} />
        <Route path="completion"         element={<ProtectedRoute roles={['admin','manager']}><CompletionDashboard /></ProtectedRoute>} />
        <Route path="escalations"        element={<ProtectedRoute roles={['admin']}><EscalationModule /></ProtectedRoute>} />
        <Route path="manager-effectiveness" element={<ProtectedRoute roles={['admin']}><ManagerEffectiveness /></ProtectedRoute>} />
        <Route path="integrations"       element={<ProtectedRoute roles={['admin']}><IntegrationsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
