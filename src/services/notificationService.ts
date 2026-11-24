import { Notification, UserRole } from '@/src/types';
import { apiClient, IS_MOCK_MODE } from '@/src/services/apiClient';
import { mockStore } from '@/src/services/mockStore';

export const notificationService = {
  /**
   * GET /notifications
   */
  async getNotifications(role: UserRole, employeeId: number): Promise<Notification[]> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return mockStore.notifications.filter((n) => {
        if (n.targetRole === 'ALL') return true;
        if (role === UserRole.ADMIN) {
          return n.targetRole === UserRole.ADMIN || n.targetRole === UserRole.MANAGER;
        }
        if (role === UserRole.MANAGER) {
          return n.targetRole === UserRole.MANAGER || n.recipientEmployeeId === employeeId;
        }
        return n.targetRole === UserRole.EMPLOYEE && (!n.recipientEmployeeId || n.recipientEmployeeId === employeeId);
      });
    }
    const { data } = await apiClient.get<Notification[]>('/notifications');
    return data;
  },

  /**
   * PUT /notifications/{id}/read
   */
  async markAsRead(id: number): Promise<void> {
    if (IS_MOCK_MODE) {
      mockStore.notifications = mockStore.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return;
    }
    await apiClient.put(`/notifications/${id}/read`);
  },

  async markAllAsRead(role: UserRole, employeeId: number): Promise<void> {
    if (IS_MOCK_MODE) {
      const visibleIds = new Set(
        (await this.getNotifications(role, employeeId)).map((n) => n.id)
      );
      mockStore.notifications = mockStore.notifications.map((n) =>
        visibleIds.has(n.id) ? { ...n, isRead: true } : n
      );
      return;
    }
    await apiClient.put('/notifications/read-all');
  },
};
