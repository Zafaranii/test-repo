import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  message = '', 
  inline = false,
  overlay = false,
  className = ''
}) => {
  const sizeClass = `spinner-${size}`;
  const colorClass = `spinner-${color}`;
  const containerClass = inline ? 'loading-spinner-inline' : overlay ? 'loading-spinner-overlay' : 'loading-spinner-container';

  return (
    <div className={`${containerClass} ${className} ${overlay ? 'overlay-active' : ''}`}>
      <div className={`loading-spinner ${sizeClass} ${colorClass}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;