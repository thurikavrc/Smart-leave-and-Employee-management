import React, { useMemo, useState } from 'react';
import { CalendarDays, FileUp, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { LeaveBalance, LeaveRequest, LeaveType } from '@/src/types';
import { ApplyLeavePayload } from '@/src/services/leaveService';
import { calculateInclusiveDays, getTodayIsoDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

interface LeaveApplicationFormProps {
  balance: LeaveBalance | null;
  onSubmit: (payload: ApplyLeavePayload) => Promise<LeaveRequest>;
  onSuccess?: (created: LeaveRequest) => void;
}

interface FormErrors {
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export function LeaveApplicationForm({
  balance,
  onSubmit,
  onSuccess,
}: LeaveApplicationFormProps) {
  const today = getTodayIsoDate();

  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.CASUAL);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [reason, setReason] = useState<string>('');
  const [supportingDocumentName, setSupportingDocumentName] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<LeaveRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestedDays = useMemo(
    () => calculateInclusiveDays(startDate, endDate),
    [startDate, endDate]
  );

  const selectedBalanceItem = useMemo(() => {
    if (!balance) return null;
    switch (leaveType) {
      case LeaveType.CASUAL:
        return balance.casual;
      case LeaveType.SICK:
        return balance.sick;
      case LeaveType.EARNED:
        return balance.earned;
      case LeaveType.UNPAID:
        return balance.unpaid;
      default:
        return null;
    }
  }, [balance, leaveType]);

  const exceedsBalance =
    selectedBalanceItem !== null &&
    leaveType !== LeaveType.UNPAID &&
    requestedDays > selectedBalanceItem.remaining;

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!leaveType) {
      nextErrors.leaveType = 'Please select a leave type.';
    }
    if (!startDate) {
      nextErrors.startDate = 'Start date is required.';
    } else if (startDate < today) {
      nextErrors.startDate = 'Start date cannot be in the past.';
    }
    if (!endDate) {
      nextErrors.endDate = 'End date is required.';
    } else if (startDate && endDate < startDate) {
      nextErrors.endDate = 'End date cannot be earlier than start date.';
    }
    if (!reason.trim()) {
      nextErrors.reason = 'Please provide a reason for your leave request.';
    } else if (reason.trim().length < 10) {
      nextErrors.reason = 'Reason must be at least 10 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSupportingDocumentName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSubmittedRecord(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const created = await onSubmit({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
        supportingDocumentName: supportingDocumentName || undefined,
      });
      setSubmittedRecord(created);
      setReason('');
      setSupportingDocumentName('');
      setStartDate(today);
      setEndDate(today);
      setErrors({});
      if (onSuccess) onSuccess(created);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setServerError(apiErr?.message || 'Unable to submit leave application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {submittedRecord && (
        <div
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-900"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700 shrink-0" />
          <div>
            <p className="font-semibold">
              Leave application submitted ({submittedRecord.applicationId})
            </p>
            <p className="mt-0.5 text-xs text-emerald-800">
              Your {formatLeaveTypeLabel(submittedRecord.leaveType)} request for{' '}
              <span className="font-semibold tabular-nums">
                {submittedRecord.numberOfDays} day(s)
              </span>{' '}
              is now Pending review. Final balance validation will be enforced by the Java Spring Boot backend.
            </p>
          </div>
        </div>
      )}

      {serverError && (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Leave Type *</Label>
          <Select
            value={leaveType}
            onValueChange={(val) => setLeaveType(val as LeaveType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LeaveType.CASUAL}>Casual Leave</SelectItem>
              <SelectItem value={LeaveType.SICK}>Sick Leave</SelectItem>
              <SelectItem value={LeaveType.EARNED}>Earned Leave</SelectItem>
              <SelectItem value={LeaveType.UNPAID}>Unpaid Leave</SelectItem>
            </SelectContent>
          </Select>
          {errors.leaveType && (
            <p className="text-xs text-red-600">{errors.leaveType}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="leave-start-date">Start Date *</Label>
          <Input
            id="leave-start-date"
            type="date"
            min={today}
            value={startDate}
            onChange={(e) => {
              const val = e.target.value;
              setStartDate(val);
              if (endDate && val > endDate) {
                setEndDate(val);
              }
            }}
          />
          {errors.startDate && (
            <p className="text-xs text-red-600">{errors.startDate}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="leave-end-date">End Date *</Label>
          <Input
            id="leave-end-date"
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {errors.endDate && (
            <p className="text-xs text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Live Days & Balance Calculation Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="h-4.5 w-4.5 text-indigo-700" />
          <span className="text-slate-600">Requested Duration:</span>
          <span className="font-semibold text-slate-900 tabular-nums">
            {requestedDays} {requestedDays === 1 ? 'day' : 'days'}
          </span>
        </div>

        {selectedBalanceItem && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Available {selectedBalanceItem.label}:</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {selectedBalanceItem.remaining} / {selectedBalanceItem.totalAllowed} days
            </span>
          </div>
        )}
      </div>

      {exceedsBalance && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700 shrink-0" />
          <span>
            Requested duration ({requestedDays} days) exceeds your remaining{' '}
            {selectedBalanceItem?.label} balance ({selectedBalanceItem?.remaining} days). Your manager and HR backend rules will evaluate this before approval.
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="leave-reason">Reason for Leave *</Label>
        <Textarea
          id="leave-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide context, dates, or handoff notes for your reporting manager..."
          rows={4}
        />
        {errors.reason && <p className="text-xs text-red-600">{errors.reason}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="leave-doc">Supporting Document (Optional)</Label>
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="leave-doc"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileUp className="h-4 w-4 text-slate-500" />
            <span>Choose File</span>
          </label>
          <input
            id="leave-doc"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleFileChange}
            className="sr-only"
          />
          {supportingDocumentName ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              <span className="truncate max-w-[220px]">{supportingDocumentName}</span>
              <button
                type="button"
                onClick={() => setSupportingDocumentName('')}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Remove attached file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              PDF, PNG, JPG, or DOCX (e.g., medical certificate)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
        </Button>
      </div>
    </form>
  );
}
