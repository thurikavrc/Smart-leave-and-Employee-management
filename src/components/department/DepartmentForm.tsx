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
import { Department, Employee } from '@/src/types';
import { DepartmentInputPayload } from '@/src/services/departmentService';

interface DepartmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDepartment?: Department | null;
  employees: Employee[];
  onSubmit: (payload: DepartmentInputPayload) => Promise<void>;
}

export function DepartmentForm({
  open,
  onOpenChange,
  initialDepartment,
  employees,
  onSubmit,
}: DepartmentFormProps) {
  const isEditing = Boolean(initialDepartment);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [headEmployeeId, setHeadEmployeeId] = useState<string>('none');
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialDepartment) {
        setName(initialDepartment.name);
        setDescription(initialDepartment.description);
        setHeadEmployeeId(
          initialDepartment.headEmployeeId
            ? String(initialDepartment.headEmployeeId)
            : 'none'
        );
      } else {
        setName('');
        setDescription('');
        setHeadEmployeeId('none');
      }
      setErrors({});
      setServerError(null);
    }
  }, [open, initialDepartment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const nextErrors: { name?: string; description?: string } = {};
    if (!name.trim()) nextErrors.name = 'Department name is required.';
    if (!description.trim()) nextErrors.description = 'Description is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        headEmployeeId: headEmployeeId !== 'none' ? Number(headEmployeeId) : undefined,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setServerError(apiErr?.message || 'Failed to save department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Department' : 'Create New Department'}
          </DialogTitle>
          <DialogDescription>
            Define organizational structure, responsibilities, and department leadership.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="dept-name">Department Name *</Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Data Engineering"
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Department Head</Label>
            <Select value={headEmployeeId} onValueChange={setHeadEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select department head" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={String(emp.id)}>
                    {emp.fullName} — {emp.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept-desc">Department Description *</Label>
            <Textarea
              id="dept-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the core functions and scope of this department..."
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description}</p>
            )}
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
                  ? 'Save Changes'
                  : 'Create Department'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
