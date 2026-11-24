import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DataTable, DataTableColumn } from '@/src/components/common/DataTable';
import { SearchInput } from '@/src/components/common/SearchInput';
import { FilterDropdown } from '@/src/components/common/FilterDropdown';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { ErrorState } from '@/src/components/common/ErrorState';
import { LeaveDetailsDialog } from '@/src/components/leave/LeaveDetailsDialog';
import { Button } from '@/src/components/ui/button';
import { LeaveRequest, LeaveStatus, LeaveType } from '@/src/types';
import { employeeService } from '@/src/services/employeeService';
import { leaveService } from '@/src/services/leaveService';
import { useAuth } from '@/src/hooks/useAuth';
import { formatDisplayDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

const PAGE_SIZE = 7;

export function TeamLeaveHistoryPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);

  const loadHistory = useCallback(async () => {
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
      setLeaves(allLeaves.filter((l) => teamIds.has(l.employeeId)));
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load team leave history.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leaves.filter((r) => {
      const matchesSearch =
        !q ||
        r.employeeName.toLowerCase().includes(q) ||
        r.applicationId.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || r.leaveType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [leaves, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      key: 'appId',
      header: 'Application ID',
      render: (r) => <span className="font-mono text-xs">{r.applicationId}</span>,
    },
    {
      key: 'employee',
      header: 'Team Member',
      render: (r) => <span className="font-medium text-slate-900">{r.employeeName}</span>,
    },
    {
      key: 'type',
      header: 'Leave Type',
      render: (r) => <span>{formatLeaveTypeLabel(r.leaveType)}</span>,
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (r) => (
        <span className="text-xs tabular-nums whitespace-nowrap">
          {formatDisplayDate(r.startDate)} – {formatDisplayDate(r.endDate)}
        </span>
      ),
    },
    {
      key: 'days',
      header: 'Days',
      align: 'right',
      render: (r) => <span className="font-semibold tabular-nums">{r.numberOfDays}</span>,
    },
    {
      key: 'applied',
      header: 'Applied Date',
      render: (r) => (
        <span className="text-xs text-slate-500 tabular-nums">
          {formatDisplayDate(r.appliedDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <Button variant="ghost" size="sm" onClick={() => setViewingLeave(r)}>
          <Eye className="h-3.5 w-3.5" />
          <span>View</span>
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Manager Dashboard', to: '/manager/dashboard' },
        { label: 'Team Leave History' },
      ]}
      title="Team Leave History"
      subtitle="Historical record of all approved, pending, and declined leave requests for your team."
    >
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by team member or application ID..."
          className="sm:flex-1"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
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
            options={[
              { label: 'All Types', value: 'ALL' },
              { label: 'Casual Leave', value: LeaveType.CASUAL },
              { label: 'Sick Leave', value: LeaveType.SICK },
              { label: 'Earned Leave', value: LeaveType.EARNED },
              { label: 'Unpaid Leave', value: LeaveType.UNPAID },
            ]}
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadHistory} />
      ) : (
        <DataTable
          data={paginated}
          columns={columns}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
          emptyTitle="No leave history found"
          emptyDescription="Try clearing the search or status filters."
          pagination={{
            currentPage,
            totalPages,
            totalItems: filtered.length,
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
    </DashboardLayout>
  );
}
