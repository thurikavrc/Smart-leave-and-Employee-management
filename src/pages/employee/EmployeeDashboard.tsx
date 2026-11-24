import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  CalendarPlus,
  Clock,
  HeartPulse,
  Sun,
  Briefcase,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DashboardCard } from '@/src/components/common/DashboardCard';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { LoadingSpinner } from '@/src/components/common/LoadingSpinner';
import { ErrorState } from '@/src/components/common/ErrorState';
import { LeaveDetailsDialog } from '@/src/components/leave/LeaveDetailsDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import {
  DashboardStatistics,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
} from '@/src/types';
import { dashboardService } from '@/src/services/dashboardService';
import { leaveService } from '@/src/services/leaveService';
import { useAuth } from '@/src/hooks/useAuth';
import { formatDisplayDate, getTodayIsoDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, balanceRes, leavesRes] = await Promise.all([
        dashboardService.getEmployeeDashboard(user.id),
        leaveService.getMyLeaveBalance(user.id),
        leaveService.getMyLeaves(user.id),
      ]);
      setStats(statsRes);
      setBalance(balanceRes);
      setMyLeaves(leavesRes);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load your dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const today = getTodayIsoDate();
  const upcomingApproved = myLeaves
    .filter((l) => l.status === LeaveStatus.APPROVED && l.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const recentApplications = [...myLeaves]
    .sort((a, b) => b.appliedDate.localeCompare(a.appliedDate))
    .slice(0, 5);

  const balanceRows = balance
    ? [
        { ...balance.casual, barColor: 'bg-indigo-700' },
        { ...balance.sick, barColor: 'bg-sky-600' },
        { ...balance.earned, barColor: 'bg-emerald-600' },
        { ...balance.unpaid, barColor: 'bg-slate-500' },
      ]
    : [];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Employee Dashboard' }]}
      title={`Welcome back, ${user?.fullName.split(' ')[0] || 'Employee'}`}
      subtitle="Track your annual leave balances, upcoming time off, and recent application statuses."
      actions={
        <Button onClick={() => navigate('/employee/apply')}>
          <CalendarPlus className="h-4 w-4" />
          <span>Quick Apply for Leave</span>
        </Button>
      }
    >
      {isLoading ? (
        <LoadingSpinner label="Loading your leave summary..." />
      ) : error || !stats || !balance ? (
        <ErrorState
          message={error || 'Unable to load dashboard.'}
          onRetry={loadData}
        />
      ) : (
        <div className="space-y-6">
          {/* 5 Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <DashboardCard
              title="Casual Leave Balance"
              value={`${balance.casual.remaining}d`}
              subtitle={`of ${balance.casual.totalAllowed} days annual`}
              icon={Sun}
              tone="indigo"
              onClick={() => navigate('/employee/balance')}
            />
            <DashboardCard
              title="Sick Leave Balance"
              value={`${balance.sick.remaining}d`}
              subtitle={`of ${balance.sick.totalAllowed} days annual`}
              icon={HeartPulse}
              tone="blue"
              onClick={() => navigate('/employee/balance')}
            />
            <DashboardCard
              title="Earned Leave Balance"
              value={`${balance.earned.remaining}d`}
              subtitle={`of ${balance.earned.totalAllowed} days annual`}
              icon={Briefcase}
              tone="emerald"
              onClick={() => navigate('/employee/balance')}
            />
            <DashboardCard
              title="Pending Requests"
              value={stats.pendingLeaves}
              subtitle="Awaiting manager review"
              icon={Clock}
              tone="amber"
              onClick={() => navigate('/employee/requests')}
            />
            <DashboardCard
              title="Approved Requests"
              value={stats.approvedLeaves}
              subtitle="Confirmed this year"
              icon={CalendarCheck}
              tone="emerald"
              onClick={() => navigate('/employee/requests')}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Leave Balance Overview with Progress Indicators */}
            <Card className="lg:col-span-5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Leave Balance Overview</CardTitle>
                  <CardDescription>FY {balance.year} allowance utilization</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/employee/balance')}
                >
                  Details <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                {balanceRows.map((item) => {
                  const remainingPct =
                    item.totalAllowed > 0
                      ? (item.remaining / item.totalAllowed) * 100
                      : 0;
                  return (
                    <div key={item.leaveType} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900">{item.label}</span>
                        <span className="text-xs text-slate-600 tabular-nums">
                          <strong className="text-slate-900">{item.remaining}</strong> remaining ·{' '}
                          {item.used} used
                          {item.pending > 0 ? ` · ${item.pending} pending` : ''}
                        </span>
                      </div>
                      <Progress
                        value={remainingPct}
                        indicatorClassName={item.barColor}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Upcoming Approved Leaves */}
            <Card className="lg:col-span-7">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Upcoming Approved Leaves</CardTitle>
                  <CardDescription>Scheduled time off confirmed by your manager</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/employee/apply')}
                >
                  Apply Leave
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingApproved.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">
                    You have no upcoming approved leaves scheduled.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {upcomingApproved.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between gap-4 px-5 py-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatLeaveTypeLabel(req.leaveType)}
                            </p>
                            <span className="font-mono text-xs text-slate-400">
                              {req.applicationId}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-600 tabular-nums">
                            {formatDisplayDate(req.startDate)} – {formatDisplayDate(req.endDate)} ·{' '}
                            <span className="font-medium text-slate-900">
                              {req.numberOfDays} {req.numberOfDays === 1 ? 'day' : 'days'}
                            </span>
                          </p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Leave Applications & History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Recent Leave Applications</CardTitle>
                <CardDescription>Latest submissions and approval history</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/employee/requests')}
              >
                View all requests <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentApplications.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  No leave applications submitted yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                        <th className="px-5 py-3">Application ID</th>
                        <th className="px-4 py-3">Leave Type</th>
                        <th className="px-4 py-3">Dates</th>
                        <th className="px-4 py-3 text-right">Days</th>
                        <th className="px-4 py-3">Applied</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentApplications.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/80">
                          <td className="px-5 py-3 font-mono text-xs text-slate-800">
                            {req.applicationId}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {formatLeaveTypeLabel(req.leaveType)}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                            {formatDisplayDate(req.startDate)} – {formatDisplayDate(req.endDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">
                            {req.numberOfDays}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">
                            {formatDisplayDate(req.appliedDate)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingLeave(req)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <LeaveDetailsDialog
        open={Boolean(viewingLeave)}
        onOpenChange={(open) => !open && setViewingLeave(null)}
        leaveRequest={viewingLeave}
      />
    </DashboardLayout>
  );
}
