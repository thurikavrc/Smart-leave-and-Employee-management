import {
  Department,
  Employee,
  LeavePolicy,
  LeaveRequest,
  Notification,
} from '@/src/types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_POLICIES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_NOTIFICATIONS,
} from '@/src/services/mockData';

/**
 * In-memory mutable store used ONLY when VITE_USE_MOCK_API is enabled.
 * Keeps mock CRUD state synchronized across services during the browser session.
 * Note: Changes here are temporary for UI demonstration and are not persisted to MySQL.
 */
interface MockStoreState {
  employees: Employee[];
  departments: Department[];
  leaveRequests: LeaveRequest[];
  leavePolicies: LeavePolicy[];
  notifications: Notification[];
}

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));

export const mockStore: MockStoreState = {
  employees: clone(INITIAL_EMPLOYEES),
  departments: clone(INITIAL_DEPARTMENTS),
  leaveRequests: clone(INITIAL_LEAVE_REQUESTS),
  leavePolicies: clone(INITIAL_LEAVE_POLICIES),
  notifications: clone(INITIAL_NOTIFICATIONS),
};

export function recalculateDepartmentCounts() {
  mockStore.departments = mockStore.departments.map((dept) => ({
    ...dept,
    employeeCount: mockStore.employees.filter((emp) => emp.departmentId === dept.id).length,
  }));
}

export function resetMockStore() {
  mockStore.employees = clone(INITIAL_EMPLOYEES);
  mockStore.departments = clone(INITIAL_DEPARTMENTS);
  mockStore.leaveRequests = clone(INITIAL_LEAVE_REQUESTS);
  mockStore.leavePolicies = clone(INITIAL_LEAVE_POLICIES);
  mockStore.notifications = clone(INITIAL_NOTIFICATIONS);
}
