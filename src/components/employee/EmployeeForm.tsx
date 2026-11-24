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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Department, Employee, EmploymentStatus, UserRole } from '@/src/types';
import { EmployeeInputPayload } from '@/src/services/employeeService';
import { getTodayIsoDate } from '@/src/utils/dateUtils';

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmployee?: Employee | null;
  departments: Department[];
  employees: Employee[];
  onSubmit: (payload: EmployeeInputPayload) => Promise<void>;
}

interface FormErrors {
  employeeId?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  departmentId?: string;
  designation?: string;
  dateOfJoining?: string;
}

export function EmployeeForm({
  open,
  onOpenChange,
  initialEmployee,
  departments,
  employees,
  onSubmit,
}: EmployeeFormProps) {
  const isEditing = Boolean(initialEmployee);

  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [designation, setDesignation] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState(getTodayIsoDate());
  const [reportingManagerId, setReportingManagerId] = useState<string>('none');
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>(
    EmploymentStatus.ACTIVE
  );
  const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialEmployee) {
        setEmployeeId(initialEmployee.employeeId);
        setFullName(initialEmployee.fullName);
        setEmail(initialEmployee.email);
        setPhoneNumber(initialEmployee.phoneNumber);
        setDepartmentId(String(initialEmployee.departmentId));
        setDesignation(initialEmployee.designation);
        setDateOfJoining(initialEmployee.dateOfJoining);
        setReportingManagerId(
          initialEmployee.reportingManagerId
            ? String(initialEmployee.reportingManagerId)
            : 'none'
        );
        setEmploymentStatus(initialEmployee.employmentStatus);
        setRole(initialEmployee.role);
      } else {
        const nextNum = 1001 + employees.length;
        setEmployeeId(`EMP-${nextNum}`);
        setFullName('');
        setEmail('');
        setPhoneNumber('');
        setDepartmentId(departments[0] ? String(departments[0].id) : '');
        setDesignation('');
        setDateOfJoining(getTodayIsoDate());
        setReportingManagerId('none');
        setEmploymentStatus(EmploymentStatus.ACTIVE);
        setRole(UserRole.EMPLOYEE);
      }
      setErrors({});
      setServerError(null);
    }
  }, [open, initialEmployee, departments, employees.length]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!employeeId.trim()) nextErrors.employeeId = 'Employee ID is required.';
    if (!fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!phoneNumber.trim()) nextErrors.phoneNumber = 'Phone number is required.';
    if (!departmentId) nextErrors.departmentId = 'Department is required.';
    if (!designation.trim()) nextErrors.designation = 'Designation is required.';
    if (!dateOfJoining) nextErrors.dateOfJoining = 'Date of joining is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        employeeId: employeeId.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        departmentId: Number(departmentId),
        designation: designation.trim(),
        dateOfJoining,
        reportingManagerId:
          reportingManagerId !== 'none' ? Number(reportingManagerId) : undefined,
        employmentStatus,
        role,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setServerError(apiErr?.message || 'Failed to save employee record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const managerOptions = employees.filter(
    (emp) =>
      emp.id !== initialEmployee?.id &&
      (emp.role === UserRole.MANAGER || emp.role === UserRole.ADMIN)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update employee directory profile, department assignment, and reporting structure.'
              : 'Create a new employee profile for the organization directory.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="emp-code">Employee ID *</Label>
              <Input
                id="emp-code"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP-1015"
                className="font-mono"
              />
              {errors.employeeId && (
                <p className="text-xs text-red-600">{errors.employeeId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emp-name">Full Name *</Label>
              <Input
                id="emp-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jordan Mercer"
              />
              {errors.fullName && (
                <p className="text-xs text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emp-email">Email Address *</Label>
              <Input
                id="emp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emp-phone">Phone Number *</Label>
              <Input
                id="emp-phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 201-4500"
              />
              {errors.phoneNumber && (
                <p className="text-xs text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Department *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && (
                <p className="text-xs text-red-600">{errors.departmentId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emp-designation">Designation *</Label>
              <Input
                id="emp-designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Java Backend Developer"
              />
              {errors.designation && (
                <p className="text-xs text-red-600">{errors.designation}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emp-joining">Date of Joining *</Label>
              <Input
                id="emp-joining"
                type="date"
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
              />
              {errors.dateOfJoining && (
                <p className="text-xs text-red-600">{errors.dateOfJoining}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Reporting Manager</Label>
              <Select value={reportingManagerId} onValueChange={setReportingManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reporting manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Executive Board / None</SelectItem>
                  {managerOptions.map((mgr) => (
                    <SelectItem key={mgr.id} value={String(mgr.id)}>
                      {mgr.fullName} ({mgr.departmentName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Employment Status *</Label>
              <Select
                value={employmentStatus}
                onValueChange={(val) => setEmploymentStatus(val as EmploymentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EmploymentStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={EmploymentStatus.ON_LEAVE}>On Leave</SelectItem>
                  <SelectItem value={EmploymentStatus.INACTIVE}>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>System Role</Label>
              <Select value={role} onValueChange={(val) => setRole(val as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.EMPLOYEE}>Employee</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-3">
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
                  : 'Create Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
