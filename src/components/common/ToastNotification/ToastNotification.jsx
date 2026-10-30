import React, { useState, useEffect, useCallback } from 'react';
import './ToastNotification.css';

const ToastNotification = ({ message, type = 'info', duration = 4000, onClose, autoClose = true }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Match CSS animation duration
  }, [onClose]);

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, autoClose, handleClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{message}</span>
        <button 
          className="toast-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Hook for managing multiple toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      ...options
    };

    setToasts(current => [...current, toast]);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options) => 
    addToast(message, 'success', options), [addToast]);
  
  const showError = useCallback((message, options) => 
    addToast(message, 'error', options), [addToast]);
  
  const showWarning = useCallback((message, options) => 
    addToast(message, 'warning', options), [addToast]);
  
  const showInfo = useCallback((message, options) => 
    addToast(message, 'info', options), [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// Toast Container Component
export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          autoClose={toast.autoClose}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastNotification;