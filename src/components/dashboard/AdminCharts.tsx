import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { DashboardStatistics } from '@/src/types';

interface AdminChartsProps {
  stats: DashboardStatistics;
}

export function AdminCharts({ stats }: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Monthly Leave Statistics - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Leave Statistics</CardTitle>
          <CardDescription>
            Approved, pending, and rejected leave applications over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthlyLeaveStats} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="approved" name="Approved" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="Rejected" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Leave Application Trends - Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Application Trends</CardTitle>
          <CardDescription>
            Comparison of total leave submissions versus completed approvals
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.leaveTrends} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="applications"
                name="Total Applications"
                stroke="#3730A3"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3730A3' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="approvals"
                name="Approved Requests"
                stroke="#0EA5E9"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0EA5E9' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. Department-wise Employee Distribution - Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Department-wise Employee Distribution</CardTitle>
          <CardDescription>
            Active headcount breakdown across organizational departments
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.departmentDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                outerRadius={92}
                paddingAngle={2}
              >
                {stats.departmentDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 4. Leave Type Distribution - Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Type Distribution</CardTitle>
          <CardDescription>
            Share of leave requests categorized by Casual, Sick, Earned, and Unpaid types
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.leaveTypeDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                innerRadius={56}
                outerRadius={92}
                paddingAngle={3}
              >
                {stats.leaveTypeDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
