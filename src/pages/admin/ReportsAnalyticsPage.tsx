import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { DataTable, DataTableColumn } from '@/src/components/common/DataTable';
import { FilterDropdown } from '@/src/components/common/FilterDropdown';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { LoadingSpinner } from '@/src/components/common/LoadingSpinner';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Department, LeaveRequest, LeaveStatus, LeaveType } from '@/src/types';
import { leaveService } from '@/src/services/leaveService';
import { departmentService } from '@/src/services/departmentService';
import { formatDisplayDate } from '@/src/utils/dateUtils';
import { exportRowsToCsv, formatLeaveTypeLabel } from '@/src/utils/formatters';

type ReportTab = 'ALL' | 'MONTHLY' | 'DEPARTMENT' | 'APPROVED' | 'REJECTED' | 'PENDING';

export function ReportsAnalyticsPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeReport, setActiveReport] = useState<ReportTab>('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-12-31');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leaveList, deptList] = await Promise.all([
        leaveService.getAllLeaves(),
        departmentService.getAll(),
      ]);
      setLeaves(leaveList);
      setDepartments(deptList);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load reports data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((req) => {
      if (activeReport === 'APPROVED' && req.status !== LeaveStatus.APPROVED) return false;
      if (activeReport === 'REJECTED' && req.status !== LeaveStatus.REJECTED) return false;
      if (activeReport === 'PENDING' && req.status !== LeaveStatus.PENDING) return false;

      if (deptFilter !== 'ALL' && req.departmentName !== deptFilter) return false;
      if (typeFilter !== 'ALL' && req.leaveType !== typeFilter) return false;
      if (fromDate && req.startDate < fromDate) return false;
      if (toDate && req.startDate > toDate) return false;
      return true;
    });
  }, [leaves, activeReport, deptFilter, typeFilter, fromDate, toDate]);

  const departmentChartData = useMemo(() => {
    const map = new Map<
      string,
      { department: string; approved: number; pending: number; rejected: number }
    >();
    departments.forEach((d) => {
      map.set(d.name, { department: d.name, approved: 0, pending: 0, rejected: 0 });
    });

    filteredLeaves.forEach((req) => {
      const entry = map.get(req.departmentName) || {
        department: req.departmentName,
        approved: 0,
        pending: 0,
        rejected: 0,
      };
      if (req.status === LeaveStatus.APPROVED) entry.approved += req.numberOfDays;
      if (req.status === LeaveStatus.PENDING) entry.pending += req.numberOfDays;
      if (req.status === LeaveStatus.REJECTED) entry.rejected += req.numberOfDays;
      map.set(req.departmentName, entry);
    });

    return Array.from(map.values());
  }, [departments, filteredLeaves]);

  const monthlyChartData = useMemo(() => {
    const map = new Map<string, { month: string; days: number; count: number }>();
    filteredLeaves.forEach((req) => {
      const monthKey = req.startDate.slice(0, 7);
      const current = map.get(monthKey) || { month: monthKey, days: 0, count: 0 };
      current.days += req.numberOfDays;
      current.count += 1;
      map.set(monthKey, current);
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredLeaves]);

  const handleExportCsv = () => {
    if (filteredLeaves.length === 0) {
      toast.error('No records available to export for the current filters.');
      return;
    }

    exportRowsToCsv(
      `leave-report-${activeReport.toLowerCase()}-2026.csv`,
      [
        'Application ID',
        'Employee ID',
        'Employee Name',
        'Department',
        'Leave Type',
        'Start Date',
        'End Date',
        'Days',
        'Applied Date',
        'Status',
        'Reviewed By',
        'Rejection Reason',
      ],
      filteredLeaves.map((r) => [
        r.applicationId,
        r.employeeCode,
        r.employeeName,
        r.departmentName,
        formatLeaveTypeLabel(r.leaveType),
        r.startDate,
        r.endDate,
        r.numberOfDays,
        r.appliedDate,
        r.status,
        r.reviewedBy || '',
        r.rejectionReason || '',
      ])
    );

    toast.success(`Exported ${filteredLeaves.length} record(s) to CSV`);
  };

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      key: 'appId',
      header: 'Application ID',
      render: (r) => <span className="font-mono text-xs">{r.applicationId}</span>,
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.employeeName}</p>
          <p className="text-xs text-slate-500">{r.departmentName}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Leave Type',
      render: (r) => <span>{formatLeaveTypeLabel(r.leaveType)}</span>,
    },
    {
      key: 'period',
      header: 'Period',
      render: (r) => (
        <span className="text-xs tabular-nums whitespace-nowrap">
          {formatDisplayDate(r.startDate)} – {formatDisplayDate(r.endDate)}
        </span>
      ),
    },
    {
      key: 'days',
      header: 'Days',
      align: 'right',
      render: (r) => <span className="font-semibold tabular-nums">{r.numberOfDays}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Admin Dashboard', to: '/admin/dashboard' },
        { label: 'Reports & Analytics' },
      ]}
      title="Reports & Analytics"
      subtitle="Generate monthly, department-wise, and status-filtered leave reports with CSV export."
      actions={
        <Button onClick={handleExportCsv}>
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      }
    >
      {/* Report Type Tabs */}
      <Tabs
        value={activeReport}
        onValueChange={(val) => setActiveReport(val as ReportTab)}
      >
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="ALL">Employee Leave History</TabsTrigger>
          <TabsTrigger value="MONTHLY">Monthly Leave Report</TabsTrigger>
          <TabsTrigger value="DEPARTMENT">Department-wise Report</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved Leaves</TabsTrigger>
          <TabsTrigger value="PENDING">Pending Leaves</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected Leaves</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="report-from">From Date</Label>
              <Input
                id="report-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-to">To Date</Label>
              <Input
                id="report-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <FilterDropdown
                value={deptFilter}
                onChange={setDeptFilter}
                className="w-full sm:w-full"
                options={[
                  { label: 'All Departments', value: 'ALL' },
                  ...departments.map((d) => ({ label: d.name, value: d.name })),
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Leave Type</Label>
              <FilterDropdown
                value={typeFilter}
                onChange={setTypeFilter}
                className="w-full sm:w-full"
                options={[
                  { label: 'All Leave Types', value: 'ALL' },
                  { label: 'Casual Leave', value: LeaveType.CASUAL },
                  { label: 'Sick Leave', value: LeaveType.SICK },
                  { label: 'Earned Leave', value: LeaveType.EARNED },
                  { label: 'Unpaid Leave', value: LeaveType.UNPAID },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner label="Generating leave report..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Department Leave Days Breakdown</CardTitle>
                <CardDescription>
                  Total requested days grouped by approval status
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentChartData}
                    margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="approved" name="Approved Days" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending Days" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" name="Rejected Days" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Volume (Filtered)</CardTitle>
                <CardDescription>
                  Total leave days and request counts by calendar month
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyChartData}
                    margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="days" name="Total Leave Days" fill="#3730A3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="count" name="Applications" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileSpreadsheet className="h-4 w-4 text-indigo-700" />
                <span>Report Records ({filteredLeaves.length})</span>
              </div>
            </div>

            <DataTable
              data={filteredLeaves}
              columns={columns}
              keyExtractor={(r) => r.id}
              emptyTitle="No records match this report filter"
              emptyDescription="Try expanding the date range or clearing department/type filters."
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
