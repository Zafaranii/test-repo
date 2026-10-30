import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faShower, faRuler, faMapMarkerAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import './ApartmentSaleCard.css';

const ApartmentSaleCard = ({ apartment }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/apartment-sale/${apartment.id}`);
  };

  const formatPrice = (price) => {
    if (!price) return 'Contact for price';
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M EGP`;
    }
    return price.toLocaleString('en-EG') + ' EGP';
  };

  // Get availability status - for sale apartments we'll show if it's available
  const getAvailabilityStatus = () => {
    if (apartment.isAvailable === false) return 'Sold';
    return 'Available';
  };

  const getAvailabilityCount = () => {
    // For apartments, we can show how many units are available
    if (apartment.availableUnits && apartment.totalUnits) {
      return `${apartment.availableUnits} Available`;
    }
    return getAvailabilityStatus();
  };

  return (
    <div className="apartment-sale-card" onClick={handleCardClick}>
      <div className="apartment-sale-card__image-container">
        <img 
          src={apartment.images && apartment.images.length > 0 ? apartment.images[0] : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E'} 
          alt={apartment.name}
          className="apartment-sale-card__image"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />
        
        {/* Availability Badge */}
        <div className="apartment-sale-card__availability">
          {getAvailabilityCount()}
        </div>
        
        {/* Sale Badge */}
        <div className="apartment-sale-card__sale-badge">
          For Sale
        </div>
        
        {/* Delete button for admin view - only show if this is admin context */}
        {apartment.showDelete && (
          <button 
            className="apartment-sale-card__delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              apartment.onDelete && apartment.onDelete(apartment.id);
            }}
            title="Remove listing"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )}
      </div>
      
      <div className="apartment-sale-card__content">
        <h3 className="apartment-sale-card__title">{apartment.name}</h3>
        
        <div className="apartment-sale-card__location">
          <span className="location-icon"><FontAwesomeIcon icon={faMapMarkerAlt} /></span>
          <span>{apartment.location}</span>
        </div>
        
        <div className="apartment-sale-card__details">
          <span className="detail-item"><FontAwesomeIcon icon={faBed} /> {apartment.bedrooms || 'N/A'}</span>
          <span className="detail-item"><FontAwesomeIcon icon={faShower} /> {apartment.bathrooms || 'N/A'}</span>
          <span className="detail-item"><FontAwesomeIcon icon={faRuler} /> {apartment.area ? `${apartment.area} sq ft` : 'N/A'}</span>
        </div>
        
        <div className="apartment-sale-card__price">
          {formatPrice(apartment.price)}
        </div>
      </div>
    </div>
  );
};

export default ApartmentSaleCard;