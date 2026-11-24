import {
  LeaveBalance,
  LeavePolicy,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  UserRole,
} from '@/src/types';
import { apiClient, IS_MOCK_MODE } from '@/src/services/apiClient';
import { mockStore } from '@/src/services/mockStore';
import { computeBalanceForEmployee } from '@/src/services/mockData';
import { calculateInclusiveDays, getTodayIsoDate } from '@/src/utils/dateUtils';
import { formatLeaveTypeLabel } from '@/src/utils/formatters';

export interface ApplyLeavePayload {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  supportingDocumentName?: string;
}

export interface LeavePolicyPayload {
  leaveType: LeaveType;
  displayName: string;
  annualAllowance: number;
  description: string;
  isActive: boolean;
  carryForwardAllowed: boolean;
}

export const leaveService = {
  /**
   * POST /leaves
   */
  async applyLeave(payload: ApplyLeavePayload, currentUserId: number): Promise<LeaveRequest> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 280));
      const emp = mockStore.employees.find((e) => e.id === currentUserId);
      if (!emp) {
        throw { status: 404, message: 'Current employee profile not found.' };
      }

      const days = calculateInclusiveDays(payload.startDate, payload.endDate);
      if (days <= 0) {
        throw { status: 400, message: 'End date must be on or after the start date.' };
      }

      const nextId = Math.max(0, ...mockStore.leaveRequests.map((r) => r.id)) + 1;
      const appCode = `LR-2026-${String(142 + nextId).padStart(4, '0')}`;

      const created: LeaveRequest = {
        id: nextId,
        applicationId: appCode,
        employeeId: emp.id,
        employeeCode: emp.employeeId,
        employeeName: emp.fullName,
        departmentName: emp.departmentName,
        designation: emp.designation,
        leaveType: payload.leaveType,
        startDate: payload.startDate,
        endDate: payload.endDate,
        numberOfDays: days,
        reason: payload.reason.trim(),
        supportingDocumentName: payload.supportingDocumentName,
        appliedDate: getTodayIsoDate(),
        status: LeaveStatus.PENDING,
      };

      mockStore.leaveRequests = [created, ...mockStore.leaveRequests];

      // Create manager & admin notification
      mockStore.notifications = [
        {
          id: Math.max(0, ...mockStore.notifications.map((n) => n.id)) + 1,
          title: 'New Leave Application',
          message: `${emp.fullName} requested ${days} day(s) of ${formatLeaveTypeLabel(
            payload.leaveType
          )} (${payload.startDate} to ${payload.endDate}).`,
          category: 'LEAVE_APPLIED',
          targetRole: UserRole.MANAGER,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/manager/approvals',
        },
        ...mockStore.notifications,
      ];

      return created;
    }

    const { data } = await apiClient.post<LeaveRequest>('/leaves', payload);
    return data;
  },

  /**
   * GET /leaves
   */
  async getAllLeaves(): Promise<LeaveRequest[]> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return [...mockStore.leaveRequests];
    }
    const { data } = await apiClient.get<LeaveRequest[]>('/leaves');
    return data;
  },

  /**
   * GET /leaves/my
   */
  async getMyLeaves(currentUserId: number): Promise<LeaveRequest[]> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 180));
      return mockStore.leaveRequests.filter((r) => r.employeeId === currentUserId);
    }
    const { data } = await apiClient.get<LeaveRequest[]>('/leaves/my');
    return data;
  },

  /**
   * GET /leaves/{id}
   */
  async getLeaveById(id: number): Promise<LeaveRequest> {
    if (IS_MOCK_MODE) {
      const found = mockStore.leaveRequests.find((r) => r.id === id);
      if (!found) {
        throw { status: 404, message: `Leave application #${id} not found.` };
      }
      return { ...found };
    }
    const { data } = await apiClient.get<LeaveRequest>(`/leaves/${id}`);
    return data;
  },

  /**
   * PUT /leaves/{id}/approve
   */
  async approveLeave(id: number, reviewerName: string): Promise<LeaveRequest> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const idx = mockStore.leaveRequests.findIndex((r) => r.id === id);
      if (idx === -1) {
        throw { status: 404, message: `Leave application #${id} not found.` };
      }

      const updated: LeaveRequest = {
        ...mockStore.leaveRequests[idx],
        status: LeaveStatus.APPROVED,
        reviewedBy: reviewerName,
        reviewedDate: getTodayIsoDate(),
        rejectionReason: undefined,
      };
      mockStore.leaveRequests[idx] = updated;

      mockStore.notifications = [
        {
          id: Math.max(0, ...mockStore.notifications.map((n) => n.id)) + 1,
          title: 'Leave Request Approved',
          message: `Application ${updated.applicationId} (${formatLeaveTypeLabel(
            updated.leaveType
          )}) was approved by ${reviewerName}.`,
          category: 'LEAVE_APPROVED',
          targetRole: UserRole.EMPLOYEE,
          recipientEmployeeId: updated.employeeId,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/employee/requests',
        },
        ...mockStore.notifications,
      ];

      return updated;
    }

    const { data } = await apiClient.put<LeaveRequest>(`/leaves/${id}/approve`);
    return data;
  },

  /**
   * PUT /leaves/{id}/reject
   */
  async rejectLeave(
    id: number,
    rejectionReason: string,
    reviewerName: string
  ): Promise<LeaveRequest> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (!rejectionReason.trim()) {
        throw { status: 400, message: 'A rejection reason is required.' };
      }
      const idx = mockStore.leaveRequests.findIndex((r) => r.id === id);
      if (idx === -1) {
        throw { status: 404, message: `Leave application #${id} not found.` };
      }

      const updated: LeaveRequest = {
        ...mockStore.leaveRequests[idx],
        status: LeaveStatus.REJECTED,
        reviewedBy: reviewerName,
        reviewedDate: getTodayIsoDate(),
        rejectionReason: rejectionReason.trim(),
      };
      mockStore.leaveRequests[idx] = updated;

      mockStore.notifications = [
        {
          id: Math.max(0, ...mockStore.notifications.map((n) => n.id)) + 1,
          title: 'Leave Request Rejected',
          message: `Application ${updated.applicationId} was rejected by ${reviewerName}: "${updated.rejectionReason}"`,
          category: 'LEAVE_REJECTED',
          targetRole: UserRole.EMPLOYEE,
          recipientEmployeeId: updated.employeeId,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/employee/requests',
        },
        ...mockStore.notifications,
      ];

      return updated;
    }

    const { data } = await apiClient.put<LeaveRequest>(`/leaves/${id}/reject`, {
      rejectionReason,
    });
    return data;
  },

  /**
   * GET /leaves/balance/my
   */
  async getMyLeaveBalance(currentUserId: number): Promise<LeaveBalance> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return computeBalanceForEmployee(
        currentUserId,
        mockStore.leaveRequests,
        mockStore.leavePolicies
      );
    }
    const { data } = await apiClient.get<LeaveBalance>('/leaves/balance/my');
    return data;
  },

  /**
   * GET /employees/{id}/leave-balance
   */
  async getEmployeeLeaveBalance(employeeId: number): Promise<LeaveBalance> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return computeBalanceForEmployee(
        employeeId,
        mockStore.leaveRequests,
        mockStore.leavePolicies
      );
    }
    const { data } = await apiClient.get<LeaveBalance>(
      `/employees/${employeeId}/leave-balance`
    );
    return data;
  },

  /**
   * Leave Policy management endpoints (Admin)
   */
  async getPolicies(): Promise<LeavePolicy[]> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return [...mockStore.leavePolicies];
    }
    const { data } = await apiClient.get<LeavePolicy[]>('/leave-policies');
    return data;
  },

  async createPolicy(payload: LeavePolicyPayload): Promise<LeavePolicy> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const nextId = Math.max(0, ...mockStore.leavePolicies.map((p) => p.id)) + 1;
      const created: LeavePolicy = {
        id: nextId,
        ...payload,
        updatedAt: getTodayIsoDate(),
      };
      mockStore.leavePolicies = [...mockStore.leavePolicies, created];
      return created;
    }
    const { data } = await apiClient.post<LeavePolicy>('/leave-policies', payload);
    return data;
  },

  async updatePolicy(id: number, payload: LeavePolicyPayload): Promise<LeavePolicy> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const idx = mockStore.leavePolicies.findIndex((p) => p.id === id);
      if (idx === -1) {
        throw { status: 404, message: `Leave policy #${id} not found.` };
      }
      const updated: LeavePolicy = {
        id,
        ...payload,
        updatedAt: getTodayIsoDate(),
      };
      mockStore.leavePolicies[idx] = updated;
      return updated;
    }
    const { data } = await apiClient.put<LeavePolicy>(`/leave-policies/${id}`, payload);
    return data;
  },

  async deletePolicy(id: number): Promise<void> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 180));
      mockStore.leavePolicies = mockStore.leavePolicies.filter((p) => p.id !== id);
      return;
    }
    await apiClient.delete(`/leave-policies/${id}`);
  },
};
