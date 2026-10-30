import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { usePropertyManagement } from '../../../hooks/usePropertyManagement';
import { useToast } from '../../../contexts/ToastContext';
import StudioMiniCard from '../StudioMiniCard';
import './ApartmentCard.css';

const ApartmentCard = ({ 
  apartment, 
  onAddStudio
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteRentApartment } = usePropertyManagement();
  const { showSuccess, showError } = useToast();

  // Some views pass `facilities` (array); others pass `amenities` holding the API's comma-separated string.
  const facilities = apartment.facilities?.length
    ? apartment.facilities
    : (apartment.amenities || []).join(',').split(',').map((f) => f.trim()).filter(Boolean);
  const availableStudios = apartment.studios ? apartment.studios.filter(studio => studio.isAvailable).length : 0;
  const occupiedStudios = apartment.studios ? apartment.studios.length - availableStudios : 0;

  const handleDeleteApartment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDeleting(true);
    try {

      const result = await deleteRentApartment(apartment.id);
      
      if (result.success) {
        showSuccess('Rental apartment deleted successfully!');
        
        // Auto-refresh page to show updated data
        window.location.reload();
      } else {
        showError('Failed to delete apartment: ' + result.message);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      showError('Error deleting apartment');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleCardClick = () => {
    // Rental apartment cards are now NON-CLICKABLE in admin portals
    // Removed navigation functionality
    return;
  };

  return (
    <div className={`apartment-card ${showDeleteConfirm ? 'delete-mode' : ''}`}>
      {!showDeleteConfirm ? (
        <>
          <div className="apartment-card-header">
            <div 
              className="apartment-image"
              style={{ backgroundImage: `url(${apartment.image || apartment.images?.[0]})` }}
            >
              <div className="apartment-image-overlay">
                <div className="apartment-stats">
                  <span className="stat-badge available">{availableStudios} Available</span>
                  <span className="stat-badge occupied">{occupiedStudios} Occupied</span>
                </div>
              </div>
            </div>
            
            <div className="apartment-info">
              <div className="apartment-header-row">
                <div className="apartment-title-section">
                  <h3 className="apartment-name">{apartment.name}</h3>
                  <p className="apartment-location">{apartment.location}</p>
                </div>
                <button 
                  className="delete-apartment-btn"
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(e); }}
                  title="Delete Apartment"
                  disabled={isDeleting}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              <p className="apartment-description">{apartment.description}</p>
              
              <div className="apartment-facilities">
                {facilities.length > 0 ? (
                  <>
                    {facilities.slice(0, 3).map((facility, index) => (
                      <span key={index} className="facility-tag">{facility}</span>
                    ))}
                    {facilities.length > 3 && (
                      <span className="facility-tag more">+{facilities.length - 3} more</span>
                    )}
                  </>
                ) : (
                  <span className="facility-tag">No facilities listed</span>
                )}
              </div>
            </div>
          </div>

          <div className="apartment-card-actions">
            <button 
              className="expand-btn"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              disabled={isDeleting}
            >
              {isExpanded ? 'Hide Studios' : `View ${apartment.totalStudios || (apartment.studios ? apartment.studios.length : 0)} Studios`}
              <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
            </button>
            
            <button 
              className="add-studio-btn"
              onClick={(e) => { e.stopPropagation(); onAddStudio(apartment.id); }}
              disabled={isDeleting}
            >
              + Add Studio
            </button>
          </div>
        </>
      ) : (
        <div className="delete-confirmation-inline">
          <div className="delete-confirm-header">
            <h4><FontAwesomeIcon icon={faTrash} /> Delete Apartment?</h4>
            <p>Are you sure you want to delete "{apartment.name}"?</p>
          </div>
          
          <div className="warning-box">
            <p className="warning-title">⚠️ This action will permanently delete:</p>
            <ul className="deletion-items">
              <li>• The apartment "{apartment.name}"</li>
              <li>• All {apartment.studios ? apartment.studios.length : 0} studio{apartment.studios && apartment.studios.length !== 1 ? 's' : ''} in this apartment</li>
              <li>• All related data and bookings</li>
            </ul>
            <p className="warning-footer">This will remove the apartment from Admin Portal, Master Admin Portal, and Customer Rental Page.</p>
            <p className="final-warning">⚠️ This action cannot be undone!</p>
          </div>
          
          <div className="delete-actions-inline">
            <button 
              className="cancel-delete-btn"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              className="confirm-delete-btn-inline"
              onClick={handleDeleteApartment}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Everything'}
            </button>
          </div>
        </div>
      )}

      {!showDeleteConfirm && (
        <div className={`studios-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {isExpanded && apartment.studios && (
            <>
              <div className="studios-grid">
                {apartment.studios.map(studio => (
                  <StudioMiniCard
                    key={studio.id}
                    studio={studio}
                    apartmentId={apartment.id}
                  />
                ))}
              </div>
              
              {apartment.studios.length === 0 && (
                <div className="no-studios">
                  <p>No studios in this apartment yet</p>
                  <button 
                    className="add-first-studio-btn"
                    onClick={() => onAddStudio(apartment.id)}
                  >
                    Add First Studio
                  </button>
                </div>
              )}
            </>
          )}
          
          {isExpanded && !apartment.studios && (
            <div className="no-studios">
              <p>No studios in this apartment yet</p>
              <button 
                className="add-first-studio-btn"
                onClick={() => onAddStudio(apartment.id)}
              >
                Add First Studio
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApartmentCard;