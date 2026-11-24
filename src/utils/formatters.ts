import { LeaveType, LeaveStatus, EmploymentStatus } from '@/src/types';

export function formatLeaveTypeLabel(type: LeaveType): string {
  switch (type) {
    case LeaveType.CASUAL:
      return 'Casual Leave';
    case LeaveType.SICK:
      return 'Sick Leave';
    case LeaveType.EARNED:
      return 'Earned Leave';
    case LeaveType.UNPAID:
      return 'Unpaid Leave';
    default:
      return type;
  }
}

export function formatLeaveStatusLabel(status: LeaveStatus): string {
  switch (status) {
    case LeaveStatus.PENDING:
      return 'Pending';
    case LeaveStatus.APPROVED:
      return 'Approved';
    case LeaveStatus.REJECTED:
      return 'Rejected';
    default:
      return status;
  }
}

export function formatEmploymentStatusLabel(status: EmploymentStatus): string {
  switch (status) {
    case EmploymentStatus.ACTIVE:
      return 'Active';
    case EmploymentStatus.INACTIVE:
      return 'Inactive';
    case EmploymentStatus.ON_LEAVE:
      return 'On Leave';
    default:
      return status;
  }
}

export function exportRowsToCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
