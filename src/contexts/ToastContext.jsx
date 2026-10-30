import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from '../components/common/ToastNotification/ToastNotification';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration: 4000,
      autoClose: true,
      ...options
    };

    setToasts(current => [...current, toast]);

    // Auto-remove if autoClose is enabled
    if (toast.autoClose && toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, [removeToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => 
    addToast(message, 'success', options), [addToast]);
  
  const showError = useCallback((message, options = {}) => 
    addToast(message, 'error', { duration: 6000, ...options }), [addToast]);
  
  const showWarning = useCallback((message, options = {}) => 
    addToast(message, 'warning', { duration: 5000, ...options }), [addToast]);
  
  const showInfo = useCallback((message, options = {}) => 
    addToast(message, 'info', options), [addToast]);

  const contextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
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
    </ToastContext.Provider>
  );
};