import React from 'react';
import { Calendar, FileText, User, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { LeaveRequest, LeaveStatus } from '@/src/types';
import { formatDisplayDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

interface LeaveDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequest | null;
}

export function LeaveDetailsDialog({
  open,
  onOpenChange,
  leaveRequest,
}: LeaveDetailsDialogProps) {
  if (!leaveRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="font-mono text-base">
              {leaveRequest.applicationId}
            </DialogTitle>
            <StatusBadge status={leaveRequest.status} />
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Employee
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {leaveRequest.employeeName}
              </p>
              <p className="text-xs text-slate-500">
                {leaveRequest.departmentName} · {leaveRequest.employeeCode}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Leave Type
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatLeaveTypeLabel(leaveRequest.leaveType)}
              </p>
              <p className="text-xs text-slate-500 tabular-nums">
                {leaveRequest.numberOfDays}{' '}
                {leaveRequest.numberOfDays === 1 ? 'day' : 'days'} requested
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Leave Period
              </p>
              <p className="mt-1 font-medium text-slate-900 tabular-nums">
                {formatDisplayDate(leaveRequest.startDate)} –{' '}
                {formatDisplayDate(leaveRequest.endDate)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Applied On</p>
              <p className="mt-1 font-medium text-slate-900 tabular-nums">
                {formatDisplayDate(leaveRequest.appliedDate)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Reason for Leave</p>
            <p className="rounded-lg border border-slate-200 bg-white p-3 text-slate-700 leading-relaxed">
              {leaveRequest.reason}
            </p>
          </div>

          {leaveRequest.supportingDocumentName && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
              <span className="text-slate-600">Supporting Document</span>
              <span className="font-medium text-indigo-700">
                {leaveRequest.supportingDocumentName}
              </span>
            </div>
          )}

          {leaveRequest.reviewedBy && (
            <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 flex items-center justify-between">
              <span>Reviewed by {leaveRequest.reviewedBy}</span>
              {leaveRequest.reviewedDate && (
                <span className="tabular-nums">
                  {formatDisplayDate(leaveRequest.reviewedDate)}
                </span>
              )}
            </div>
          )}

          {leaveRequest.status === LeaveStatus.REJECTED && leaveRequest.rejectionReason && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900">
              <AlertCircle className="mt-0.5 h-4 w-4 text-red-700 shrink-0" />
              <div>
                <p className="font-semibold">Rejection Reason</p>
                <p className="mt-0.5 text-red-800">{leaveRequest.rejectionReason}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
