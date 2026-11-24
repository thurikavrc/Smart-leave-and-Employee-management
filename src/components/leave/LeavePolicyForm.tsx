import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
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
import { LeavePolicy, LeaveType } from '@/src/types';
import { LeavePolicyPayload } from '@/src/services/leaveService';

interface LeavePolicyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPolicy?: LeavePolicy | null;
  onSubmit: (payload: LeavePolicyPayload) => Promise<void>;
}

export function LeavePolicyForm({
  open,
  onOpenChange,
  initialPolicy,
  onSubmit,
}: LeavePolicyFormProps) {
  const isEditing = Boolean(initialPolicy);
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.CASUAL);
  const [displayName, setDisplayName] = useState('');
  const [annualAllowance, setAnnualAllowance] = useState('12');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [carryForwardAllowed, setCarryForwardAllowed] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    annualAllowance?: string;
    description?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialPolicy) {
        setLeaveType(initialPolicy.leaveType);
        setDisplayName(initialPolicy.displayName);
        setAnnualAllowance(String(initialPolicy.annualAllowance));
        setDescription(initialPolicy.description);
        setIsActive(initialPolicy.isActive);
        setCarryForwardAllowed(initialPolicy.carryForwardAllowed);
      } else {
        setLeaveType(LeaveType.CASUAL);
        setDisplayName('');
        setAnnualAllowance('12');
        setDescription('');
        setIsActive(true);
        setCarryForwardAllowed(false);
      }
      setErrors({});
    }
  }, [open, initialPolicy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: {
      displayName?: string;
      annualAllowance?: string;
      description?: string;
    } = {};

    if (!displayName.trim()) {
      nextErrors.displayName = 'Policy name is required.';
    }
    const allowanceNum = Number(annualAllowance);
    if (Number.isNaN(allowanceNum) || allowanceNum < 0 || allowanceNum > 365) {
      nextErrors.annualAllowance = 'Enter an allowance between 0 and 365 days.';
    }
    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        leaveType,
        displayName: displayName.trim(),
        annualAllowance: allowanceNum,
        description: description.trim(),
        isActive,
        carryForwardAllowed,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Leave Policy' : 'Add Leave Policy'}
          </DialogTitle>
          <DialogDescription>
            Configure annual leave allowances and policy status for the organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Leave Type *</Label>
              <Select
                value={leaveType}
                onValueChange={(val) => setLeaveType(val as LeaveType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LeaveType.CASUAL}>Casual Leave</SelectItem>
                  <SelectItem value={LeaveType.SICK}>Sick Leave</SelectItem>
                  <SelectItem value={LeaveType.EARNED}>Earned Leave</SelectItem>
                  <SelectItem value={LeaveType.UNPAID}>Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="policy-allowance">Annual Allowance (Days) *</Label>
              <Input
                id="policy-allowance"
                type="number"
                min={0}
                max={365}
                value={annualAllowance}
                onChange={(e) => setAnnualAllowance(e.target.value)}
                className="tabular-nums"
              />
              {errors.annualAllowance && (
                <p className="text-xs text-red-600">{errors.annualAllowance}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="policy-name">Policy Display Name *</Label>
            <Input
              id="policy-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Casual Leave"
            />
            {errors.displayName && (
              <p className="text-xs text-red-600">{errors.displayName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="policy-desc">Policy Description *</Label>
            <Textarea
              id="policy-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline eligibility, documentation rules, and accrual details..."
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Policy Status</Label>
              <Select
                value={isActive ? 'ACTIVE' : 'INACTIVE'}
                onValueChange={(val) => setIsActive(val === 'ACTIVE')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Carry Forward</Label>
              <Select
                value={carryForwardAllowed ? 'YES' : 'NO'}
                onValueChange={(val) => setCarryForwardAllowed(val === 'YES')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">Allowed</SelectItem>
                  <SelectItem value="NO">Not Allowed</SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Save Policy'
                  : 'Create Policy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
