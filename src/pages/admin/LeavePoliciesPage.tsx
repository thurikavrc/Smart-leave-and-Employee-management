import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DataTable, DataTableColumn } from '@/src/components/common/DataTable';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { ErrorState } from '@/src/components/common/ErrorState';
import { ConfirmationDialog } from '@/src/components/common/ConfirmationDialog';
import { LeavePolicyForm } from '@/src/components/leave/LeavePolicyForm';
import { Button } from '@/src/components/ui/button';
import { LeavePolicy } from '@/src/types';
import { LeavePolicyPayload, leaveService } from '@/src/services/leaveService';
import { formatDisplayDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

export function LeavePoliciesPage() {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<LeavePolicy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPolicies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await leaveService.getPolicies();
      setPolicies(list);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load leave policies.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const handleSavePolicy = async (payload: LeavePolicyPayload) => {
    if (editingPolicy) {
      await leaveService.updatePolicy(editingPolicy.id, payload);
      toast.success(`Updated leave policy "${payload.displayName}"`);
    } else {
      await leaveService.createPolicy(payload);
      toast.success(`Created leave policy "${payload.displayName}"`);
    }
    await loadPolicies();
  };

  const handleConfirmDelete = async () => {
    if (!deletingPolicy) return;
    setIsDeleting(true);
    try {
      await leaveService.deletePolicy(deletingPolicy.id);
      toast.success(`Removed policy "${deletingPolicy.displayName}"`);
      setDeletingPolicy(null);
      await loadPolicies();
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<LeavePolicy>[] = [
    {
      key: 'displayName',
      header: 'Policy & Type',
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-900">{p.displayName}</p>
          <p className="text-xs text-slate-500">{formatLeaveTypeLabel(p.leaveType)}</p>
        </div>
      ),
    },
    {
      key: 'allowance',
      header: 'Annual Allowance',
      align: 'right',
      render: (p) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          {p.annualAllowance} days / yr
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (p) => (
        <p className="max-w-md text-xs text-slate-600 line-clamp-2">{p.description}</p>
      ),
    },
    {
      key: 'carryForward',
      header: 'Carry Forward',
      render: (p) => (
        <span className="text-xs text-slate-700">
          {p.carryForwardAllowed ? 'Allowed' : 'No carry-over'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (p) => (
        <span className="text-xs text-slate-500 tabular-nums">
          {formatDisplayDate(p.updatedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="inline-flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setEditingPolicy(p);
              setIsFormOpen(true);
            }}
            title="Edit policy"
          >
            <Pencil className="h-4 w-4 text-slate-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDeletingPolicy(p)}
            title="Delete policy"
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
        { label: 'Leave Policies' },
      ]}
      title="Leave Policies"
      subtitle="Configure annual leave allowances, carry-forward rules, and active leave categories."
      actions={
        <Button
          onClick={() => {
            setEditingPolicy(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Add Leave Policy</span>
        </Button>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={loadPolicies} />
      ) : (
        <DataTable
          data={policies}
          columns={columns}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          emptyTitle="No leave policies configured"
          emptyDescription="Add a leave policy to define annual entitlements for employees."
          emptyActionLabel="Add Leave Policy"
          onEmptyAction={() => {
            setEditingPolicy(null);
            setIsFormOpen(true);
          }}
        />
      )}

      <LeavePolicyForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialPolicy={editingPolicy}
        onSubmit={handleSavePolicy}
      />

      <ConfirmationDialog
        open={Boolean(deletingPolicy)}
        onOpenChange={(open) => !open && setDeletingPolicy(null)}
        title="Delete Leave Policy"
        description={`Remove "${deletingPolicy?.displayName}" from active organization policies?`}
        confirmLabel="Delete Policy"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </DashboardLayout>
  );
}
