import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Notification } from '@/src/types';
import { notificationService } from '@/src/services/notificationService';
import { useAuth } from '@/src/hooks/useAuth';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    try {
      const items = await notificationService.getNotifications(user.role, user.id);
      setNotifications(items);
    } catch {
      // Keep existing notifications if background refresh fails
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const markAsRead = useCallback(async (id: number) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.role, user.id);
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
