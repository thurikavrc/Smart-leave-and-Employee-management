import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DataTable, DataTableColumn } from '@/src/components/common/DataTable';
import { SearchInput } from '@/src/components/common/SearchInput';
import { FilterDropdown } from '@/src/components/common/FilterDropdown';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { UserAvatar } from '@/src/components/common/UserAvatar';
import { ErrorState } from '@/src/components/common/ErrorState';
import { EmployeeDetailsDialog } from '@/src/components/employee/EmployeeDetailsDialog';
import { Button } from '@/src/components/ui/button';
import { Employee, EmploymentStatus } from '@/src/types';
import { employeeService } from '@/src/services/employeeService';
import { useAuth } from '@/src/hooks/useAuth';
import { formatDisplayDate } from '@/src/utils/dateUtils';

export function MyTeamPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const loadTeam = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const all = await employeeService.getAll();
      setTeam(all.filter((e) => e.reportingManagerId === user.id));
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load team members.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const filteredTeam = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return team.filter((emp) => {
      const matchesSearch =
        !q ||
        emp.fullName.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'ALL' || emp.employmentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [team, searchQuery, statusFilter]);

  const columns: DataTableColumn<Employee>[] = [
    {
      key: 'name',
      header: 'Team Member',
      render: (emp) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={emp.fullName} avatarUrl={emp.avatarUrl} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{emp.fullName}</p>
            <p className="text-xs text-slate-500">{emp.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Employee ID',
      render: (emp) => <span className="font-mono text-xs">{emp.employeeId}</span>,
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (emp) => <span>{emp.designation}</span>,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (emp) => (
        <span className="tabular-nums text-slate-600">
          {formatDisplayDate(emp.dateOfJoining)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (emp) => <StatusBadge status={emp.employmentStatus} />,
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'right',
      render: (emp) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewingEmployee(emp)}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View Details</span>
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Manager Dashboard', to: '/manager/dashboard' },
        { label: 'My Team' },
      ]}
      title="My Team"
      subtitle="View profiles, contact details, and current leave balances for your direct reports."
    >
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search team members by name, ID, or designation..."
          className="sm:flex-1"
        />
        <FilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All Statuses', value: 'ALL' },
            { label: 'Active', value: EmploymentStatus.ACTIVE },
            { label: 'On Leave', value: EmploymentStatus.ON_LEAVE },
            { label: 'Inactive', value: EmploymentStatus.INACTIVE },
          ]}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadTeam} />
      ) : (
        <DataTable
          data={filteredTeam}
          columns={columns}
          keyExtractor={(e) => e.id}
          isLoading={isLoading}
          emptyTitle="No matching team members"
          emptyDescription="Adjust your search or status filter."
        />
      )}

      <EmployeeDetailsDialog
        open={Boolean(viewingEmployee)}
        onOpenChange={(open) => !open && setViewingEmployee(null)}
        employee={viewingEmployee}
      />
    </DashboardLayout>
  );
}
