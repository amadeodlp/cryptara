import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { removeNotification } from '@/redux/slices/notificationSlice';
import Toast from './Toast';
import './styles.css';

const ToastContainer: React.FC = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.notification.notifications);

  const handleClose = (id: string) => {
    dispatch(removeNotification(id));
  };

  return (
    <div className="toast-container-main">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration || 5000}
          onClose={() => handleClose(notification.id)}
          visible={true}
        />
      ))}
    </div>
  );
};

export default ToastContainer;