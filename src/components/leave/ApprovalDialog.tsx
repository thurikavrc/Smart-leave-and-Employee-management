import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { LeaveRequest } from '@/src/types';
import { formatDisplayDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequest | null;
  onConfirmApprove: (leaveId: number) => Promise<void>;
}

export function ApprovalDialog({
  open,
  onOpenChange,
  leaveRequest,
  onConfirmApprove,
}: ApprovalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!leaveRequest) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmApprove(leaveRequest.id);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Approve Leave Request</span>
          </DialogTitle>
          <DialogDescription>
            Confirm approval for {leaveRequest.employeeName}&apos;s leave application.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Application ID</span>
            <span className="font-mono font-medium text-slate-900">
              {leaveRequest.applicationId}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Leave Type</span>
            <span className="font-medium text-slate-900">
              {formatLeaveTypeLabel(leaveRequest.leaveType)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Dates</span>
            <span className="font-medium text-slate-900 tabular-nums">
              {formatDisplayDate(leaveRequest.startDate)} –{' '}
              {formatDisplayDate(leaveRequest.endDate)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Duration</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {leaveRequest.numberOfDays} {leaveRequest.numberOfDays === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="success"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Approving...' : 'Confirm Approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
