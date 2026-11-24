import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DashboardCard } from '@/src/components/common/DashboardCard';
import { AdminCharts } from '@/src/components/dashboard/AdminCharts';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { UserAvatar } from '@/src/components/common/UserAvatar';
import { LoadingSpinner } from '@/src/components/common/LoadingSpinner';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import {
  DashboardStatistics,
  Employee,
  LeaveRequest,
  LeaveStatus,
} from '@/src/types';
import { dashboardService } from '@/src/services/dashboardService';
import { employeeService } from '@/src/services/employeeService';
import { leaveService } from '@/src/services/leaveService';
import { useNotifications } from '@/src/hooks/useNotifications';
import { formatDisplayDate, formatRelativeTime } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { notifications } = useNotifications();

  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, empRes, leaveRes] = await Promise.all([
        dashboardService.getAdminDashboard(),
        employeeService.getAll(),
        leaveService.getAllLeaves(),
      ]);
      setStats(statsRes);
      setEmployees(empRes);
      setLeaves(leaveRes);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load admin dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recentEmployees = [...employees]
    .sort((a, b) => b.dateOfJoining.localeCompare(a.dateOfJoining))
    .slice(0, 4);

  const latestLeaves = [...leaves]
    .sort((a, b) => b.appliedDate.localeCompare(a.appliedDate))
    .slice(0, 4);

  const recentlyApproved = leaves
    .filter((l) => l.status === LeaveStatus.APPROVED)
    .slice(0, 4);

  const pendingNotifications = notifications
    .filter((n) => !n.isRead)
    .slice(0, 4);

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Admin Dashboard' }]}
      title="Admin Dashboard"
      subtitle="Organization-wide workforce distribution, leave volume analytics, and recent HR activity."
      actions={
        <>
          <Button variant="outline" onClick={() => navigate('/admin/reports')}>
            Export Reports
          </Button>
          <Button onClick={() => navigate('/admin/employees')}>
            <UserPlus className="h-4 w-4" />
            <span>Manage Employees</span>
          </Button>
        </>
      }
    >
      {isLoading ? (
        <LoadingSpinner label="Loading organization analytics..." />
      ) : error || !stats ? (
        <ErrorState
          message={error || 'Unable to load dashboard data.'}
          onRetry={loadData}
        />
      ) : (
        <div className="space-y-6">
          {/* 5 Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <DashboardCard
              title="Total Employees"
              value={stats.totalEmployees}
              subtitle="Across all departments"
              trend={{ value: '+8.3% YoY', isPositive: true }}
              icon={Users}
              tone="indigo"
              onClick={() => navigate('/admin/employees')}
            />
            <DashboardCard
              title="Total Departments"
              value={stats.totalDepartments}
              subtitle="Active business units"
              icon={Building2}
              tone="blue"
              onClick={() => navigate('/admin/departments')}
            />
            <DashboardCard
              title="Pending Leave Requests"
              value={stats.pendingLeaves}
              subtitle="Awaiting manager review"
              icon={Clock}
              tone="amber"
              onClick={() => navigate('/admin/leaves')}
            />
            <DashboardCard
              title="Approved Leaves"
              value={stats.approvedLeaves}
              subtitle="Current cycle approvals"
              trend={{ value: '91% rate', isPositive: true }}
              icon={CheckCircle2}
              tone="emerald"
              onClick={() => navigate('/admin/leaves')}
            />
            <DashboardCard
              title="Rejected Leaves"
              value={stats.rejectedLeaves}
              subtitle="Declined applications"
              icon={XCircle}
              tone="rose"
              onClick={() => navigate('/admin/leaves')}
            />
          </div>

          {/* 4 Interactive Recharts Visualizations */}
          <AdminCharts stats={stats} />

          {/* Recent Activity Feeds */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recently Added Employees */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Recently Added Employees</CardTitle>
                  <CardDescription>Latest onboarded team members</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/employees')}
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {recentEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          name={emp.fullName}
                          avatarUrl={emp.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {emp.fullName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {emp.departmentName} · {emp.designation}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 tabular-nums shrink-0">
                        {formatDisplayDate(emp.dateOfJoining)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Latest Leave Applications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Latest Leave Applications</CardTitle>
                  <CardDescription>Most recent requests submitted</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/leaves')}
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {latestLeaves.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {req.employeeName}{' '}
                          <span className="font-normal text-slate-500">
                            · {formatLeaveTypeLabel(req.leaveType)}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {formatDisplayDate(req.startDate)} – {formatDisplayDate(req.endDate)} ({req.numberOfDays}d)
                        </p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recently Approved Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Recently Approved Requests</CardTitle>
                <CardDescription>Confirmed leave schedules across teams</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {recentlyApproved.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-slate-500">
                      No approved leave requests recorded yet.
                    </p>
                  ) : (
                    recentlyApproved.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between gap-3 px-5 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {req.employeeName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {formatLeaveTypeLabel(req.leaveType)} · Approved by{' '}
                            {req.reviewedBy || 'Manager'}
                          </p>
                        </div>
                        <span className="font-mono text-xs text-slate-600 tabular-nums shrink-0">
                          {req.numberOfDays}d
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Approval Notifications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Pending Approval Notifications</CardTitle>
                  <CardDescription>Unread operational alerts</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/notifications')}
                >
                  Inbox <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {pendingNotifications.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-slate-500">
                      All administrative notifications have been read.
                    </p>
                  ) : (
                    pendingNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="flex items-start gap-3 px-5 py-3.5"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                          <Bell className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
