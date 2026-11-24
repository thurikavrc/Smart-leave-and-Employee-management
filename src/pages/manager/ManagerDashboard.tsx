import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarOff,
  Eye,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DashboardCard } from '@/src/components/common/DashboardCard';
import { DataTable, DataTableColumn } from '@/src/components/common/DataTable';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { UserAvatar } from '@/src/components/common/UserAvatar';
import { LoadingSpinner } from '@/src/components/common/LoadingSpinner';
import { ErrorState } from '@/src/components/common/ErrorState';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ApprovalDialog } from '@/src/components/leave/ApprovalDialog';
import { RejectionDialog } from '@/src/components/leave/RejectionDialog';
import { LeaveDetailsDialog } from '@/src/components/leave/LeaveDetailsDialog';
import { EmployeeDetailsDialog } from '@/src/components/employee/EmployeeDetailsDialog';
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
import { useAuth } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';
import { formatDisplayDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

export function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);
  const [approvingLeave, setApprovingLeave] = useState<LeaveRequest | null>(null);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, allEmps, allLeaves] = await Promise.all([
        dashboardService.getManagerDashboard(user.id),
        employeeService.getAll(),
        leaveService.getAllLeaves(),
      ]);

      const myTeam = allEmps.filter((e) => e.reportingManagerId === user.id);
      const teamIds = new Set(myTeam.map((e) => e.id));
      const pending = allLeaves.filter(
        (l) => teamIds.has(l.employeeId) && l.status === LeaveStatus.PENDING
      );

      setStats(statsRes);
      setTeamMembers(myTeam);
      setPendingRequests(pending);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load manager dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (leaveId: number) => {
    const updated = await leaveService.approveLeave(
      leaveId,
      user?.fullName || 'Manager'
    );
    toast.success(`Approved ${updated.applicationId} for ${updated.employeeName}`);
    await loadData();
    await refreshNotifications();
  };

  const handleReject = async (leaveId: number, reason: string) => {
    const updated = await leaveService.rejectLeave(
      leaveId,
      reason,
      user?.fullName || 'Manager'
    );
    toast.success(`Rejected ${updated.applicationId} for ${updated.employeeName}`);
    await loadData();
    await refreshNotifications();
  };

  const teamColumns: DataTableColumn<Employee>[] = [
    {
      key: 'name',
      header: 'Employee Name',
      render: (emp) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={emp.fullName} avatarUrl={emp.avatarUrl} size="sm" />
          <span className="font-medium text-slate-900">{emp.fullName}</span>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Employee ID',
      render: (emp) => <span className="font-mono text-xs">{emp.employeeId}</span>,
    },
    {
      key: 'department',
      header: 'Department',
      render: (emp) => <span>{emp.departmentName}</span>,
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (emp) => <span className="text-slate-600">{emp.designation}</span>,
    },
    {
      key: 'status',
      header: 'Leave Status',
      render: (emp) => <StatusBadge status={emp.employmentStatus} />,
    },
    {
      key: 'action',
      header: 'Details',
      align: 'right',
      render: (emp) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewingEmployee(emp)}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View</span>
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Manager Dashboard' }]}
      title="Manager Dashboard"
      subtitle="Monitor team availability, review pending leave approvals, and track department capacity."
      actions={
        <Button onClick={() => navigate('/manager/approvals')}>
          Review Pending Queue ({pendingRequests.length})
        </Button>
      }
    >
      {isLoading ? (
        <LoadingSpinner label="Loading team overview..." />
      ) : error || !stats ? (
        <ErrorState
          message={error || 'Unable to load manager data.'}
          onRetry={loadData}
        />
      ) : (
        <div className="space-y-6">
          {/* 5 Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <DashboardCard
              title="Total Team Members"
              value={stats.teamSize ?? teamMembers.length}
              subtitle="Direct reports"
              icon={Users}
              tone="indigo"
              onClick={() => navigate('/manager/team')}
            />
            <DashboardCard
              title="Pending Approvals"
              value={stats.pendingLeaves}
              subtitle="Requires action"
              icon={Clock}
              tone="amber"
              onClick={() => navigate('/manager/approvals')}
            />
            <DashboardCard
              title="Approved Leaves"
              value={stats.approvedLeaves}
              subtitle="Team total approved"
              icon={CheckCircle2}
              tone="emerald"
              onClick={() => navigate('/manager/history')}
            />
            <DashboardCard
              title="Rejected Leaves"
              value={stats.rejectedLeaves}
              subtitle="Team declined requests"
              icon={XCircle}
              tone="rose"
              onClick={() => navigate('/manager/history')}
            />
            <DashboardCard
              title="Currently on Leave"
              value={stats.employeesOnLeave ?? 0}
              subtitle="Out of office today"
              icon={CalendarOff}
              tone="blue"
              onClick={() => navigate('/manager/team')}
            />
          </div>

          {/* Pending Leave Approval Queue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Pending Leave Approvals</CardTitle>
                <CardDescription>
                  Review incoming leave applications from your direct reports
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/manager/approvals')}
              >
                Full Queue <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              {pendingRequests.length === 0 ? (
                <EmptyState
                  title="All caught up"
                  description="There are no pending leave requests waiting for your approval."
                  icon={CheckCircle2}
                />
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {req.employeeName}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-medium text-indigo-700">
                            {formatLeaveTypeLabel(req.leaveType)}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="font-mono text-xs text-slate-500">
                            {req.applicationId}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 tabular-nums">
                          <span>
                            {formatDisplayDate(req.startDate)} –{' '}
                            {formatDisplayDate(req.endDate)}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {req.numberOfDays}{' '}
                            {req.numberOfDays === 1 ? 'day' : 'days'}
                          </span>
                          <span className="text-slate-400">
                            Applied {formatDisplayDate(req.appliedDate)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 line-clamp-2">
                          {req.reason}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingLeave(req)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Details</span>
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => setApprovingLeave(req)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setRejectingLeave(req)}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Overview Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Team Overview</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/manager/team')}
              >
                View Directory <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <DataTable
              data={teamMembers}
              columns={teamColumns}
              keyExtractor={(emp) => emp.id}
              emptyTitle="No direct reports assigned"
              emptyDescription="Employees assigned to report to you will appear here."
            />
          </div>
        </div>
      )}

      <EmployeeDetailsDialog
        open={Boolean(viewingEmployee)}
        onOpenChange={(open) => !open && setViewingEmployee(null)}
        employee={viewingEmployee}
      />

      <LeaveDetailsDialog
        open={Boolean(viewingLeave)}
        onOpenChange={(open) => !open && setViewingLeave(null)}
        leaveRequest={viewingLeave}
      />

      <ApprovalDialog
        open={Boolean(approvingLeave)}
        onOpenChange={(open) => !open && setApprovingLeave(null)}
        leaveRequest={approvingLeave}
        onConfirmApprove={handleApprove}
      />

      <RejectionDialog
        open={Boolean(rejectingLeave)}
        onOpenChange={(open) => !open && setRejectingLeave(null)}
        leaveRequest={rejectingLeave}
        onConfirmReject={handleReject}
      />
    </DashboardLayout>
  );
}
