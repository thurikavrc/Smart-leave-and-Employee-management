import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DataTable, DataTableColumn } from '@/src/components/common/DataTable';
import { SearchInput } from '@/src/components/common/SearchInput';
import { FilterDropdown } from '@/src/components/common/FilterDropdown';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { ErrorState } from '@/src/components/common/ErrorState';
import { ApprovalDialog } from '@/src/components/leave/ApprovalDialog';
import { RejectionDialog } from '@/src/components/leave/RejectionDialog';
import { LeaveDetailsDialog } from '@/src/components/leave/LeaveDetailsDialog';
import { Button } from '@/src/components/ui/button';
import { Department, LeaveRequest, LeaveStatus, LeaveType } from '@/src/types';
import { leaveService } from '@/src/services/leaveService';
import { departmentService } from '@/src/services/departmentService';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';
import { formatDisplayDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

const PAGE_SIZE = 8;

export function LeaveManagementPage() {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);
  const [approvingLeave, setApprovingLeave] = useState<LeaveRequest | null>(null);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leaveList, deptList] = await Promise.all([
        leaveService.getAllLeaves(),
        departmentService.getAll(),
      ]);
      setLeaves(leaveList);
      setDepartments(deptList);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load organization leave requests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLeaves = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leaves.filter((req) => {
      const matchesSearch =
        !q ||
        req.employeeName.toLowerCase().includes(q) ||
        req.applicationId.toLowerCase().includes(q) ||
        req.employeeCode.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || req.leaveType === typeFilter;
      const matchesDept =
        deptFilter === 'ALL' || req.departmentName === deptFilter;
      return matchesSearch && matchesStatus && matchesType && matchesDept;
    });
  }, [leaves, searchQuery, statusFilter, typeFilter, deptFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / PAGE_SIZE));
  const paginatedLeaves = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLeaves.slice(start, start + PAGE_SIZE);
  }, [filteredLeaves, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, deptFilter]);

  const handleApprove = async (leaveId: number) => {
    const updated = await leaveService.approveLeave(
      leaveId,
      user?.fullName || 'HR Admin'
    );
    toast.success(`Approved ${updated.applicationId} for ${updated.employeeName}`);
    await loadData();
    await refreshNotifications();
  };

  const handleReject = async (leaveId: number, reason: string) => {
    const updated = await leaveService.rejectLeave(
      leaveId,
      reason,
      user?.fullName || 'HR Admin'
    );
    toast.success(`Rejected ${updated.applicationId} for ${updated.employeeName}`);
    await loadData();
    await refreshNotifications();
  };

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      key: 'appId',
      header: 'Application ID',
      render: (req) => (
        <span className="font-mono text-xs font-medium text-slate-800">
          {req.applicationId}
        </span>
      ),
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (req) => (
        <div>
          <p className="font-medium text-slate-900">{req.employeeName}</p>
          <p className="text-xs text-slate-500">
            {req.departmentName} · {req.employeeCode}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Leave Type',
      render: (req) => (
        <span className="text-slate-800">{formatLeaveTypeLabel(req.leaveType)}</span>
      ),
    },
    {
      key: 'dates',
      header: 'Leave Dates',
      render: (req) => (
        <span className="text-xs text-slate-700 tabular-nums whitespace-nowrap">
          {formatDisplayDate(req.startDate)} – {formatDisplayDate(req.endDate)}
        </span>
      ),
    },
    {
      key: 'days',
      header: 'Days',
      align: 'right',
      render: (req) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          {req.numberOfDays}
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
        <div className="inline-flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewingLeave(req)}
            title="View details"
          >
            <Eye className="h-4 w-4 text-slate-600" />
          </Button>
          {req.status === LeaveStatus.PENDING && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setApprovingLeave(req)}
                title="Approve leave"
              >
                <Check className="h-4 w-4 text-emerald-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRejectingLeave(req)}
                title="Reject leave"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Admin Dashboard', to: '/admin/dashboard' },
        { label: 'Leave Management' },
      ]}
      title="Leave Management"
      subtitle="Review, filter, and oversee all employee leave applications across departments."
    >
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search employee name, ID, or application code..."
          className="lg:flex-1"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:items-center shrink-0">
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            className="lg:w-36"
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Pending', value: LeaveStatus.PENDING },
              { label: 'Approved', value: LeaveStatus.APPROVED },
              { label: 'Rejected', value: LeaveStatus.REJECTED },
            ]}
          />
          <FilterDropdown
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All Types"
            className="lg:w-40"
            options={[
              { label: 'All Leave Types', value: 'ALL' },
              { label: 'Casual Leave', value: LeaveType.CASUAL },
              { label: 'Sick Leave', value: LeaveType.SICK },
              { label: 'Earned Leave', value: LeaveType.EARNED },
              { label: 'Unpaid Leave', value: LeaveType.UNPAID },
            ]}
          />
          <FilterDropdown
            value={deptFilter}
            onChange={setDeptFilter}
            placeholder="All Departments"
            className="lg:w-44"
            options={[
              { label: 'All Departments', value: 'ALL' },
              ...departments.map((d) => ({ label: d.name, value: d.name })),
            ]}
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <DataTable
          data={paginatedLeaves}
          columns={columns}
          keyExtractor={(req) => req.id}
          isLoading={isLoading}
          emptyTitle="No leave requests match your filters"
          emptyDescription="Adjust the search or status filters to view leave applications."
          pagination={{
            currentPage,
            totalPages,
            totalItems: filteredLeaves.length,
            pageSize: PAGE_SIZE,
            onPageChange: setCurrentPage,
          }}
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
