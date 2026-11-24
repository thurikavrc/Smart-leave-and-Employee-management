import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { LeaveApplicationForm } from '@/src/components/leave/LeaveApplicationForm';
import { LoadingSpinner } from '@/src/components/common/LoadingSpinner';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Progress } from '@/src/components/ui/progress';
import { Button } from '@/src/components/ui/button';
import { LeaveBalance } from '@/src/types';
import { ApplyLeavePayload, leaveService } from '@/src/services/leaveService';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';

export function ApplyLeavePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await leaveService.getMyLeaveBalance(user.id);
      setBalance(res);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load leave balances.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const handleApplyLeave = async (payload: ApplyLeavePayload) => {
    if (!user) {
      throw { status: 401, message: 'Session expired. Please sign in again.' };
    }
    const created = await leaveService.applyLeave(payload, user.id);
    toast.success(`Leave application ${created.applicationId} submitted`);
    await loadBalance();
    await refreshNotifications();
    return created;
  };

  const balanceItems = balance
    ? [balance.casual, balance.sick, balance.earned, balance.unpaid]
    : [];

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Employee Dashboard', to: '/employee/dashboard' },
        { label: 'Apply for Leave' },
      ]}
      title="Apply for Leave"
      subtitle="Submit a new leave request for manager approval and track available entitlements."
      actions={
        <Button variant="outline" onClick={() => navigate('/employee/requests')}>
          View My Leave Requests
        </Button>
      }
    >
      {isLoading ? (
        <LoadingSpinner label="Loading leave application form..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadBalance} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>Leave Application Details</CardTitle>
              <CardDescription>
                Complete all required fields. Dates cannot be in the past.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveApplicationForm balance={balance} onSubmit={handleApplyLeave} />
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>Available Leave Balances</CardTitle>
                <CardDescription>Remaining days for FY {balance?.year}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {balanceItems.map((item) => {
                  const pct =
                    item.totalAllowed > 0
                      ? (item.remaining / item.totalAllowed) * 100
                      : 0;
                  return (
                    <div key={item.leaveType} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{item.label}</span>
                        <span className="text-slate-600 tabular-nums">
                          <strong className="text-slate-900">{item.remaining}</strong> /{' '}
                          {item.totalAllowed} days
                          {item.pending > 0 ? ` (${item.pending} pending)` : ''}
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-indigo-700" />
                  <span>Application Guidelines</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <p>
                  1. Submit planned Earned Leave requests at least 7 business days prior to departure.
                </p>
                <p>
                  2. Sick Leave exceeding 3 consecutive days requires a supporting medical certificate attachment.
                </p>
                <p>
                  3. In mock mode, your submission receives a temporary reference ID and updates your local leave history. Final balance deduction and policy enforcement are handled by the Java Spring Boot backend.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
