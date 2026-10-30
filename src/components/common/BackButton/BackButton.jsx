import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './BackButton.css';

const BackButton = ({ 
  text = "← Back", 
  to, 
  onClick, 
  variant = "default", 
  className = "",
  disabled = false,
  asLink = false 
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (disabled) return;
    
    if (onClick) {
      onClick(e);
    } else if (to) {
      e.preventDefault(); // Prevent default if we're handling navigation
      navigate(to);
    } else {
      navigate(-1); // Go back in history
    }
  };

  const buttonClasses = `back-button back-button--${variant} ${className} ${disabled ? 'back-button--disabled' : ''}`;

  // Render as Link if asLink is true and to prop is provided
  if (asLink && to && !disabled) {
    return (
      <Link 
        to={to}
        className={buttonClasses}
        onClick={onClick}
      >
        {text}
      </Link>
    );
  }

  // Render as button
  return (
    <button 
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default BackButton;