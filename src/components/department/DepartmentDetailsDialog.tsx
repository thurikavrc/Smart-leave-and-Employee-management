import React from 'react';
import { Building2, Users, UserCheck, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { UserAvatar } from '@/src/components/common/UserAvatar';
import { Department, Employee } from '@/src/types';
import { formatDisplayDate } from '@/src/utils/dateUtils';

interface DepartmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  employees: Employee[];
}

export function DepartmentDetailsDialog({
  open,
  onOpenChange,
  department,
  employees,
}: DepartmentDetailsDialogProps) {
  if (!department) return null;

  const deptEmployees = employees.filter((e) => e.departmentId === department.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-700" />
            <span>{department.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            {department.description}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 border-y border-slate-100 py-3.5 text-sm">
            <div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Department Head
              </p>
              <p className="mt-1 font-semibold text-slate-900">{department.headName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Headcount
              </p>
              <p className="mt-1 font-semibold text-slate-900 tabular-nums">
                {deptEmployees.length} Employees
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Established
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDisplayDate(department.createdAt)}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-3">
              Assigned Team Members ({deptEmployees.length})
            </h4>
            {deptEmployees.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                No employees currently assigned to this department.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                {deptEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={emp.fullName} avatarUrl={emp.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {emp.fullName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {emp.designation} · <span className="font-mono">{emp.employeeId}</span>
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={emp.employmentStatus} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
