import React, { useState } from 'react';
import { Database, RotateCcw, Server, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { API_BASE_URL, IS_MOCK_MODE } from '@/src/services/apiClient';
import { resetMockStore } from '@/src/services/mockStore';
import { useNotifications } from '@/src/hooks/useNotifications';

export function SettingsPage() {
  const { refreshNotifications } = useNotifications();
  const [companyName, setCompanyName] = useState('Acme Enterprise Technologies');
  const [fiscalYearStart, setFiscalYearStart] = useState('January');
  const [workingWeek, setWorkingWeek] = useState('Monday – Friday');

  const handleSaveOrgSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Organization preferences updated in current session');
  };

  const handleResetDemo = async () => {
    resetMockStore();
    await refreshNotifications();
    toast.success('Mock session data restored to initial defaults');
  };

  const endpoints = [
    { method: 'POST', path: '/auth/login', purpose: 'Spring Security JWT authentication' },
    { method: 'GET / POST', path: '/employees', purpose: 'Employee directory & onboarding' },
    { method: 'GET / POST', path: '/departments', purpose: 'Department structure & headcount' },
    { method: 'GET / POST', path: '/leaves', purpose: 'Leave submissions & organization feed' },
    { method: 'PUT', path: '/leaves/{id}/approve', purpose: 'Manager/Admin leave approval' },
    { method: 'PUT', path: '/leaves/{id}/reject', purpose: 'Manager/Admin rejection with reason' },
    { method: 'GET', path: '/leaves/balance/my', purpose: 'Employee leave balance summary' },
    { method: 'GET', path: '/dashboard/admin', purpose: 'Aggregated KPI & chart metrics' },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Admin Dashboard', to: '/admin/dashboard' },
        { label: 'Settings' },
      ]}
      title="System & Integration Settings"
      subtitle="Manage HR workspace configuration and review Java Spring Boot REST API readiness."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
            <CardDescription>
              General leave cycle and calendar settings for your workplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveOrgSettings} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fiscal-start">Leave Year Starts</Label>
                  <Input
                    id="fiscal-start"
                    value={fiscalYearStart}
                    onChange={(e) => setFiscalYearStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="work-week">Standard Work Week</Label>
                  <Input
                    id="work-week"
                    value={workingWeek}
                    onChange={(e) => setWorkingWeek(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit">Save Preferences</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4.5 w-4.5 text-indigo-700" />
              <span>Spring Boot Backend Configuration</span>
            </CardTitle>
            <CardDescription>
              Environment configuration read from <code className="font-mono text-xs">.env</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">VITE_API_BASE_URL</span>
                <code className="font-mono text-xs font-medium text-slate-900">
                  {API_BASE_URL}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Data Mode</span>
                <span className="font-medium text-slate-900">
                  {IS_MOCK_MODE ? 'Frontend Mock Mode (Temporary)' : 'Live Spring Boot REST API'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Target Persistence</span>
                <span className="inline-flex items-center gap-1.5 text-slate-800 font-medium">
                  <Database className="h-3.5 w-3.5 text-slate-500" />
                  Java 21 · Spring Boot · MySQL 8
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-indigo-700 shrink-0" />
              <p>
                To connect your Java backend, set <code className="font-mono">VITE_USE_MOCK_API=false</code> in your environment and enable CORS for your React origin in Spring Security.
              </p>
            </div>

            {IS_MOCK_MODE && (
              <Button variant="outline" size="sm" onClick={handleResetDemo}>
                <RotateCcw className="h-4 w-4" />
                <span>Reset Mock Demo Data</span>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spring Boot REST API Contract</CardTitle>
          <CardDescription>
            Axios service layer endpoints mapped in <code className="font-mono text-xs">src/services/</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {endpoints.map((ep) => (
              <div
                key={ep.path}
                className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-indigo-700 w-24">
                    {ep.method}
                  </span>
                  <code className="font-mono text-xs text-slate-900">{ep.path}</code>
                </div>
                <span className="text-xs text-slate-500">{ep.purpose}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
