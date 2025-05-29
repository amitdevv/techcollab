import React, { createContext, useContext, useState, useCallback } from 'react';

interface NotificationContextType {
  triggerRefresh: () => void;
  refreshKey: number;
}

const NotificationContext = createContext<NotificationContextType>({
  triggerRefresh: () => {},
  refreshKey: 0,
});

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <NotificationContext.Provider value={{ triggerRefresh, refreshKey }}>
      {children}
    </NotificationContext.Provider>
  );
}; 