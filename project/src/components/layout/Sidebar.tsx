import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Briefcase,
  Calendar,
  MessageSquare,
  Users,
  Bookmark,
  Settings,
  PanelLeft,
  Search,
  Menu,
  LogOut,
  UserCircle,
  Plus,
  X,
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { useTheme } from "../../context/ThemeContext";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { notificationApi } from "../../services/notificationApi";
import { requestNotificationPermission, showGigInterestNotification } from "../../utils/browserNotifications";
import ThemeSwitch from "../ui/ThemeSwitch";
import Logo from "../ui/Logo";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  toggleSidebar,
}) => {
  const { user, logout } = useAuth();
  const { refreshKey } = useNotificationContext();
  const { toggleDarkMode, isDarkMode } = useTheme();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);

  // Request notification permission on mount
  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      // Check if user is authenticated
      if (!user || !user.token) {
        console.log('User not authenticated, skipping notification fetch');
        return;
      }
      
      try {
        console.log('Fetching notifications for user:', user.id);
        const response = await notificationApi.getNotifications();
        
        // Validate response structure
        if (!response || !Array.isArray(response.notifications)) {
          console.error('Invalid notification response structure:', response);
          return;
        }
        
        console.log('Fetched notifications:', response.notifications.length, 'total');
        const unread = response.notifications.filter(n => !n.read).length;
        console.log('Unread notifications:', unread);
        
        // Show browser notification if count increased
        if (unread > previousUnreadCount && previousUnreadCount > 0) {
          const newNotifications = response.notifications
            .filter(n => !n.read)
            .slice(0, unread - previousUnreadCount);
          
          // Show browser notification for the most recent one
          if (newNotifications.length > 0) {
            const latest = newNotifications[0];
            if (latest.type === 'gig_interest') {
              showGigInterestNotification(
                latest.sender?.name || 'Someone',
                latest.data?.gigTitle || 'your gig'
              );
            }
          }
        }
        
        setPreviousUnreadCount(unreadCount);
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Check if it's an authentication error
        if ((error as any)?.response?.status === 401) {
          console.log('Authentication failed, user may need to log in again');
        }
        // Set safe defaults on error
        setUnreadCount(0);
      }
    };

    if (user) {
      fetchUnreadCount();
      
      // Poll for updates every 5 seconds (reduced from 30)
      const interval = setInterval(fetchUnreadCount, 5000);
      
      // Also check when user returns to tab
      const handleFocus = () => {
        fetchUnreadCount();
      };
      
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          fetchUnreadCount();
        }
      });
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [user, refreshKey, previousUnreadCount, unreadCount]);

  const mainNavItems = [
    {
      name: "Marketplace",
      path: "/marketplace",
      icon: <Briefcase className="h-5 w-5" />,
    },
    { name: "Events", path: "/events", icon: <Calendar className="h-5 w-5" /> },
    {
      name: "Community",
      path: "/community",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ];

  const secondaryNavItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <PanelLeft className="h-5 w-5" />,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: <Bell className="h-5 w-5" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: "Saved Items",
      path: "/saved",
      icon: <Bookmark className="h-5 w-5" />,
    },
    {
      name: "Inbox",
      path: "/inbox",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ] as Array<{
    name: string;
    path: string;
    icon: React.ReactNode;
    badge?: number;
  }>;

  const utilityNavItems = [
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const appearanceItems = [
    {
      name: "Theme",
      action: toggleDarkMode,
      icon: isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />,
      description: isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode",
    },
  ];

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-emerald-100 dark:border-dark-buttonBg bg-gradient-to-br from-white via-emerald-50 to-teal-50 dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] shadow-lg transition-transform duration-300 lg:translate-x-0 lg:flex",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:flex"
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo section - Enhanced visibility */}
          <div className="flex items-center justify-between h-20 px-6 py-4 border-b border-emerald-100 dark:border-dark-buttonBg bg-white/80 dark:bg-[#232323]/80 backdrop-blur-sm">
            <Link to="/" className="flex items-center">
              <Logo width={140} height={45} className="hover:scale-105 transition-transform duration-300" />
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg bg-emerald-100 dark:bg-dark-buttonBg text-emerald-600 dark:text-dark-text hover:bg-emerald-200 dark:hover:bg-dark-buttonBg/80 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-8">
            {/* Main navigation */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-3">
                Explore
              </h3>
              {mainNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-dark-button dark:to-dark-button text-white shadow-lg shadow-emerald-500/25 dark:shadow-dark-button/25"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-dark-buttonBg/30 hover:text-emerald-600 dark:hover:text-dark-button hover:shadow-md"
                    )}
                  >
                    <span
                      className={cn(
                        "transition-transform duration-200",
                        isActive
                          ? "text-white"
                          : "text-emerald-600 dark:text-dark-button group-hover:scale-110"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Secondary navigation */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-3">
                Personal
              </h3>
              {secondaryNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group relative",
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-dark-button dark:to-dark-button text-white shadow-lg shadow-emerald-500/25 dark:shadow-dark-button/25"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-dark-buttonBg/30 hover:text-emerald-600 dark:hover:text-dark-button hover:shadow-md"
                    )}
                  >
                    <span
                      className={cn(
                        "transition-transform duration-200",
                        isActive
                          ? "text-white"
                          : "text-emerald-600 dark:text-dark-button group-hover:scale-110"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.name}</span>
                    {item.badge && (
                      <Badge
                        className={cn(
                          "ml-auto text-xs px-2 py-1 min-w-[20px] h-5 flex items-center justify-center",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-emerald-500 dark:bg-dark-button text-white"
                        )}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Appearance section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-3">
                Appearance
              </h3>
              {appearanceItems.map((item) => (
                <button
                  key={item.name}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-dark-buttonBg/30 hover:text-emerald-600 dark:hover:text-dark-button hover:shadow-md"
                >
                  <span className="text-emerald-600 dark:text-dark-button group-hover:scale-110 transition-transform duration-200">
                    {item.icon}
                  </span>
                  <div className="text-left">
                    <span className="text-sm block">{item.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.description}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Utility navigation */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-3">
                Account
              </h3>
              {utilityNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-dark-button dark:to-dark-button text-white shadow-lg shadow-emerald-500/25 dark:shadow-dark-button/25"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-dark-buttonBg/30 hover:text-emerald-600 dark:hover:text-dark-button hover:shadow-md"
                    )}
                  >
                    <span
                      className={cn(
                        "transition-transform duration-200",
                        isActive
                          ? "text-white"
                          : "text-emerald-600 dark:text-dark-button group-hover:scale-110"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Profile card at the bottom - Removed theme toggle */}
          <div className="flex flex-col gap-4 mt-auto p-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/60 dark:bg-dark-buttonBg/20 border border-emerald-100 dark:border-dark-buttonBg backdrop-blur-sm">
              <Avatar
                src={user?.picture}
                alt={user?.name || "User"}
                className="w-12 h-12 border-2 border-emerald-200 dark:border-dark-button shadow-md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate">
                  {user?.name || "Guest User"}
                </p>
                <Link
                  to="/profile"
                  className="text-xs text-emerald-600 dark:text-dark-button hover:text-emerald-700 dark:hover:text-dark-button/80 font-medium transition-colors"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
