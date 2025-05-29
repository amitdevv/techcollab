import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, User, Briefcase, MessageCircle } from 'lucide-react';
import { notificationApi, Notification } from '../../services/notificationApi';
import { createOrGetChat } from '../../services/inboxApi';
import { formatDistanceToNow } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';

const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getNotifications(1, 10);
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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
        await markAsRead(notification._id);
        
        // Close dropdown and navigate to the chat
        setIsOpen(false);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'gig_interest':
        return <Briefcase className="h-4 w-4 text-purple-600" />;
      case 'collaboration_request':
        return <User className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge
            variant="error"
            className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0 min-w-[20px]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#171717] rounded-lg shadow-lg border border-gray-200 dark:border-dark-buttonBg z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-buttonBg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs border-green-200 dark:border-[#219653] text-green-600 dark:text-[#219653] hover:bg-green-50 dark:hover:bg-[#171717]"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-[#219653] mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-gray-100 dark:border-dark-buttonBg hover:bg-gray-50 dark:hover:bg-[#171717]/60 transition-colors ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-[#219653]/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.sender?.picture ? (
                        <Avatar
                          src={notification.sender.picture}
                          alt={notification.sender.name}
                          size="sm"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-[#171717] rounded-full flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt))}
                          </p>
                          {notification.type === 'gig_interest' && notification.sender && (
                            <button
                              onClick={() => handleStartChat(notification)}
                              disabled={startingChat === notification._id}
                              className="mt-2 inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-primary-600 dark:bg-[#219653] rounded hover:bg-primary-700 dark:hover:bg-[#219653]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {startingChat === notification._id ? 'Starting...' : 'Start Chat'}
                            </button>
                          )}
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="ml-2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-dark-buttonBg text-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm border-green-200 dark:border-[#219653] text-green-600 dark:text-[#219653] hover:bg-green-50 dark:hover:bg-[#171717]"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
            >
              View All Notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown; 