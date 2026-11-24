import React, { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { LeaveRequest } from '@/src/types';
import { formatDisplayDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequest | null;
  onConfirmReject: (leaveId: number, reason: string) => Promise<void>;
}

export function RejectionDialog({
  open,
  onOpenChange,
  leaveRequest,
  onConfirmReject,
}: RejectionDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  if (!leaveRequest) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A rejection reason is required before declining this request.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirmReject(leaveRequest.id, reason.trim());
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
            <XCircle className="h-5 w-5 text-red-600" />
            <span>Reject Leave Request</span>
          </DialogTitle>
          <DialogDescription>
            Provide a clear reason for rejecting {leaveRequest.employeeName}&apos;s{' '}
            {formatLeaveTypeLabel(leaveRequest.leaveType)} request (
            {formatDisplayDate(leaveRequest.startDate)} –{' '}
            {formatDisplayDate(leaveRequest.endDate)}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Rejection Reason *</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Explain why this leave cannot be approved (e.g. sprint deadline, team coverage overlap)..."
              rows={3}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
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
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
