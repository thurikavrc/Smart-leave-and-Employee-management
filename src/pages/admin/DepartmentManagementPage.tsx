import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Eye, LayoutGrid, List, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DataTable, DataTableColumn } from '@/src/components/common/DataTable';
import { SearchInput } from '@/src/components/common/SearchInput';
import { LoadingSpinner } from '@/src/components/common/LoadingSpinner';
import { ErrorState } from '@/src/components/common/ErrorState';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ConfirmationDialog } from '@/src/components/common/ConfirmationDialog';
import { DepartmentForm } from '@/src/components/department/DepartmentForm';
import { DepartmentDetailsDialog } from '@/src/components/department/DepartmentDetailsDialog';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Department, Employee } from '@/src/types';
import { DepartmentInputPayload, departmentService } from '@/src/services/departmentService';
import { employeeService } from '@/src/services/employeeService';
import { formatDisplayDate } from '@/src/utils/dateUtils';

export function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [deptList, empList] = await Promise.all([
        departmentService.getAll(),
        employeeService.getAll(),
      ]);
      setDepartments(deptList);
      setEmployees(empList);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load departments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDepartments = departments.filter((dept) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      !q ||
      dept.name.toLowerCase().includes(q) ||
      dept.headName.toLowerCase().includes(q) ||
      dept.description.toLowerCase().includes(q)
    );
  });

  const handleSaveDepartment = async (payload: DepartmentInputPayload) => {
    if (editingDepartment) {
      await departmentService.update(editingDepartment.id, payload);
      toast.success(`Updated department "${payload.name}"`);
    } else {
      await departmentService.create(payload);
      toast.success(`Created department "${payload.name}"`);
    }
    await loadData();
  };

  const handleConfirmDelete = async () => {
    if (!deletingDepartment) return;
    setIsDeleting(true);
    try {
      await departmentService.remove(deletingDepartment.id);
      toast.success(`Deleted department "${deletingDepartment.name}"`);
      setDeletingDepartment(null);
      await loadData();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message || 'Could not delete department.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<Department>[] = [
    {
      key: 'name',
      header: 'Department Name',
      render: (dept) => (
        <div>
          <p className="font-semibold text-slate-900">{dept.name}</p>
          <p className="text-xs text-slate-500 line-clamp-1 max-w-md">
            {dept.description}
          </p>
        </div>
      ),
    },
    {
      key: 'head',
      header: 'Department Head',
      render: (dept) => <span className="text-slate-700">{dept.headName}</span>,
    },
    {
      key: 'count',
      header: 'Employees',
      align: 'right',
      render: (dept) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          {dept.employeeCount}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (dept) => (
        <span className="text-slate-500 tabular-nums">
          {formatDisplayDate(dept.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (dept) => (
        <div className="inline-flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewingDepartment(dept)}
            title="View department details"
          >
            <Eye className="h-4 w-4 text-slate-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setEditingDepartment(dept);
              setIsFormOpen(true);
            }}
            title="Edit department"
          >
            <Pencil className="h-4 w-4 text-slate-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDeletingDepartment(dept)}
            title="Delete department"
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
        { label: 'Department Management' },
      ]}
      title="Department Management"
      subtitle="Organize company departments, assign department heads, and track headcount."
      actions={
        <Button
          onClick={() => {
            setEditingDepartment(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Add Department</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search departments or heads..."
          className="sm:max-w-md"
        />

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading departments..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : viewMode === 'table' ? (
        <DataTable
          data={filteredDepartments}
          columns={columns}
          keyExtractor={(d) => d.id}
          emptyTitle="No departments found"
          emptyDescription="Create a department to start organizing employees."
          emptyActionLabel="Add Department"
          onEmptyAction={() => {
            setEditingDepartment(null);
            setIsFormOpen(true);
          }}
        />
      ) : filteredDepartments.length === 0 ? (
        <EmptyState
          title="No matching departments"
          description="Try another search term or create a new department."
          icon={Building2}
          actionLabel="Add Department"
          onAction={() => {
            setEditingDepartment(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredDepartments.map((dept) => (
            <Card key={dept.id} className="flex flex-col justify-between">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 truncate">
                        {dept.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        Head: {dept.headName}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 tabular-nums shrink-0">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {dept.employeeCount}
                  </span>
                </div>

                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {dept.description}
                </p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingDepartment(dept)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Roster</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingDepartment(dept);
                        setIsFormOpen(true);
                      }}
                      title="Edit department"
                    >
                      <Pencil className="h-4 w-4 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeletingDepartment(dept)}
                      title="Delete department"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DepartmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialDepartment={editingDepartment}
        employees={employees}
        onSubmit={handleSaveDepartment}
      />

      <DepartmentDetailsDialog
        open={Boolean(viewingDepartment)}
        onOpenChange={(open) => !open && setViewingDepartment(null)}
        department={viewingDepartment}
        employees={employees}
      />

      <ConfirmationDialog
        open={Boolean(deletingDepartment)}
        onOpenChange={(open) => !open && setDeletingDepartment(null)}
        title="Delete Department"
        description={`Are you sure you want to delete "${deletingDepartment?.name}"? Departments with assigned employees must be reassigned first.`}
        confirmLabel="Delete Department"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </DashboardLayout>
  );
}
