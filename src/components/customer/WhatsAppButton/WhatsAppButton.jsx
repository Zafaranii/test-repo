import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import './WhatsAppButton.css';

const WhatsAppButton = ({ 
  phoneNumber, 
  message = "Hello, I'm interested in this property",
  label = null,
  contactType = null // 'customer' or 'agency'
}) => {
  const handleWhatsAppClick = () => {
    // Clean phone number - remove all non-numeric characters
    const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');

    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="whatsapp-button-container">
      {label && <div className="whatsapp-label">{label}</div>}
      <button 
        className={`whatsapp-button ${contactType ? `whatsapp-${contactType}` : ''}`}
        onClick={handleWhatsAppClick}
        type="button"
        title={`Contact via WhatsApp: ${phoneNumber}`}
      >
        <span className="whatsapp-icon"><FontAwesomeIcon icon={faWhatsapp} /></span>
        <span className="whatsapp-text">
          {contactType === 'customer' ? 'Contact Customer' : 'WhatsApp'}
        </span>
      </button>
    </div>
  );
};

export default WhatsAppButton;