import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Sun, HeartPulse, Briefcase, Wallet } from 'lucide-react';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/src/components/common/LoadingSpinner';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { LeaveBalance, LeavePolicy, LeaveType } from '@/src/types';
import { leaveService } from '@/src/services/leaveService';
import { useAuth } from '@/src/hooks/useAuth';

export function LeaveBalancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [balRes, polRes] = await Promise.all([
        leaveService.getMyLeaveBalance(user.id),
        leaveService.getPolicies(),
      ]);
      setBalance(balRes);
      setPolicies(polRes);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load leave balance details.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cardConfigs = balance
    ? [
        {
          item: balance.casual,
          icon: Sun,
          tone: 'bg-indigo-50 text-indigo-700',
          bar: 'bg-indigo-700',
        },
        {
          item: balance.sick,
          icon: HeartPulse,
          tone: 'bg-sky-50 text-sky-700',
          bar: 'bg-sky-600',
        },
        {
          item: balance.earned,
          icon: Briefcase,
          tone: 'bg-emerald-50 text-emerald-700',
          bar: 'bg-emerald-600',
        },
        {
          item: balance.unpaid,
          icon: Wallet,
          tone: 'bg-slate-100 text-slate-700',
          bar: 'bg-slate-500',
        },
      ]
    : [];

  const getPolicyDescription = (type: LeaveType) =>
    policies.find((p) => p.leaveType === type)?.description ||
    'Standard organizational leave policy applies.';

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Employee Dashboard', to: '/employee/dashboard' },
        { label: 'Leave Balance' },
      ]}
      title="Leave Balance"
      subtitle="Detailed breakdown of annual leave allowances, approved usage, pending days, and remaining entitlement."
      actions={
        <Button onClick={() => navigate('/employee/apply')}>
          <CalendarPlus className="h-4 w-4" />
          <span>Apply for Leave</span>
        </Button>
      }
    >
      {isLoading ? (
        <LoadingSpinner label="Loading leave balances..." />
      ) : error || !balance ? (
        <ErrorState
          message={error || 'Unable to load leave balance.'}
          onRetry={loadData}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cardConfigs.map(({ item, icon: Icon, tone, bar }) => {
            const pct =
              item.totalAllowed > 0
                ? (item.remaining / item.totalAllowed) * 100
                : 0;
            return (
              <Card key={item.leaveType}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle>{item.label}</CardTitle>
                    <CardDescription className="mt-1">
                      FY {balance.year} Entitlement
                    </CardDescription>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-bold text-slate-900 tabular-nums">
                        {item.remaining}
                      </span>
                      <span className="ml-1.5 text-sm text-slate-500">
                        days available
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                      {Math.round(pct)}% remaining
                    </span>
                  </div>

                  <Progress value={pct} indicatorClassName={bar} />

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
                    <div>
                      <p className="text-slate-500">Annual Quota</p>
                      <p className="mt-0.5 font-semibold text-slate-900 tabular-nums">
                        {item.totalAllowed}d
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Approved Used</p>
                      <p className="mt-0.5 font-semibold text-slate-900 tabular-nums">
                        {item.used}d
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Pending Review</p>
                      <p className="mt-0.5 font-semibold text-amber-700 tabular-nums">
                        {item.pending}d
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                    {getPolicyDescription(item.leaveType)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
