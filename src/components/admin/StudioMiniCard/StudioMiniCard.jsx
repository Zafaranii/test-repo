import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import { usePropertyManagement } from '../../../hooks/usePropertyManagement';
import { useToast } from '../../../contexts/ToastContext';
import './StudioMiniCard.css';

const StudioMiniCard = ({ 
  studio, 
  apartmentId
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { updateStudio, deleteStudio } = usePropertyManagement();
  const { showSuccess, showError } = useToast();

  const handleDelete = async () => {

    const result = await deleteStudio(studio.id);

    if (result && result.success) {
      showSuccess('Studio deleted successfully!');
      
      // Auto-refresh page to show updated data
      window.location.reload();
    } else {
      const errorMsg = result?.message || result?.error || 'Unknown error occurred';
      showError(`Failed to delete studio: ${errorMsg}`);
    }
    setShowDeleteConfirm(false);
  };

  const toggleAvailability = () => {
    const updatedStudio = {
      ...studio,
      isAvailable: !studio.isAvailable
    };
    updateStudio(apartmentId, updatedStudio);
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleToggleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleAvailability();
  };

  const handleCloseDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleCardClick = () => {
    // Determine navigation source based on current route
    let navigationSource = 'customer-studios'; // default
    
    if (location.pathname.includes('/admin/dashboard')) {
      navigationSource = 'admin-dashboard';
    } else if (location.pathname.includes('/master-admin/dashboard')) {
      navigationSource = 'master-admin-dashboard';
    }
    
    // Navigate with source parameter in URL
    navigate(`/studio/${studio.id}?source=${navigationSource}`);
  };

  return (
    <div className={`studio-mini-card ${!studio.isAvailable ? 'occupied' : ''}`}>
      <div className="studio-mini-header" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        <div 
          className="studio-mini-image"
          style={{ backgroundImage: `url(${studio.images[0]})` }}
        >
          <div className="studio-status-badge">
            <span className={`status-indicator ${studio.isAvailable ? 'available' : 'occupied'}`}>
              {studio.isAvailable ? 'Available' : 'Occupied'}
            </span>
          </div>
        </div>
      </div>

      <div className="studio-mini-content" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        <h4 className="studio-mini-title">{studio.title}</h4>
        <div className="studio-mini-details">
          <span className="studio-unit">{studio.unitNumber}</span>
          <span className="studio-floor">{studio.floor}</span>
          <span className="studio-area">{studio.area}</span>
        </div>
        <div className="studio-price">{studio.price}</div>
      </div>

      <div className="studio-mini-actions">
        <button 
          className={`action-btn toggle-btn ${studio.isAvailable ? 'make-occupied' : 'make-available'}`}
          onClick={handleToggleClick}
          title={studio.isAvailable ? 'Mark as Occupied' : 'Mark as Available'}
        >
          <FontAwesomeIcon icon={studio.isAvailable ? faLockOpen : faLock} />
        </button>
        
        <button 
          className="action-btn delete-btn"
          onClick={handleDeleteClick}
          title="Delete Studio"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={handleCloseDelete}>
          <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Delete Studio?</h4>
            <p>Are you sure you want to delete "{studio.title}"?</p>
            <div className="delete-confirm-actions">
              <button 
                className="confirm-cancel-btn"
                onClick={handleCloseDelete}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioMiniCard;