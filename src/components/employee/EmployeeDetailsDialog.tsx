import React, { useEffect, useState } from 'react';
import { Mail, Phone, Building2, Calendar, UserCheck, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { UserAvatar } from '@/src/components/common/UserAvatar';
import { Progress } from '@/src/components/ui/progress';
import { Employee, LeaveBalance } from '@/src/types';
import { leaveService } from '@/src/services/leaveService';
import { formatDisplayDate } from '@/src/utils/dateUtils';

interface EmployeeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

export function EmployeeDetailsDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeDetailsDialogProps) {
  const [balance, setBalance] = useState<LeaveBalance | null>(null);

  useEffect(() => {
    if (open && employee) {
      leaveService
        .getEmployeeLeaveBalance(employee.id)
        .then(setBalance)
        .catch(() => setBalance(null));
    }
  }, [open, employee]);

  if (!employee) return null;

  const balanceItems = balance
    ? [balance.casual, balance.sick, balance.earned]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Employee Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3.5">
              <UserAvatar
                name={employee.fullName}
                avatarUrl={employee.avatarUrl}
                size="lg"
              />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {employee.fullName}
                </h3>
                <p className="text-sm text-slate-500">
                  {employee.designation} ·{' '}
                  <span className="font-mono text-xs text-slate-600">
                    {employee.employeeId}
                  </span>
                </p>
              </div>
            </div>
            <StatusBadge status={employee.employmentStatus} />
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="tabular-nums">{employee.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{employee.departmentName}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <UserCheck className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Reports to {employee.reportingManagerName}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Joined {formatDisplayDate(employee.dateOfJoining)}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Shield className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Role: {employee.role}</span>
            </div>
          </div>

          {balanceItems.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold text-slate-500 mb-3">
                Annual Leave Balance ({balance?.year})
              </h4>
              <div className="space-y-3">
                {balanceItems.map((item) => {
                  const pct =
                    item.totalAllowed > 0
                      ? (item.remaining / item.totalAllowed) * 100
                      : 0;
                  return (
                    <div key={item.leaveType} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="text-slate-500 tabular-nums">
                          {item.remaining} of {item.totalAllowed} days remaining
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
