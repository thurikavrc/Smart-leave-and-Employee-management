import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  UserCheck,
  UserMinus,
  CalendarOff,
} from 'lucide-react';
import { EmploymentStatus, LeaveStatus } from '@/src/types';
import { cn } from '@/src/lib/utils';

type StatusValue = LeaveStatus | EmploymentStatus | 'ACTIVE' | 'INACTIVE';

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; style: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  [LeaveStatus.PENDING]: {
    label: 'Pending',
    style: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: Clock,
  },
  [LeaveStatus.APPROVED]: {
    label: 'Approved',
    style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: CheckCircle2,
  },
  [LeaveStatus.REJECTED]: {
    label: 'Rejected',
    style: 'bg-red-50 text-red-800 border-red-200',
    Icon: XCircle,
  },
  [EmploymentStatus.ACTIVE]: {
    label: 'Active',
    style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: UserCheck,
  },
  [EmploymentStatus.INACTIVE]: {
    label: 'Inactive',
    style: 'bg-slate-100 text-slate-700 border-slate-200',
    Icon: UserMinus,
  },
  [EmploymentStatus.ON_LEAVE]: {
    label: 'On Leave',
    style: 'bg-sky-50 text-sky-800 border-sky-200',
    Icon: CalendarOff,
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: String(status),
    style: 'bg-slate-100 text-slate-700 border-slate-200',
    Icon: Clock,
  };
  const { label, style, Icon } = config;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0',
        style,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
