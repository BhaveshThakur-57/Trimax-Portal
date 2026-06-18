import api from './api';

const notificationService = {
  // Get all notifications for current user
  getAll: () => {
    return api.get('/notifications');
  },

  // Get unread count
  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  },

  // Mark notification as read
  markAsRead: (id) => {
    return api.patch(`/notifications/${id}/read`);
  },

  // Mark all as read
  markAllAsRead: () => {
    return api.patch('/notifications/mark-all-read');
  },

  // Delete notification
  delete: (id) => {
    return api.delete(`/notifications/${id}`);
  },

  // Clear all notifications
  clearAll: () => {
    return api.delete('/notifications/clear-all');
  }
};

export default notificationService;