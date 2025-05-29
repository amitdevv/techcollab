import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Filter, RefreshCw, MessageCircle } from 'lucide-react';
import { notificationApi } from '../../services/notificationApi';
import { createOrGetChat } from '../../services/inboxApi';
import { useNotificationContext } from '../../contexts/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  type: 'gig_interest' | 'event_invite' | 'message' | 'collaboration_request' | 'system';
  title: string;
  message: string;
  sender?: {
    _id: string;
    name: string;
    picture?: string;
  };
  data?: any;
  read: boolean;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { refreshKey } = useNotificationContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications();
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [refreshKey]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleStartChat = async (notification: Notification) => {
    if (!notification.sender) {
      toast.error('Cannot start chat - sender information not available');
      return;
    }

    try {
      setStartingChat(notification._id);
      
      // Create or get chat with the sender, include gig context if available
      const response = await createOrGetChat(
        notification.sender._id, 
        notification.data?.gigId
      );
      
      if (response.chat) {
        // Mark notification as read when chat is started
        await handleMarkAsRead(notification._id);
        
        // Navigate to the chat
        navigate(`/inbox/${response.chat._id}`);
        toast.success(`Chat started with ${notification.sender.name}!`);
      }
    } catch (error: any) {
      console.error('Error starting chat:', error);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to start chat');
      }
    } finally {
      setStartingChat(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'gig_interest':
        return '💼';
      case 'event_invite':
        return '📅';
      case 'message':
        return '💬';
      case 'collaboration_request':
        return '🤝';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'gig_interest':
        return 'bg-blue-50 text-blue-700';
      case 'event_invite':
        return 'bg-green-50 text-green-700';
      case 'message':
        return 'bg-purple-50 text-purple-700';
      case 'collaboration_request':
        return 'bg-orange-50 text-orange-700';
      case 'system':
        return 'bg-gray-50 text-gray-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-[#219653]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-6 w-6 text-primary-600 dark:text-[#219653]" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="error" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshNotifications}
            disabled={refreshing}
            className="border-green-200 dark:border-[#219653] text-green-600 dark:text-[#219653] hover:bg-green-50 dark:hover:bg-[#171717]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="border-green-200 dark:border-[#219653] text-green-600 dark:text-[#219653] hover:bg-green-50 dark:hover:bg-[#171717]"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-buttonBg">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'read', label: 'Read', count: notifications.length - unreadCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                filter === tab.key
                  ? 'border-[#219653] text-[#219653] dark:border-[#219653] dark:text-[#219653]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  filter === tab.key
                    ? 'bg-[#219653]/10 text-[#219653]'
                    : 'bg-gray-100 dark:bg-[#171717] text-gray-600 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'read' ? 'No read notifications' : 'No notifications'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'all' ? 'You\'re all caught up!' : 
               filter === 'unread' ? 'All notifications have been read.' : 
               'No read notifications to show.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white dark:bg-[#171717] border rounded-lg p-4 transition-all hover:shadow-md ${
                !notification.read 
                  ? 'border-l-4 border-l-[#219653] bg-[#219653]/5 dark:bg-[#219653]/10' 
                  : 'border-gray-200 dark:border-dark-buttonBg'
              }`}
            >
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0">
                  {notification.sender?.picture ? (
                    <Avatar 
                      src={notification.sender.picture} 
                      alt={notification.sender.name}
                      size="sm"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg 
                      ${!notification.read 
                        ? 'bg-[#219653]/10 text-[#219653]' 
                        : 'bg-gray-100 dark:bg-[#171717] text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {getTypeIcon(notification.type)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`text-sm font-medium ${
                      !notification.read 
                        ? 'text-gray-900 dark:text-dark-text' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.title}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        !notification.read
                          ? 'bg-[#219653]/10 text-[#219653] border-[#219653]'
                          : 'bg-gray-100 dark:bg-[#171717] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-dark-buttonBg'
                      }`}
                    >
                      {notification.type.replace('_', ' ')}
                    </Badge>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-[#219653] rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(notification.createdAt)}
                    </span>
                    <div className="flex items-center space-x-2">
                      {notification.type === 'gig_interest' && notification.sender && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleStartChat(notification)}
                          disabled={startingChat === notification._id}
                          className="bg-[#219653] hover:bg-[#219653]/90 text-white"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {startingChat === notification._id ? 'Starting...' : 'Start Chat'}
                        </Button>
                      )}
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="text-xs text-[#219653] hover:text-[#219653]/80 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications; 