// Browser notification utilities
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }
  return null;
};

export const showGigInterestNotification = (senderName: string, gigTitle: string) => {
  return showBrowserNotification(
    '🎉 New Interest in Your Gig!',
    {
      body: `${senderName} is interested in "${gigTitle}". Check your notifications to connect!`,
      tag: 'gig-interest',
      requireInteraction: true,
    }
  );
}; 