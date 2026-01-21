import { apiClient } from './client';
import type { Notification } from '../types';

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface SingleNotificationResponse {
  notification: Notification;
}

const transformNotification = (notification: any): Notification => ({
  id: notification._id || notification.id,
  userId: notification.userId._id || notification.userId.id || notification.userId,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  taskId: notification.taskId?._id || notification.taskId?.id || notification.taskId,
  projectId: notification.projectId?._id || notification.projectId?.id || notification.projectId,
  read: notification.read,
  createdAt: new Date(notification.createdAt),
});

export const notificationsApi = {
  async getAll(unreadOnly: boolean = false): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const response = await apiClient.get<NotificationsResponse>(
      `/api/notifications${unreadOnly ? '?unreadOnly=true' : ''}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al obtener notificaciones');
    }

    return {
      notifications: response.data.notifications.map(transformNotification),
      unreadCount: response.data.unreadCount,
    };
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.put<SingleNotificationResponse>('/api/notifications', {
      notificationId,
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al marcar notificación como leída');
    }

    return transformNotification(response.data.notification);
  },

  async markAllAsRead(): Promise<void> {
    const response = await apiClient.put('/api/notifications', {
      markAllAsRead: true,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Error al marcar todas las notificaciones como leídas');
    }
  },
};
