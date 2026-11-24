import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { UserRole } from '@/src/types';
import { useAuth } from '@/src/hooks/useAuth';
import { ProtectedRoute } from '@/src/routes/ProtectedRoute';

import { LoginPage } from '@/src/pages/auth/LoginPage';
import { AdminDashboard } from '@/src/pages/admin/AdminDashboard';
import { EmployeeManagementPage } from '@/src/pages/admin/EmployeeManagementPage';
import { DepartmentManagementPage } from '@/src/pages/admin/DepartmentManagementPage';
import { LeaveManagementPage } from '@/src/pages/admin/LeaveManagementPage';
import { LeavePoliciesPage } from '@/src/pages/admin/LeavePoliciesPage';
import { ReportsAnalyticsPage } from '@/src/pages/admin/ReportsAnalyticsPage';
import { SettingsPage } from '@/src/pages/admin/SettingsPage';

import { ManagerDashboard } from '@/src/pages/manager/ManagerDashboard';
import { MyTeamPage } from '@/src/pages/manager/MyTeamPage';
import { PendingApprovalsPage } from '@/src/pages/manager/PendingApprovalsPage';
import { TeamLeaveHistoryPage } from '@/src/pages/manager/TeamLeaveHistoryPage';

import { EmployeeDashboard } from '@/src/pages/employee/EmployeeDashboard';
import { ApplyLeavePage } from '@/src/pages/employee/ApplyLeavePage';
import { MyLeaveRequestsPage } from '@/src/pages/employee/MyLeaveRequestsPage';
import { LeaveBalancePage } from '@/src/pages/employee/LeaveBalancePage';

import { NotificationsPage } from '@/src/pages/common/NotificationsPage';
import { ProfilePage } from '@/src/pages/common/ProfilePage';

function RootRedirect() {
  const { user, isAuthenticated, getDefaultRouteForRole } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
}

export function AppRoutes() {
  const { isAuthenticated, user, getDefaultRouteForRole } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/login"
        element={
          isAuthenticated && user ? (
            <Navigate to={getDefaultRouteForRole(user.role)} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/employees" element={<EmployeeManagementPage />} />
        <Route path="/admin/departments" element={<DepartmentManagementPage />} />
        <Route path="/admin/leaves" element={<LeaveManagementPage />} />
        <Route path="/admin/policies" element={<LeavePoliciesPage />} />
        <Route path="/admin/reports" element={<ReportsAnalyticsPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      {/* Manager Routes */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.MANAGER]} />}>
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/team" element={<MyTeamPage />} />
        <Route path="/manager/approvals" element={<PendingApprovalsPage />} />
        <Route path="/manager/history" element={<TeamLeaveHistoryPage />} />
      </Route>

      {/* Employee Routes */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]} />}>
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/apply" element={<ApplyLeavePage />} />
        <Route path="/employee/requests" element={<MyLeaveRequestsPage />} />
        <Route path="/employee/balance" element={<LeaveBalancePage />} />
      </Route>

      {/* Shared Authenticated Routes */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]}
          />
        }
      >
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
