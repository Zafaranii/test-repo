import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faShower, faRuler, faMapMarkerAlt, faTrash, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { usePropertyManagement } from '../../../hooks/usePropertyManagement';
import { adminApi } from '../../../services/api';
import './SaleApartmentCard.css';

const SaleApartmentCard = ({ 
  apartment, 
  isAdminView = false,
  showCreatedBy = false 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { deleteSaleApartment } = usePropertyManagement();
  const navigate = useNavigate();

  // Check if this apartment was deleted locally
  React.useEffect(() => {
    const deletedApartments = JSON.parse(localStorage.getItem('deletedSaleApartments') || '[]');
    if (deletedApartments.includes(apartment.id)) {
      setIsHidden(true);
    }
  }, [apartment.id]);

  const handleDeleteApartment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    // COMPREHENSIVE PRE-FLIGHT CHECKS
    const authToken = localStorage.getItem('api_access_token');
    
    console.group('🗑️ DELETE SALE APARTMENT - DIAGNOSTIC');





    console.groupEnd();
    
    // Check 1: Authentication
    if (!authToken) {
const errorEl = document.createElement('div');
      errorEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 20px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 600; max-width: 500px;';
      errorEl.innerHTML = `
        <div style="font-size: 18px; margin-bottom: 8px;">❌ Not Logged In</div>
        <div style="font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
          You must be logged in as master admin to delete apartments.
        </div>
        <div style="font-size: 13px; opacity: 0.9;">
          Redirecting to login page in 3 seconds...
        </div>
      `;
      document.body.appendChild(errorEl);
      
      setTimeout(() => {
        errorEl.remove();
        window.location.href = '/master-admin/login';
      }, 3000);
      
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      return;
    }
    
    // Check 2: Backend connectivity test

    try {
      await adminApi.getMe();
    } catch (healthError) {
      if (healthError.status === 401) {
        const expiredEl = document.createElement('div');
        expiredEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 20px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 600; max-width: 500px;';
        expiredEl.textContent = 'Your login session has expired. Please log in again.';
        document.body.appendChild(expiredEl);
        setTimeout(() => {
          expiredEl.remove();
          window.location.href = '/master-admin/login';
        }, 2500);
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }
      const errorEl = document.createElement('div');
      errorEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 20px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 600; max-width: 550px;';
      errorEl.innerHTML = `
        <div style="font-size: 18px; margin-bottom: 8px;">❌ Backend Server Not Running</div>
        <div style="font-size: 14px; line-height: 1.6; margin-bottom: 12px;">
          Cannot connect to the backend server.
        </div>
        <div style="font-size: 13px; opacity: 0.95; line-height: 1.5;">
          <strong>Possible causes:</strong><br/>
          • Backend server is not running<br/>
          • Server is running on different port<br/>
          • Network/firewall blocking connection<br/>
          <br/>
          <strong>Solution:</strong> Start your FastAPI backend server
        </div>
      `;
      document.body.appendChild(errorEl);
      setTimeout(() => errorEl.remove(), 8000);
      
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      return;
    }
    
    // Proceed with actual delete
    try {

      const result = await deleteSaleApartment(apartment.id);

      if (result && result.success) {

        setShowDeleteConfirm(false);
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 600;';
        successMessage.innerHTML = `
          <div style="font-size: 16px; margin-bottom: 4px;">✅ Deleted Successfully!</div>
          <div style="font-size: 13px;">"${apartment.name}" removed from database</div>
        `;
        document.body.appendChild(successMessage);
        
        // Refresh page to update the list
        setTimeout(() => {
          successMessage.remove();
          window.location.reload();
        }, 1500);
      } else {
const errorMsg = result?.message || result?.error || 'Delete operation failed';
        
        // Show error in UI
        const errorEl = document.createElement('div');
        errorEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 600; max-width: 400px;';
        errorEl.innerHTML = `
          <div style="font-size: 16px; margin-bottom: 4px;">❌ Delete Failed</div>
          <div style="font-size: 13px;">${errorMsg}</div>
        `;
        document.body.appendChild(errorEl);
        setTimeout(() => errorEl.remove(), 5000);
        
        setShowDeleteConfirm(false);
      }
    } catch (error) {
// Handle specific error types with appropriate user messages
      if (error?.status === 401 || error?.message?.includes('Authentication failed')) {
const authErrorEl = document.createElement('div');
        authErrorEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 600; max-width: 450px;';
        authErrorEl.innerHTML = `
          <div style="font-size: 16px; margin-bottom: 8px;">🔒 Session Expired</div>
          <div style="font-size: 13px; line-height: 1.5;">Your login session has expired. Please log in again. Redirecting...</div>
        `;
        document.body.appendChild(authErrorEl);
        
        // Clear expired token
        localStorage.removeItem('api_access_token');
        
        setTimeout(() => {
          authErrorEl.remove();
          window.location.href = '/master-admin/login';
        }, 2500);
        
      } else if (error?.status === 403) {
const permErrorEl = document.createElement('div');
        permErrorEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 600; max-width: 450px;';
        permErrorEl.innerHTML = `
          <div style="font-size: 16px; margin-bottom: 8px;">❌ Access Denied</div>
          <div style="font-size: 13px; line-height: 1.5;">You don't have permission to delete this apartment. Only the creator or master admin can delete.</div>
        `;
        document.body.appendChild(permErrorEl);
        setTimeout(() => permErrorEl.remove(), 5000);
        
      } else if (error?.status === 404) {
// Hide card since it doesn't exist
        setIsHidden(true);
        
        const notFoundEl = document.createElement('div');
        notFoundEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #f59e0b; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 600;';
        notFoundEl.innerHTML = `
          <div style="font-size: 16px; margin-bottom: 4px;">⚠️ Already Deleted</div>
          <div style="font-size: 13px;">This apartment no longer exists.</div>
        `;
        document.body.appendChild(notFoundEl);
        setTimeout(() => {
          notFoundEl.remove();
          window.location.reload();
        }, 2000);
        
      } else {
        // Generic error
const genericErrorEl = document.createElement('div');
        genericErrorEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 600; max-width: 450px;';
        genericErrorEl.innerHTML = `
          <div style="font-size: 16px; margin-bottom: 8px;">❌ Delete Failed</div>
          <div style="font-size: 13px; line-height: 1.5;">${error?.message || 'Unable to delete apartment. Please try again.'}</div>
        `;
        document.body.appendChild(genericErrorEl);
        setTimeout(() => genericErrorEl.remove(), 5000);
      }
      
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
    // Determine navigation source based on current route
    const currentPath = window.location.pathname;
    let navigationSource = 'admin-dashboard';
    
    if (currentPath.includes('/master-admin/dashboard')) {
      navigationSource = 'master-admin-dashboard';
    }
    
    // Navigate to apartment sale details page with source parameter
    navigate(`/admin/apartment-sale/${apartment.id}?source=${navigationSource}`);
  };

  const formatPrice = (price) => {
    if (!price) return 'Contact for price';
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M EGP`;
    }
    return price.toLocaleString('en-EG') + ' EGP';
  };

  // Get availability status
  const getAvailabilityStatus = () => {
    if (apartment.isAvailable === false) return 'Sold';
    return 'Available';
  };

  // Don't render if apartment is hidden
  if (isHidden) {
    return null;
  }

  return (
    <div className={`sale-apartment-card ${showDeleteConfirm ? 'delete-mode' : ''}`} onClick={!showDeleteConfirm ? handleCardClick : undefined}>
      {!showDeleteConfirm ? (
        <>
          <div className="sale-apartment-card__image-container">
            <img 
              src={apartment.images && apartment.images.length > 0 ? apartment.images[0] : apartment.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E'} 
              alt={apartment.name}
              className="sale-apartment-card__image"
              onError={(e) => {
                // Use inline SVG as fallback to prevent 404 loop
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
            
            {/* Availability Badge */}
            <div className="sale-apartment-card__availability">
              {getAvailabilityStatus()}
            </div>
            
            {/* Sale Badge */}
            <div className="sale-apartment-card__sale-badge">
              FOR SALE
            </div>
            
            {/* Delete button for admin view */}
            <button 
              className="sale-apartment-card__delete-btn"
              onClick={handleDeleteClick}
              title="Delete Apartment"
              disabled={isDeleting}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
          
          <div className="sale-apartment-card__content">
            <h3 className="sale-apartment-card__title">{apartment.name}</h3>
            
            <div className="apartment-sale-card__location">
              <span className="location-icon"><FontAwesomeIcon icon={faMapMarkerAlt} /></span>
              <span>{apartment.location}</span>
            </div>
            
            <div className="apartment-sale-card__details">
              <span className="detail-item"><FontAwesomeIcon icon={faBed} /> {apartment.bedrooms || 'N/A'}</span>
              <span className="detail-item"><FontAwesomeIcon icon={faShower} /> {apartment.bathrooms || 'N/A'}</span>
              <span className="detail-item"><FontAwesomeIcon icon={faRuler} /> {apartment.area ? `${apartment.area} sq ft` : 'N/A'}</span>
            </div>
            
            <div className="sale-apartment-card__price">
              {formatPrice(apartment.price)}
            </div>

            {showCreatedBy && (
              <div className="sale-apartment-card__created-by">
                <span>Created by: {apartment.createdBy}</span>
              </div>
            )}
            
            <div className="sale-apartment-card__listed">
              Listed: {new Date(apartment.listedAt || apartment.createdAt).toLocaleDateString()}
            </div>
          </div>
        </>
      ) : (
        <div className="delete-confirmation-inline-sale">
          <div className="delete-confirm-header">
            <h4><FontAwesomeIcon icon={faTrash} /> Delete Sale Apartment?</h4>
            <p>Are you sure you want to delete "{apartment.name}"?</p>
          </div>
          
          <div className="warning-box">
            <p className="warning-title">⚠️ This action will permanently delete:</p>
            <ul className="deletion-items">
              <li>• The apartment "{apartment.name}"</li>
              <li>• All listing information and details</li>
              <li>• All related data and inquiries</li>
            </ul>
            <p className="warning-footer">This will remove the apartment from Admin Portal, Master Admin Portal, and Customer Sales Page.</p>
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
              {isDeleting ? 'Deleting...' : 'Delete Apartment'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SaleApartmentCard;
