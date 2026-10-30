import React, { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faShower, faRuler, faMapMarkerAlt, faCamera } from '@fortawesome/free-solid-svg-icons';
import './StudioCard.css';

const StudioCard = ({ studio }) => {
  const handleCardClick = useCallback((e) => {

    // Stop any event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    const path = `/studio/${studio.id}?source=customer-studios`;

    // Force immediate navigation with window.location.assign (most reliable)
    window.location.assign(path);
  }, [studio.id]);

  const handleImageError = (e) => {
    // Prevent infinite loop by removing the error handler after first failure
    e.target.onerror = null;
    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="%23718096"%3ENo Image Available%3C/text%3E%3C/svg%3E';
  };

  // Validate image URL - if it's a blob URL, use placeholder instead
  const getImageSrc = () => {
    const imgSrc = studio.images[0];
    if (!imgSrc || imgSrc.startsWith('blob:')) {
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="%23718096"%3ENo Image Available%3C/text%3E%3C/svg%3E';
    }
    return imgSrc;
  };

  return (
    <div 
      className="studio-card" 
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="studio-card__image">
        <img 
          src={getImageSrc()} 
          alt={studio.title} 
          onError={handleImageError}
        />
        <div className="studio-card__image-count">
          <FontAwesomeIcon icon={faCamera} /> See {studio.images.length} photos
        </div>
      </div>
      
      <div className="studio-card__content">
        <div className="studio-card__price">{studio.price}</div>
        <h3 className="studio-card__title">{studio.title}</h3>
        
        <div className="studio-card__details">
          <span className="detail-item"><FontAwesomeIcon icon={faBed} /> {studio.bedrooms}</span>
          <span className="detail-item"><FontAwesomeIcon icon={faShower} /> {studio.bathrooms}</span>
          <span className="detail-item"><FontAwesomeIcon icon={faRuler} /> {studio.area}</span>
        </div>
        
        <div className="studio-card__location">
          <FontAwesomeIcon icon={faMapMarkerAlt} /> {studio.location}
        </div>
        
        <div className="studio-card__posted">
          {studio.postedDate}
        </div>
      </div>
    </div>
  );
};

export default StudioCard;