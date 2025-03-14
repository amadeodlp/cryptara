import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import NotificationItem from './NotificationItem';
import './styles.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionLink?: string;
}

const NotificationCenter: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Fetch notifications on authentication change or when unread count updates
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);
  
  // Simulate fetching notifications from API
  const fetchNotifications = async () => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      // Mock notification data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Transaction Successful',
          message: 'Your transfer of 0.5 ETH has been completed successfully.',
          createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
          isRead: false
        },
        {
          id: '2',
          title: 'New Staking Reward',
          message: 'You received 25 FIN tokens as staking rewards.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          isRead: false
        },
        {
          id: '3',
          title: 'Price Alert',
          message: 'Bitcoin (BTC) is up 5% in the last 24 hours.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
          isRead: true
        },
        {
          id: '4',
          title: 'Security Update',
          message: 'We\'ve enhanced our security measures to better protect your assets.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          isRead: true,
          actionLink: '/security'
        },
        {
          id: '5',
          title: 'Welcome to Finance Simplified',
          message: 'Thank you for joining! Start exploring our platform to manage your digital assets.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          isRead: true
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(notification => !notification.isRead).length);
      setIsLoading(false);
    }, 800);
  };
  
  const toggleNotificationCenter = () => {
    setIsOpen(!isOpen);
  };
  
  const handleMarkAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // In a real implementation, you would call an API to mark the notification as read
    console.log(`Marking notification ${id} as read`);
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ 
        ...notification, 
        isRead: true 
      }))
    );
    
    setUnreadCount(0);
    
    // In a real implementation, you would call an API to mark all notifications as read
    console.log('Marking all notifications as read');
  };
  
  const handleDeleteNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
    
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // In a real implementation, you would call an API to delete the notification
    console.log(`Deleting notification ${id}`);
  };
  
  const formatNotificationTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <div className="notification-center">
      <button 
        className="notification-icon-button" 
        onClick={toggleNotificationCenter}
        aria-label="Notifications"
      >
        <div className="notification-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
          </svg>
          {unreadCount > 0 && (
            <div className="notification-badge">{unreadCount}</div>
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="notification-dropdown glass-card">
          <div className="notification-header">
            <h3 className="notification-title">Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="mark-all-read"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {isLoading ? (
              <div className="notification-loading">
                <div className="loading-spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  formattedTime={formatNotificationTime(notification.createdAt)}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  onDelete={() => handleDeleteNotification(notification.id)}
                />
              ))
            ) : (
              <div className="no-notifications">
                <div className="empty-icon">🔔</div>
                <p>No notifications yet</p>
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="notification-footer">
              <a href="#" className="view-all-link">View all notifications</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;