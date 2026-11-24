import {
  DashboardStatistics,
  EmploymentStatus,
  LeaveStatus,
  LeaveType,
} from '@/src/types';
import { apiClient, IS_MOCK_MODE } from '@/src/services/apiClient';
import { mockStore, recalculateDepartmentCounts } from '@/src/services/mockStore';
import {
  DEPARTMENT_COLORS,
  HISTORICAL_LEAVE_TRENDS,
  HISTORICAL_MONTHLY_LEAVE_STATS,
  LEAVE_TYPE_COLORS,
} from '@/src/services/mockData';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

function buildMockStatistics(managerId?: number): DashboardStatistics {
  recalculateDepartmentCounts();

  const teamMembers = managerId
    ? mockStore.employees.filter((e) => e.reportingManagerId === managerId)
    : mockStore.employees;
  const teamIds = new Set(teamMembers.map((e) => e.id));

  const scopedLeaves = managerId
    ? mockStore.leaveRequests.filter((r) => teamIds.has(r.employeeId))
    : mockStore.leaveRequests;

  const pendingLeaves = scopedLeaves.filter((r) => r.status === LeaveStatus.PENDING).length;
  const approvedLeaves = scopedLeaves.filter((r) => r.status === LeaveStatus.APPROVED).length;
  const rejectedLeaves = scopedLeaves.filter((r) => r.status === LeaveStatus.REJECTED).length;

  const departmentDistribution = mockStore.departments.map((dept, index) => ({
    name: dept.name,
    value: dept.employeeCount,
    color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
  }));

  const leaveTypeCounts: Record<LeaveType, number> = {
    [LeaveType.CASUAL]: 0,
    [LeaveType.SICK]: 0,
    [LeaveType.EARNED]: 0,
    [LeaveType.UNPAID]: 0,
  };
  scopedLeaves.forEach((r) => {
    leaveTypeCounts[r.leaveType] = (leaveTypeCounts[r.leaveType] || 0) + 1;
  });

  const leaveTypeDistribution = (Object.keys(leaveTypeCounts) as LeaveType[]).map((lt) => ({
    name: formatLeaveTypeLabel(lt),
    value: leaveTypeCounts[lt],
    leaveType: lt,
    color: LEAVE_TYPE_COLORS[lt],
  }));

  // Update the latest month ("Nov") dynamically from live mock store counts
  const monthlyLeaveStats = HISTORICAL_MONTHLY_LEAVE_STATS.map((item, idx, arr) => {
    if (idx !== arr.length - 1) return item;
    return {
      month: 'Nov',
      approved: approvedLeaves,
      pending: pendingLeaves,
      rejected: rejectedLeaves,
      total: approvedLeaves + pendingLeaves + rejectedLeaves,
    };
  });

  const leaveTrends = HISTORICAL_LEAVE_TRENDS.map((item, idx, arr) => {
    if (idx !== arr.length - 1) return item;
    return {
      month: 'Nov',
      applications: scopedLeaves.length,
      approvals: approvedLeaves,
    };
  });

  return {
    totalEmployees: mockStore.employees.length,
    totalDepartments: mockStore.departments.length,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
    teamSize: teamMembers.length,
    employeesOnLeave: teamMembers.filter(
      (e) => e.employmentStatus === EmploymentStatus.ON_LEAVE
    ).length,
    monthlyLeaveStats,
    departmentDistribution,
    leaveTypeDistribution,
    leaveTrends,
  };
}

export const dashboardService = {
  /**
   * GET /dashboard/admin
   */
  async getAdminDashboard(): Promise<DashboardStatistics> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 180));
      return buildMockStatistics();
    }
    const { data } = await apiClient.get<DashboardStatistics>('/dashboard/admin');
    return data;
  },

  /**
   * GET /dashboard/manager
   */
  async getManagerDashboard(managerId: number): Promise<DashboardStatistics> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 180));
      return buildMockStatistics(managerId);
    }
    const { data } = await apiClient.get<DashboardStatistics>('/dashboard/manager');
    return data;
  },

  /**
   * GET /dashboard/employee
   */
  async getEmployeeDashboard(employeeId: number): Promise<DashboardStatistics> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 160));
      const myLeaves = mockStore.leaveRequests.filter((r) => r.employeeId === employeeId);
      return {
        totalEmployees: 1,
        totalDepartments: 1,
        pendingLeaves: myLeaves.filter((r) => r.status === LeaveStatus.PENDING).length,
        approvedLeaves: myLeaves.filter((r) => r.status === LeaveStatus.APPROVED).length,
        rejectedLeaves: myLeaves.filter((r) => r.status === LeaveStatus.REJECTED).length,
        monthlyLeaveStats: [],
        departmentDistribution: [],
        leaveTypeDistribution: [],
        leaveTrends: [],
      };
    }
    const { data } = await apiClient.get<DashboardStatistics>('/dashboard/employee');
    return data;
  },
};
