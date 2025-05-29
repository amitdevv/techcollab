import { api } from '../config/api';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    picture?: string;
  };
  type: 'gig_interest' | 'event_invite' | 'message' | 'collaboration_request' | 'system';
  title: string;
  message: string;
  data?: {
    gigId?: string;
    eventId?: string;
    messageId?: string;
    gigTitle?: string;
    interestedUserName?: string;
    interestedUserPicture?: string;
    [key: string]: any;
  };
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalNotifications: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: number;
}

export const notificationApi = {
  // Send gig interest notification
  sendGigInterest: async (gigId: string, message?: string) => {
    const response = await api.post('/api/notifications/gig-interest', {
      gigId,
      message
    });
    return response.data;
  },

  // Get user notifications
  getNotifications: async (page = 1, limit = 20, unreadOnly = false): Promise<NotificationResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      });
      
      const response = await api.get(`/api/notifications?${params}`);
      
      // Log the response for debugging
      console.log('Notification API Response:', response.data);
      
      // Validate the response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response structure: response.data is not an object');
      }
      
      if (!Array.isArray(response.data.notifications)) {
        throw new Error('Invalid response structure: notifications is not an array');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getNotifications:', error);
      // Return a default structure to prevent crashes
      return {
        notifications: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalNotifications: 0,
          hasNext: false,
          hasPrev: false
        },
        unreadCount: 0
      };
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch('/api/notifications/mark-all-read');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await notificationApi.getNotifications(1, 1, true);
    return response.unreadCount;
  }
}; 