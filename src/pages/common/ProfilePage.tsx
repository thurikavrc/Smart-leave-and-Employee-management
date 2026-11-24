import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Calendar, Mail, Phone, Shield, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { UserAvatar } from '@/src/components/common/UserAvatar';
import { LoadingSpinner } from '@/src/components/common/LoadingSpinner';
import { Employee } from '@/src/types';
import { employeeService } from '@/src/services/employeeService';
import { useAuth } from '@/src/hooks/useAuth';
import { formatDisplayDate } from '@/src/utils/dateUtils';

export function ProfilePage() {
  const { user, updateCurrentUser } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const emp = await employeeService.getById(user.id);
      setEmployee(emp);
      setFullName(emp.fullName);
      setPhoneNumber(emp.phoneNumber);
    } catch {
      // Fallback to authenticated user object if employee lookup isn't available
      setFullName(user.fullName);
      setPhoneNumber('');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await employeeService.update(user.id, {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      setEmployee(updated);
      updateCurrentUser({ fullName: updated.fullName });
      toast.success('Profile contact information updated');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message || 'Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'My Profile' }]}
      title="My Profile"
      subtitle="Review your organizational profile, reporting structure, and contact preferences."
    >
      {isLoading ? (
        <LoadingSpinner label="Loading profile..." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <UserAvatar
                  name={employee?.fullName || user.fullName}
                  avatarUrl={employee?.avatarUrl || user.avatarUrl}
                  size="lg"
                />
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 truncate">
                    {employee?.fullName || user.fullName}
                  </h2>
                  <p className="text-sm text-slate-500 truncate">
                    {employee?.designation || user.designation}
                  </p>
                  <div className="mt-2">
                    {employee && <StatusBadge status={employee.employmentStatus} />}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-400" /> Employee ID
                  </span>
                  <span className="font-mono font-medium text-slate-900">
                    {employee?.employeeId || user.employeeId}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" /> Email
                  </span>
                  <span className="text-slate-900 truncate">
                    {employee?.email || user.email}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" /> Department
                  </span>
                  <span className="text-slate-900">
                    {employee?.departmentName || user.departmentName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-slate-400" /> Reporting Manager
                  </span>
                  <span className="text-slate-900">
                    {employee?.reportingManagerName || 'Executive Board'}
                  </span>
                </div>
                {employee?.dateOfJoining && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" /> Date of Joining
                    </span>
                    <span className="text-slate-900 tabular-nums">
                      {formatDisplayDate(employee.dateOfJoining)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>Personal Contact Details</CardTitle>
              <CardDescription>
                Update your display name or phone number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input
                      id="profile-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="profile-phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Corporate Email (Read Only)</Label>
                    <Input value={employee?.email || user.email} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label>System Role (Read Only)</Label>
                    <Input value={user.role} disabled />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Profile Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
