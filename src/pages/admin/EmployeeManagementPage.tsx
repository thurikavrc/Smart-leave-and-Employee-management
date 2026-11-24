import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DataTable, DataTableColumn } from '@/src/components/common/DataTable';
import { SearchInput } from '@/src/components/common/SearchInput';
import { FilterDropdown } from '@/src/components/common/FilterDropdown';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { UserAvatar } from '@/src/components/common/UserAvatar';
import { ErrorState } from '@/src/components/common/ErrorState';
import { ConfirmationDialog } from '@/src/components/common/ConfirmationDialog';
import { EmployeeForm } from '@/src/components/employee/EmployeeForm';
import { EmployeeDetailsDialog } from '@/src/components/employee/EmployeeDetailsDialog';
import { Button } from '@/src/components/ui/button';
import { Department, Employee, EmploymentStatus } from '@/src/types';
import { EmployeeInputPayload, employeeService } from '@/src/services/employeeService';
import { departmentService } from '@/src/services/departmentService';
import { useNotifications } from '@/src/hooks/useNotifications';
import { formatDisplayDate } from '@/src/utils/dateUtils';

const PAGE_SIZE = 7;

export function EmployeeManagementPage() {
  const { refreshNotifications } = useNotifications();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deactivate' | 'delete';
    employee: Employee;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [empList, deptList] = await Promise.all([
        employeeService.getAll(),
        departmentService.getAll(),
      ]);
      setEmployees(empList);
      setDepartments(deptList);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load employees.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return employees.filter((emp) => {
      const matchesSearch =
        !q ||
        emp.fullName.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q);
      const matchesDept =
        departmentFilter === 'ALL' || String(emp.departmentId) === departmentFilter;
      const matchesStatus =
        statusFilter === 'ALL' || emp.employmentStatus === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredEmployees.slice(start, start + PAGE_SIZE);
  }, [filteredEmployees, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, statusFilter]);

  const handleSaveEmployee = async (payload: EmployeeInputPayload) => {
    if (editingEmployee) {
      await employeeService.update(editingEmployee.id, payload);
      toast.success(`Updated employee record for ${payload.fullName}`);
    } else {
      await employeeService.create(payload);
      toast.success(`Added ${payload.fullName} (${payload.employeeId}) to directory`);
    }
    await loadData();
    await refreshNotifications();
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsConfirmLoading(true);
    try {
      if (confirmAction.type === 'deactivate') {
        await employeeService.update(confirmAction.employee.id, {
          employmentStatus: EmploymentStatus.INACTIVE,
        });
        toast.success(`${confirmAction.employee.fullName} marked as Inactive`);
      } else {
        await employeeService.remove(confirmAction.employee.id);
        toast.success(`Removed ${confirmAction.employee.fullName} from mock directory`);
      }
      setConfirmAction(null);
      await loadData();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message || 'Action failed.');
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const columns: DataTableColumn<Employee>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (emp) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <UserAvatar name={emp.fullName} avatarUrl={emp.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">{emp.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{emp.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'employeeId',
      header: 'Employee ID',
      render: (emp) => (
        <span className="font-mono text-xs font-medium text-slate-700">
          {emp.employeeId}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department & Role',
      render: (emp) => (
        <div>
          <p className="font-medium text-slate-800">{emp.departmentName}</p>
          <p className="text-xs text-slate-500">{emp.designation}</p>
        </div>
      ),
    },
    {
      key: 'manager',
      header: 'Reporting Manager',
      render: (emp) => <span className="text-slate-600">{emp.reportingManagerName}</span>,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (emp) => (
        <span className="text-slate-600 tabular-nums whitespace-nowrap">
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
      header: 'Actions',
      align: 'right',
      render: (emp) => (
        <div className="inline-flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewingEmployee(emp)}
            title="View details"
            aria-label={`View ${emp.fullName}`}
          >
            <Eye className="h-4 w-4 text-slate-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setEditingEmployee(emp);
              setIsFormOpen(true);
            }}
            title="Edit employee"
            aria-label={`Edit ${emp.fullName}`}
          >
            <Pencil className="h-4 w-4 text-slate-600" />
          </Button>
          {emp.employmentStatus !== EmploymentStatus.INACTIVE && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setConfirmAction({ type: 'deactivate', employee: emp })}
              title="Deactivate employee"
              aria-label={`Deactivate ${emp.fullName}`}
            >
              <UserX className="h-4 w-4 text-amber-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setConfirmAction({ type: 'delete', employee: emp })}
            title="Delete employee"
            aria-label={`Delete ${emp.fullName}`}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Admin Dashboard', to: '/admin/dashboard' },
        { label: 'Employee Management' },
      ]}
      title="Employee Management"
      subtitle="Add, update, inspect, and filter all employee profiles across the organization."
      actions={
        <Button
          onClick={() => {
            setEditingEmployee(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Add Employee</span>
        </Button>
      }
    >
      {/* Search & Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, employee ID, email, or designation..."
          className="sm:flex-1"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center shrink-0">
          <FilterDropdown
            value={departmentFilter}
            onChange={setDepartmentFilter}
            placeholder="All Departments"
            options={[
              { label: 'All Departments', value: 'ALL' },
              ...departments.map((d) => ({ label: d.name, value: String(d.id) })),
            ]}
          />
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Active', value: EmploymentStatus.ACTIVE },
              { label: 'On Leave', value: EmploymentStatus.ON_LEAVE },
              { label: 'Inactive', value: EmploymentStatus.INACTIVE },
            ]}
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <DataTable
          data={paginatedEmployees}
          columns={columns}
          keyExtractor={(emp) => emp.id}
          isLoading={isLoading}
          emptyTitle="No matching employees"
          emptyDescription="Adjust your search query or department filter, or add a new employee."
          emptyActionLabel="Add Employee"
          onEmptyAction={() => {
            setEditingEmployee(null);
            setIsFormOpen(true);
          }}
          pagination={{
            currentPage,
            totalPages,
            totalItems: filteredEmployees.length,
            pageSize: PAGE_SIZE,
            onPageChange: setCurrentPage,
          }}
        />
      )}

      <EmployeeForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialEmployee={editingEmployee}
        departments={departments}
        employees={employees}
        onSubmit={handleSaveEmployee}
      />

      <EmployeeDetailsDialog
        open={Boolean(viewingEmployee)}
        onOpenChange={(open) => !open && setViewingEmployee(null)}
        employee={viewingEmployee}
      />

      <ConfirmationDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.type === 'deactivate'
            ? 'Deactivate Employee'
            : 'Delete Employee Record'
        }
        description={
          confirmAction?.type === 'deactivate'
            ? `Mark ${confirmAction?.employee.fullName} (${confirmAction?.employee.employeeId}) as Inactive? They will retain historical records.`
            : `Permanently remove ${confirmAction?.employee.fullName} from the current mock session?`
        }
        confirmLabel={
          confirmAction?.type === 'deactivate' ? 'Deactivate' : 'Delete Employee'
        }
        variant="destructive"
        isLoading={isConfirmLoading}
        onConfirm={handleConfirmAction}
      />
    </DashboardLayout>
  );
}
