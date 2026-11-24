import { Department } from '@/src/types';
import { apiClient, IS_MOCK_MODE } from '@/src/services/apiClient';
import { mockStore, recalculateDepartmentCounts } from '@/src/services/mockStore';
import { getTodayIsoDate } from '@/src/utils/dateUtils';

export interface DepartmentInputPayload {
  name: string;
  description: string;
  headEmployeeId?: number;
}

export const departmentService = {
  /**
   * GET /departments
   */
  async getAll(): Promise<Department[]> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 180));
      recalculateDepartmentCounts();
      return [...mockStore.departments];
    }
    const { data } = await apiClient.get<Department[]>('/departments');
    return data;
  },

  /**
   * POST /departments
   */
  async create(payload: DepartmentInputPayload): Promise<Department> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 220));
      const duplicate = mockStore.departments.some(
        (d) => d.name.toLowerCase() === payload.name.trim().toLowerCase()
      );
      if (duplicate) {
        throw { status: 409, message: `Department "${payload.name}" already exists.` };
      }
      const head = mockStore.employees.find((e) => e.id === payload.headEmployeeId);
      const nextId = Math.max(0, ...mockStore.departments.map((d) => d.id)) + 1;

      const created: Department = {
        id: nextId,
        name: payload.name.trim(),
        description: payload.description.trim(),
        headEmployeeId: payload.headEmployeeId,
        headName: head?.fullName || 'Unassigned',
        employeeCount: 0,
        createdAt: getTodayIsoDate(),
      };
      mockStore.departments = [created, ...mockStore.departments];
      return created;
    }
    const { data } = await apiClient.post<Department>('/departments', payload);
    return data;
  },

  /**
   * PUT /departments/{id}
   */
  async update(id: number, payload: DepartmentInputPayload): Promise<Department> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 220));
      const idx = mockStore.departments.findIndex((d) => d.id === id);
      if (idx === -1) {
        throw { status: 404, message: `Department #${id} not found.` };
      }
      const head = mockStore.employees.find((e) => e.id === payload.headEmployeeId);
      const updated: Department = {
        ...mockStore.departments[idx],
        name: payload.name.trim(),
        description: payload.description.trim(),
        headEmployeeId: payload.headEmployeeId,
        headName: head?.fullName || 'Unassigned',
      };
      mockStore.departments[idx] = updated;

      // Sync department name across mock employees
      mockStore.employees = mockStore.employees.map((emp) =>
        emp.departmentId === id ? { ...emp, departmentName: updated.name } : emp
      );
      return updated;
    }
    const { data } = await apiClient.put<Department>(`/departments/${id}`, payload);
    return data;
  },

  /**
   * DELETE /departments/{id}
   */
  async remove(id: number): Promise<void> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const assignedCount = mockStore.employees.filter((e) => e.departmentId === id).length;
      if (assignedCount > 0) {
        throw {
          status: 400,
          message: `Cannot delete department while ${assignedCount} employee(s) remain assigned to it.`,
        };
      }
      mockStore.departments = mockStore.departments.filter((d) => d.id !== id);
      return;
    }
    await apiClient.delete(`/departments/${id}`);
  },
};
