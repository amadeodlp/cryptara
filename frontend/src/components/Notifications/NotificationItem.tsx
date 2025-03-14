import React from 'react';
import './styles.css';

interface NotificationProps {
  notification: {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    actionLink?: string;
  };
  formattedTime: string;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

const NotificationItem: React.FC<NotificationProps> = ({ 
  notification, 
  formattedTime, 
  onMarkAsRead, 
  onDelete 
}) => {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead();
    }
    
    // If there's an action link, navigate to it
    if (notification.actionLink) {
      window.location.href = notification.actionLink;
    }
  };
  
  return (
    <div 
      className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
      onClick={handleClick}
    >
      <div className="notification-content">
        <div className="notification-header">
          <h4 className="notification-item-title">{notification.title}</h4>
          <div className="notification-time">{formattedTime}</div>
        </div>
        <p className="notification-message">{notification.message}</p>
      </div>
      
      <div className="notification-actions">
        {!notification.isRead && (
          <button 
            className="mark-read-button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead();
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z" fill="currentColor"/>
            </svg>
          </button>
        )}
        <button 
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;