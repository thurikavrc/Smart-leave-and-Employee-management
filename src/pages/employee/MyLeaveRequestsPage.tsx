import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Eye, MessageSquareWarning } from 'lucide-react';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DataTable, DataTableColumn } from '@/src/components/common/DataTable';
import { SearchInput } from '@/src/components/common/SearchInput';
import { FilterDropdown } from '@/src/components/common/FilterDropdown';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { ErrorState } from '@/src/components/common/ErrorState';
import { LeaveDetailsDialog } from '@/src/components/leave/LeaveDetailsDialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { LeaveRequest, LeaveStatus } from '@/src/types';
import { leaveService } from '@/src/services/leaveService';
import { useAuth } from '@/src/hooks/useAuth';
import { formatDisplayDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

const PAGE_SIZE = 7;

export function MyLeaveRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);

  const loadMyLeaves = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await leaveService.getMyLeaves(user.id);
      setRequests(list);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load your leave requests.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMyLeaves();
  }, [loadMyLeaves]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesSearch =
        !q ||
        r.applicationId.toLowerCase().includes(q) ||
        formatLeaveTypeLabel(r.leaveType).toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesDate =
        !dateFilter || (r.startDate <= dateFilter && r.endDate >= dateFilter) || r.appliedDate === dateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [requests, searchQuery, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      key: 'appId',
      header: 'Application ID',
      render: (r) => (
        <span className="font-mono text-xs font-medium text-slate-800">
          {r.applicationId}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Leave Type',
      render: (r) => <span className="font-medium text-slate-900">{formatLeaveTypeLabel(r.leaveType)}</span>,
    },
    {
      key: 'start',
      header: 'Start Date',
      render: (r) => (
        <span className="text-xs tabular-nums whitespace-nowrap">
          {formatDisplayDate(r.startDate)}
        </span>
      ),
    },
    {
      key: 'end',
      header: 'End Date',
      render: (r) => (
        <span className="text-xs tabular-nums whitespace-nowrap">
          {formatDisplayDate(r.endDate)}
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
        <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
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
        <div className="inline-flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewingLeave(r)}
          >
            {r.status === LeaveStatus.REJECTED ? (
              <>
                <MessageSquareWarning className="h-3.5 w-3.5 text-red-600" />
                <span>Reason</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Details</span>
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Employee Dashboard', to: '/employee/dashboard' },
        { label: 'My Leave Requests' },
      ]}
      title="My Leave Requests"
      subtitle="Track approval status, review rejection feedback, and inspect your complete leave history."
      actions={
        <Button onClick={() => navigate('/employee/apply')}>
          <CalendarPlus className="h-4 w-4" />
          <span>Apply for Leave</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by application ID, leave type, or reason..."
          className="lg:flex-1"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center shrink-0">
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
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date"
              className="w-full sm:w-40"
            />
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter('')}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadMyLeaves} />
      ) : (
        <DataTable
          data={paginatedRequests}
          columns={columns}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
          emptyTitle="No leave requests found"
          emptyDescription="Submit your first leave request or clear the active filters."
          emptyActionLabel="Apply for Leave"
          onEmptyAction={() => navigate('/employee/apply')}
          pagination={{
            currentPage,
            totalPages,
            totalItems: filteredRequests.length,
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
