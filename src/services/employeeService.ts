import { Employee, EmploymentStatus, UserRole } from '@/src/types';
import { apiClient, IS_MOCK_MODE } from '@/src/services/apiClient';
import { mockStore, recalculateDepartmentCounts } from '@/src/services/mockStore';

export interface EmployeeInputPayload {
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  departmentId: number;
  designation: string;
  dateOfJoining: string;
  reportingManagerId?: number;
  employmentStatus: EmploymentStatus;
  role?: UserRole;
}

export const employeeService = {
  /**
   * GET /employees
   */
  async getAll(): Promise<Employee[]> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return [...mockStore.employees];
    }
    const { data } = await apiClient.get<Employee[]>('/employees');
    return data;
  },

  /**
   * GET /employees/{id}
   */
  async getById(id: number): Promise<Employee> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const found = mockStore.employees.find((e) => e.id === id);
      if (!found) {
        throw { status: 404, message: `Employee #${id} not found.` };
      }
      return { ...found };
    }
    const { data } = await apiClient.get<Employee>(`/employees/${id}`);
    return data;
  },

  /**
   * POST /employees
   */
  async create(payload: EmployeeInputPayload): Promise<Employee> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const duplicateCode = mockStore.employees.some(
        (e) => e.employeeId.toLowerCase() === payload.employeeId.trim().toLowerCase()
      );
      if (duplicateCode) {
        throw { status: 409, message: `Employee ID ${payload.employeeId} already exists.` };
      }
      const duplicateEmail = mockStore.employees.some(
        (e) => e.email.toLowerCase() === payload.email.trim().toLowerCase()
      );
      if (duplicateEmail) {
        throw { status: 409, message: `Email ${payload.email} is already registered.` };
      }

      const dept = mockStore.departments.find((d) => d.id === payload.departmentId);
      const manager = mockStore.employees.find((e) => e.id === payload.reportingManagerId);
      const nextId = Math.max(0, ...mockStore.employees.map((e) => e.id)) + 1;

      const created: Employee = {
        id: nextId,
        employeeId: payload.employeeId.trim(),
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        phoneNumber: payload.phoneNumber.trim(),
        departmentId: payload.departmentId,
        departmentName: dept?.name || 'Unassigned',
        designation: payload.designation.trim(),
        dateOfJoining: payload.dateOfJoining,
        reportingManagerId: payload.reportingManagerId,
        reportingManagerName: manager?.fullName || 'Executive Board',
        employmentStatus: payload.employmentStatus,
        role: payload.role || UserRole.EMPLOYEE,
      };

      mockStore.employees = [created, ...mockStore.employees];
      recalculateDepartmentCounts();

      mockStore.notifications = [
        {
          id: Math.max(0, ...mockStore.notifications.map((n) => n.id)) + 1,
          title: 'New Employee Added',
          message: `${created.fullName} (${created.employeeId}) joined ${created.departmentName} as ${created.designation}.`,
          category: 'EMPLOYEE_CREATED',
          targetRole: UserRole.ADMIN,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/admin/employees',
        },
        ...mockStore.notifications,
      ];

      return created;
    }
    const { data } = await apiClient.post<Employee>('/employees', payload);
    return data;
  },

  /**
   * PUT /employees/{id}
   */
  async update(id: number, payload: Partial<EmployeeInputPayload>): Promise<Employee> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const idx = mockStore.employees.findIndex((e) => e.id === id);
      if (idx === -1) {
        throw { status: 404, message: `Employee #${id} not found.` };
      }
      const existing = mockStore.employees[idx];
      const deptId = payload.departmentId ?? existing.departmentId;
      const dept = mockStore.departments.find((d) => d.id === deptId);
      const mgrId =
        payload.reportingManagerId !== undefined
          ? payload.reportingManagerId
          : existing.reportingManagerId;
      const manager = mockStore.employees.find((e) => e.id === mgrId);

      const updated: Employee = {
        ...existing,
        ...payload,
        departmentId: deptId,
        departmentName: dept?.name || existing.departmentName,
        reportingManagerId: mgrId,
        reportingManagerName: mgrId ? manager?.fullName || existing.reportingManagerName : 'Executive Board',
      };

      mockStore.employees[idx] = updated;
      recalculateDepartmentCounts();
      return updated;
    }
    const { data } = await apiClient.put<Employee>(`/employees/${id}`, payload);
    return data;
  },

  /**
   * DELETE /employees/{id}
   */
  async remove(id: number): Promise<void> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      mockStore.employees = mockStore.employees.filter((e) => e.id !== id);
      recalculateDepartmentCounts();
      return;
    }
    await apiClient.delete(`/employees/${id}`);
  },
};
