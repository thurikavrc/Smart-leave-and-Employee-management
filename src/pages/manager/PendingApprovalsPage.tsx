import React, { useCallback, useEffect, useState } from 'react';
import { Check, CheckCircle2, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DataTable, DataTableColumn } from '@/src/components/common/DataTable';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { ErrorState } from '@/src/components/common/ErrorState';
import { ApprovalDialog } from '@/src/components/leave/ApprovalDialog';
import { RejectionDialog } from '@/src/components/leave/RejectionDialog';
import { LeaveDetailsDialog } from '@/src/components/leave/LeaveDetailsDialog';
import { Button } from '@/src/components/ui/button';
import { LeaveRequest, LeaveStatus } from '@/src/types';
import { employeeService } from '@/src/services/employeeService';
import { leaveService } from '@/src/services/leaveService';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';
import { formatDisplayDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

export function PendingApprovalsPage() {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);
  const [approvingLeave, setApprovingLeave] = useState<LeaveRequest | null>(null);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);

  const loadPending = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [allEmps, allLeaves] = await Promise.all([
        employeeService.getAll(),
        leaveService.getAllLeaves(),
      ]);
      const teamIds = new Set(
        allEmps.filter((e) => e.reportingManagerId === user.id).map((e) => e.id)
      );
      setPendingLeaves(
        allLeaves.filter(
          (l) => teamIds.has(l.employeeId) && l.status === LeaveStatus.PENDING
        )
      );
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load pending approvals.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleApprove = async (leaveId: number) => {
    const updated = await leaveService.approveLeave(
      leaveId,
      user?.fullName || 'Manager'
    );
    toast.success(`Approved ${updated.applicationId} for ${updated.employeeName}`);
    await loadPending();
    await refreshNotifications();
  };

  const handleReject = async (leaveId: number, reason: string) => {
    const updated = await leaveService.rejectLeave(
      leaveId,
      reason,
      user?.fullName || 'Manager'
    );
    toast.success(`Rejected ${updated.applicationId} for ${updated.employeeName}`);
    await loadPending();
    await refreshNotifications();
  };

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (req) => (
        <div>
          <p className="font-medium text-slate-900">{req.employeeName}</p>
          <p className="text-xs text-slate-500 font-mono">{req.applicationId}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Leave Type',
      render: (req) => <span>{formatLeaveTypeLabel(req.leaveType)}</span>,
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (req) => (
        <span className="text-xs tabular-nums whitespace-nowrap">
          {formatDisplayDate(req.startDate)} – {formatDisplayDate(req.endDate)}
        </span>
      ),
    },
    {
      key: 'days',
      header: 'Days',
      align: 'right',
      render: (req) => <span className="font-semibold tabular-nums">{req.numberOfDays}</span>,
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (req) => (
        <p className="max-w-xs text-xs text-slate-600 line-clamp-2">{req.reason}</p>
      ),
    },
    {
      key: 'applied',
      header: 'Applied',
      render: (req) => (
        <span className="text-xs text-slate-500 tabular-nums">
          {formatDisplayDate(req.appliedDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (req) => <StatusBadge status={req.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (req) => (
        <div className="inline-flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewingLeave(req)}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Details</span>
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
      ),
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Manager Dashboard', to: '/manager/dashboard' },
        { label: 'Pending Leave Approvals' },
      ]}
      title="Pending Leave Approvals"
      subtitle="Approve or decline pending leave applications submitted by your team members."
    >
      {error ? (
        <ErrorState message={error} onRetry={loadPending} />
      ) : (
        <DataTable
          data={pendingLeaves}
          columns={columns}
          keyExtractor={(req) => req.id}
          isLoading={isLoading}
          emptyTitle="No pending leave requests"
          emptyDescription="All team leave requests have been reviewed."
          emptyActionLabel="Refresh Queue"
          onEmptyAction={loadPending}
        />
      )}

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
