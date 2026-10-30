import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faBed, 
  faShower, 
  faRuler, 
  faMapMarkerAlt, 
  faKey, 
  faMap, 
  faCheck,
  faCouch,
  faClipboardList,
  faTrash,
  faUser,
  faCalendarAlt,
  faDollarSign
} from '@fortawesome/free-solid-svg-icons';
import BackButton from '../../../components/common/BackButton';
import ImageGallery from '../../../components/customer/ImageGallery/ImageGallery';
import WhatsAppButton from '../../../components/customer/WhatsAppButton/WhatsAppButton';
import BookingModal from '../../../components/admin/BookingModal';
import EditStudioModal from '../../../components/admin/EditStudioModal';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import Footer from '../../../components/common/Footer';
import { apartmentPartsApi, rentApartmentsApi, rentalContractsApi } from '../../../services/api';
import { uploadStudioPhotos } from '../../../services/uploadService';
import { useToast } from '../../../contexts/ToastContext';
import './StudioDetailsPage.css';
import AYGLogo from '../../../assets/images/logo/AYG.png';
import { SITE_CONTACT } from '../../../config/siteConfig';

const StudioDetailsPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [navigationSource, setNavigationSource] = useState('customer-studios');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studioBooking, setStudioBooking] = useState(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studio, setStudio] = useState(null);
  const [parentApartment, setParentApartment] = useState(null);
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const isRenderableImageUrl = (url) => {
    if (typeof url !== 'string' || !url.trim()) return false;
    if (url.startsWith('blob:')) return false;
    if (url.includes('example.com')) return false;
    return true;
  };

  // Fetch studio details from API
  useEffect(() => {
    const fetchStudioDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get studio part details
        const studioResponse = await apartmentPartsApi.getById(id);
        
        if (studioResponse) {
          const studioData = { ...studioResponse };
          const rawImages = studioData.images || studioData.photos_url || [];
          const safeImages = Array.isArray(rawImages)
            ? rawImages.filter(isRenderableImageUrl)
            : [];
          studioData.images = safeImages;
          
          // Also try to get parent apartment info if apartmentId exists
          if (studioData.apartment_id) {
            try {
              const apartmentResponse = await rentApartmentsApi.getById(studioData.apartment_id);
              if (apartmentResponse) {
                setParentApartment(apartmentResponse);
                // Set admin phone from parent apartment's contact_number
                // Check if created by master admin (typically ID 1) and use special number
                const isMasterAdmin = apartmentResponse.listed_by_admin_id === 1;
                const masterAdminPhone = SITE_CONTACT.masterAdminPhone;
                studioData.adminPhone = isMasterAdmin ? masterAdminPhone : (apartmentResponse.contact_number || '+201000000000');
                studioData.contact_number = isMasterAdmin ? masterAdminPhone : (apartmentResponse.contact_number || '+201000000000');
              }
            } catch (apartmentError) {
              // Parent apartment fetch failed - use fallback
              studioData.adminPhone = '+201000000000';
              studioData.contact_number = '+201000000000';
            }
          } else {
            // No apartment_id, use fallback
            studioData.adminPhone = '+201000000000';
            studioData.contact_number = '+201000000000';
          }
          
          setStudio(studioData);
        } else {
          setError('Studio not found');
        }
      } catch (err) {
setError('Failed to load studio details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchStudioDetails();
    }
  }, [id]);

  useEffect(() => {
    // Get the navigation source from URL parameters
    const source = searchParams.get('source');
    
    if (['master-admin-dashboard', 'customer-studios', 'admin-dashboard', 'admin-tracking', 'admin-rental-alerts', 'master-admin-rental-alerts'].includes(source)) {
      setNavigationSource(source);
    } else {
      // Default to customer studios if no valid source in URL
      setNavigationSource('customer-studios');
    }

    // Check for existing booking for this studio using rental contracts API
    // ONLY fetch if user is admin or master admin (not customer)
    const fetchExistingBooking = async () => {
      // Only fetch rental contracts for admin/master admin views
      const isAdminView = source === 'admin-dashboard' || 
                          source === 'master-admin-dashboard' || 
                          source === 'admin-tracking' || 
                          source === 'admin-rental-alerts' || 
                          source === 'master-admin-rental-alerts';
      
      if (!isAdminView) {
        // Customer view - don't fetch rental contracts (requires auth)
        return;
      }
      
      try {
        if (id) {

          const contractsResponse = await rentalContractsApi.getAll();

          if (contractsResponse && Array.isArray(contractsResponse)) {
            const existingContract = contractsResponse.find(contract => {
              const matches = (contract.apartment_part_id === parseInt(id) || contract.studioId === parseInt(id));
              const isActive = contract.is_active === true || contract.isActive === true;

              return matches && isActive;
            });
            
            if (existingContract) {

              setStudioBooking(existingContract);
            } else {

              setStudioBooking(null);
            }
          }
        }
      } catch (error) {
        // Not critical - just log the error
}
    };
    
    fetchExistingBooking();
  }, [id, searchParams]);

  // Remove the sync effect as we're now managing data through API
  const handleBookingSubmit = async (bookingData) => {
    setIsBookingLoading(true);
    try {

      // PRE-FLIGHT CHECK 1: Check if studio already has a booking in state
      if (studioBooking) {
        showWarning('This studio already has an active booking. Delete it before creating a new one.');
        setIsBookingLoading(false);
        setIsBookingModalOpen(false);
        return;
      }
      
      // PRE-FLIGHT CHECK 2: Fetch latest booking status from API

      try {
        const allContracts = await rentalContractsApi.getAll();
        const existingContract = allContracts?.find(contract => 
          contract.apartment_part_id === parseInt(id) || 
          contract.studioId === parseInt(id)
        );
        
        if (existingContract) {
          showWarning(
            `Booking already exists for ${existingContract.customer_name || existingContract.customerName} (Contract #${existingContract.id}).`
          );
          setStudioBooking(existingContract);
          setIsBookingLoading(false);
          setIsBookingModalOpen(false);
          return;
        }

      } catch (checkError) {
// Continue anyway - the backend will catch duplicates
      }
      
      // PRE-FLIGHT CHECK 3: Verify studio is available
      if (studio.status !== 'available' && studio.statusEnum !== 'available') {
        showWarning('This studio is not available for booking. Status: ' + (studio.status || studio.statusEnum || 'Unknown'));
        setIsBookingLoading(false);
        setIsBookingModalOpen(false);
        return;
      }
      
      // Extract numeric value from rentPeriod string (e.g., "12 months" -> 12)
      const rentPeriodValue = typeof bookingData.rentPeriod === 'string' 
        ? parseInt(bookingData.rentPeriod.match(/\d+/)?.[0] || '12')
        : parseInt(bookingData.rentPeriod) || 12;
      
      // Prepare data in format that transformer expects
      const contractData = {
        apartment_part_id: parseInt(id),
        customer_name: bookingData.customerName.trim(),
        customer_phone: bookingData.customerPhone, // Already formatted by BookingModal
        customer_id_number: bookingData.customerId.trim(),
        how_did_customer_find_us: bookingData.how_did_customer_find_us || 'other',
        paid_deposit: parseFloat(bookingData.paidDeposit) || 0,
        warrant_amount: parseFloat(bookingData.warranty) || 0,
        rent_start_date: bookingData.startDate,
        rent_end_date: bookingData.endDate,
        rent_period: rentPeriodValue, // Must be integer
        contract_url: (typeof bookingData.contract === 'string' ? bookingData.contract : '') || '',
        customer_id_url: '',
        commission: parseFloat(bookingData.commission) || 0,
        rent_price: parseFloat(studio.monthly_price) || parseFloat(studio.price) || 0
      };


      const response = await rentalContractsApi.create(contractData);

      if (response) {
        showSuccess('Booking created successfully!');
        setStudioBooking(response);
        setIsBookingModalOpen(false);
        
        // Refresh studio data to reflect booking status
        const updatedStudioResponse = await apartmentPartsApi.getById(id);
        if (updatedStudioResponse) {
          setStudio(updatedStudioResponse);
        }
        
        // Auto-refresh page to show updated data
        window.location.reload();
      } else {
        showError('Failed to create booking. Please try again.');
      }
    } catch (error) {
// Show user-friendly error messages
      if (error.message?.includes('unique constraint') || error.message?.includes('UNIQUE constraint failed') || error.message?.includes('duplicate key')) {
        showWarning('Booking already exists. Delete the existing booking first.');
      } else if (error.message?.includes('422') || error.message?.includes('Validation')) {
        showError('Validation error. Check phone format, numeric amounts, valid dates, platform source, and rent period.');
      } else if (error.message?.includes('401')) {
        showError('Session expired. Please log in again.');
        localStorage.removeItem('api_access_token');
        navigate('/admin/login');
      } else if (error.message?.includes('403')) {
        showError('Permission denied. Only the admin who created this apartment can create bookings for it.');
      } else if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
        showError('Server error. Refresh the page and try again. Contact admin if the issue persists.');
      } else if (error.message?.includes('Network error') || error.message?.includes('ERR_FAILED')) {
        showError('Cannot connect to backend. Ensure the server is running and accessible.');
      } else {
        showError(`Failed to create booking: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleStudioUpdate = async (updatedStudioData, newPhotoFiles = []) => {
    setIsEditLoading(true);
    try {
      let response = await apartmentPartsApi.update(id, updatedStudioData);

      if (response && newPhotoFiles.length > 0) {
        try {
          await uploadStudioPhotos(id, newPhotoFiles);
          response = await apartmentPartsApi.getById(id);
        } catch (uploadError) {
          showError(`Studio saved, but photo upload failed: ${uploadError.message}`);
        }
      }

      if (response) {
        // keep derived fields (adminPhone, ...) and refresh the gallery from the stored photo URLs
        setStudio(prev => ({ ...prev, ...response, images: response.photos_url || [] }));
        setIsEditModalOpen(false);
      } else {
}
    } catch (error) {
} finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteBooking = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeletingBooking(true);
    try {
        if (studioBooking && studioBooking.id) {

          const response = await rentalContractsApi.delete(studioBooking.id);
          
          if (response !== false) {
            showSuccess('Booking deleted successfully!');
            setStudioBooking(null);
            
            // Refresh studio data to reflect booking status change
            const updatedStudioResponse = await apartmentPartsApi.getById(id);
            if (updatedStudioResponse) {
              setStudio(updatedStudioResponse);
            }
            
            // Auto-refresh page to show updated data
            window.location.reload();
          } else {
            showError('Failed to delete booking. Please try again.');
          }
        }
      } catch (error) {
// Handle specific error types
        if (error.status === 403 || error.message?.includes('403') || error.message?.includes('forbidden') || error.message?.includes('Access forbidden')) {
          // 403 Forbidden - Not a super admin
          showError('Permission denied. Only Master Admins can delete rental bookings.');
        } else if (error.status === 404 || error.message?.includes('404')) {
          showWarning('Booking not found. The page will refresh to show the latest status.');
          window.location.reload();
        } else if (error.status === 401 || error.message?.includes('401')) {
          showError('Session expired. Please log in again.');
          localStorage.removeItem('api_access_token');
          navigate('/admin/login');
        } else {
          showError(`Failed to delete booking: ${error.message || 'Unknown error'}`);
        }
    } finally {
      setIsDeletingBooking(false);
    }
  };

  // Determine the back link based on specific source
  const getBackLink = () => {
    if (navigationSource === 'master-admin-dashboard') {
      return '/master-admin/dashboard';
    } else if (navigationSource === 'admin-dashboard') {
      return '/admin/dashboard';
    } else if (navigationSource === 'admin-tracking') {
      return '/admin/tracking';
    } else if (navigationSource === 'admin-rental-alerts') {
      return '/admin/rental-alerts';
    } else if (navigationSource === 'master-admin-rental-alerts') {
      return '/master-admin/rental-alerts';
    } else if (navigationSource === 'customer-studios') {
      return '/studios';
    }
    return '/studios'; // Default to studios page
  };

  const getBackText = () => {
    if (navigationSource === 'master-admin-dashboard') {
      return '← Back to Master Admin Dashboard';
    } else if (navigationSource === 'admin-dashboard') {
      return '← Back to Admin Dashboard';
    } else if (navigationSource === 'admin-tracking') {
      return '← Back to Admin Tracking';
    } else if (navigationSource === 'admin-rental-alerts') {
      return '← Back to Admin Rental Alerts';
    } else if (navigationSource === 'master-admin-rental-alerts') {
      return '← Back to Master Admin Rental Alerts';
    } else if (navigationSource === 'customer-studios') {
      return '← Back to Studios';
    }
    return '← Back to Studios'; // Default fallback
  };

  const openGoogleMaps = () => {
    if (parentApartment?.location_coordinates && parentApartment.location_coordinates.lat && parentApartment.location_coordinates.lng) {
      const mapsUrl = `https://www.google.com/maps?q=${parentApartment.location_coordinates.lat},${parentApartment.location_coordinates.lng}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else if (studio?.location_coordinates && studio.location_coordinates.lat && studio.location_coordinates.lng) {
      const mapsUrl = `https://www.google.com/maps?q=${studio.location_coordinates.lat},${studio.location_coordinates.lng}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else if (parentApartment?.location || studio?.location) {
      const searchQuery = encodeURIComponent(parentApartment?.location || studio?.location);
      const mapsUrl = `https://www.google.com/maps/search/${searchQuery}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="studio-details-page">
        <div className="container">
          <div className="loading-container">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="studio-details-page">
        <div className="container">
          <div className="error-container">
            <h1>Error Loading Studio</h1>
            <p className="error-message">{error}</p>
            <BackButton onClick={() => navigate(-1)} />
          </div>
        </div>
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="studio-details-page">
        <div className="container">
          <h1>Studio not found</h1>
          <BackButton onClick={() => navigate(-1)} />
        </div>
      </div>
    );
  }

  const studioNumericPrice = Number(
    studio.monthly_price ?? studio.monthly_rent ?? studio.rent_value ?? studio.price ?? 0
  );
  const studioDisplayPrice = studioNumericPrice > 0
    ? `EGP ${studioNumericPrice.toLocaleString()}/month`
    : 'Price on request';

  // If studio is not available, redirect based on source
  if (studio.status !== 'available' && navigationSource === 'customer') {
    return <Navigate to="/studios" replace />;
  }

  return (
    <div className="studio-details-page">
      <nav className="studio-nav">
        <BackButton 
          text={getBackText()} 
          onClick={() => navigate(getBackLink())}
        />
        <Link 
          to={navigationSource === 'master-admin' ? '/master-admin/dashboard' : '/'} 
          className="brand"
        >
          <img src={AYGLogo} alt="AYG logo" className="brand-logo" />
          <span className="brand-text">AYG</span>
        </Link>
      </nav>

      <div className="studio-container">
        <div className="studio-gallery-section">
          <ImageGallery images={studio.images || []} title={studio.title || studio.name} />
        </div>

        <div className="studio-content">
          <div className="studio-main-info">
            <div className="studio-header">
              <h1 className="studio-title">{studio.title || studio.name}</h1>
              <div className="studio-price">{studioDisplayPrice}</div>
            </div>

            <div className="studio-posted">Posted {studio.created_at ? new Date(studio.created_at).toLocaleDateString() : 'Recently'}</div>

            {/* Google Maps Link */}
            {(parentApartment?.location || studio?.location || parentApartment?.location_coordinates || studio?.location_coordinates) && (
              <div className="studio-location-section">
                <h3><FontAwesomeIcon icon={faMapMarkerAlt} /> Location</h3>
                <button 
                  onClick={openGoogleMaps}
                  className="maps-button"
                  type="button"
                >
                  <FontAwesomeIcon icon={faMap} /> View on Google Maps
                </button>
                {parentApartment && (
                  <small className="location-note">
                    Location shared from {parentApartment.name || parentApartment.title}
                  </small>
                )}
              </div>
            )}

            {/* Master Admin - Show Creator Info - ONLY for Master Admin */}
            {navigationSource === 'master-admin-dashboard' && studio.created_by && (
              <div className="creator-info-section">
                <div className="creator-info">
                  <span className="creator-label"><FontAwesomeIcon icon={faUser} /> Created by Admin:</span>
                  <span className="creator-value">{studio.created_by}</span>
                </div>
                <div className="creator-date">
                  <span className="creator-label"><FontAwesomeIcon icon={faCalendarAlt} /> Created on:</span>
                  <span className="creator-value">
                    {studio.created_at ? new Date(studio.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            )}

            {/* Admin and Master Admin booking and edit buttons - HIDDEN for customers */}
            {(navigationSource === 'admin-dashboard' || navigationSource === 'master-admin-dashboard' || navigationSource === 'admin-tracking' || navigationSource === 'admin-rental-alerts' || navigationSource === 'master-admin-rental-alerts') && (
              <div className="admin-booking-section">
                <div className="admin-buttons">
                  {!studioBooking ? (
                    <button 
                      className="book-studio-btn"
                      onClick={() => setIsBookingModalOpen(true)}
                      disabled={isBookingLoading}
                    >
                      {isBookingLoading ? (
                        <>
                          <LoadingSpinner size="small" color="white" inline />
                          Processing...
                        </>
                      ) : (
                        'Book This Studio'
                      )}
                    </button>
                  ) : (
                    <button 
                      className="book-studio-btn booked"
                      disabled
                      style={{ background: '#059669', cursor: 'not-allowed' }}
                    >
                      ✅ Studio Already Booked
                    </button>
                  )}
                  
                  <button 
                    className="edit-studio-btn"
                    onClick={() => setIsEditModalOpen(true)}
                    disabled={isEditLoading}
                  >
                    {isEditLoading ? (
                      <>
                        <LoadingSpinner size="small" color="white" inline />
                      </>
                    ) : (
                      '✏️ Edit Studio'
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="highlights-section">
              <h2>Highlights</h2>
              <div className="highlights-grid">
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faHome} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Type</div>
                    <div className="highlight-value">{studio.type || 'Studio'}</div>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faKey} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Ownership</div>
                    <div className="highlight-value">{studio.ownership_type || 'Rental'}</div>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faRuler} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Area (m²)</div>
                    <div className="highlight-value">{studio.area || 'N/A'}</div>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faBed} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Bedrooms</div>
                    <div className="highlight-value">{studio.bedrooms || studio.number_of_bedrooms || '1'}</div>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faShower} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Bathrooms</div>
                    <div className="highlight-value">{studio.bathrooms || studio.number_of_bathrooms || '1'}</div>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faCouch} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Furnished</div>
                    <div className="highlight-value">{(studio.is_furnished ?? studio.furnished === 'yes') ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h2>Details</h2>
              <div className="details-table">
                <div className="detail-row">
                  <span className="detail-label">Payment Option</span>
                  <span className="detail-value">{studio.payment_options || 'Monthly'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Completion Status</span>
                  <span className="detail-value">{studio.completion_status || 'Ready'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Furnished</span>
                  <span className="detail-value">{(studio.is_furnished ?? studio.furnished === 'yes') ? 'Yes' : 'No'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Parking</span>
                  <span className="detail-value">{studio.parking_available ? 'Available' : 'Not Available'}</span>
                </div>
              </div>
            </div>

            <div className="description-section">
              <h2>Description</h2>
              <p className="description-text">{studio.description || 'No description available'}</p>
            </div>

            {/* Booking Display Section - Only visible if booking exists and from admin or master admin - HIDDEN for customers */}
            {studioBooking && (navigationSource === 'admin-dashboard' || navigationSource === 'master-admin-dashboard' || navigationSource === 'admin-tracking' || navigationSource === 'admin-rental-alerts' || navigationSource === 'master-admin-rental-alerts') && (
              <div className="booking-display-section">
                <h2><FontAwesomeIcon icon={faClipboardList} /> Booking Information</h2>
                <div className="booking-card">
                  <div className="booking-header">
                    <h3>Customer Details</h3>
                    <div className="booking-actions">
                      <div className="booking-status"><FontAwesomeIcon icon={faCheck} /> Booked</div>
                      {showDeleteConfirm ? (
                        <div className="delete-confirm-inline">
                          <span>Are you sure?</span>
                          <button className="confirm-yes-btn" onClick={handleConfirmDelete} disabled={isDeletingBooking}>Yes, Delete</button>
                          <button className="confirm-no-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                        </div>
                      ) : (
                        <button 
                          className="delete-booking-btn"
                          onClick={handleDeleteBooking}
                          disabled={isDeletingBooking}
                          title="Delete booking"
                        >
                          {isDeletingBooking ? (
                            <>
                              <LoadingSpinner size="small" color="white" inline />
                              Deleting...
                            </>
                          ) : (
                            <><FontAwesomeIcon icon={faTrash} /> Cancel Booking</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="booking-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Customer Name:</span>
                        <span className="detail-value">{studioBooking.customer_name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{studioBooking.customer_phone}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">N/A</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Customer ID:</span>
                        <span className="detail-value">{studioBooking.customer_id_number}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Platform Source:</span>
                        <span className="detail-value">{studioBooking.how_did_customer_find_us}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Rent Period:</span>
                        <span className="detail-value">{studioBooking.rent_period}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Start Date:</span>
                        <span className="detail-value">{studioBooking.rent_start_date ? new Date(studioBooking.rent_start_date).toLocaleDateString() : 'Invalid Date'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">End Date:</span>
                        <span className="detail-value">{studioBooking.rent_end_date ? new Date(studioBooking.rent_end_date).toLocaleDateString() : 'Invalid Date'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Contract Date:</span>
                        <span className="detail-value">{studioBooking.created_at ? new Date(studioBooking.created_at).toLocaleDateString() : '10/9/2025'}</span>
                      </div>
                    </div>

                    <div className="financial-summary">
                      <h4><FontAwesomeIcon icon={faDollarSign} /> Financial Summary</h4>
                      <div className="financial-grid">
                        <div className="financial-item">
                          <span className="financial-label">Monthly Rent:</span>
                          <span className="financial-value">EGP {parseFloat(studioBooking.rent_price || 0).toLocaleString()}</span>
                        </div>
                        <div className="financial-item">
                          <span className="financial-label">Deposit:</span>
                          <span className="financial-value">EGP {parseFloat(studioBooking.paid_deposit || 0).toLocaleString()}</span>
                        </div>
                        <div className="financial-item">
                          <span className="financial-label">Warranty:</span>
                          <span className="financial-value">EGP {parseFloat(studioBooking.warrant_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="financial-item total">
                          <span className="financial-label">Total Initial:</span>
                          <span className="financial-value">EGP {(parseFloat(studioBooking.paid_deposit || 0) + parseFloat(studioBooking.warrant_amount || 0)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {studioBooking.notes && (
                      <div className="contract-info">
                        <h4>📝 Notes</h4>
                        <p>{studioBooking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="studio-sidebar">
            <div className="contact-card">
              <h3>Listed by agency</h3>
              <div className="agency-info">
                <div className="agency-name">AYG</div>
                <div className="agency-rating">⭐ 4.8</div>
                <div className="agency-member">Member since Sept 2024</div>
              </div>
              
              <div className="contact-actions">
                {/* WhatsApp Button Logic:
                    - If admin/master admin viewing + has booking -> Customer's phone
                    - Otherwise -> Agency/Admin phone for inquiries
                */}
                {(navigationSource === 'admin-dashboard' || 
                  navigationSource === 'master-admin-dashboard' || 
                  navigationSource === 'admin-tracking' || 
                  navigationSource === 'admin-rental-alerts' || 
                  navigationSource === 'master-admin-rental-alerts') && studioBooking ? (
                  // Admin viewing rented studio - Show customer contact
                  <>
                    <div className="contact-info-header">
                      <h4>Customer Contact</h4>
                      <p className="contact-name">{studioBooking.customer_name || studioBooking.customerName}</p>
                      <p className="contact-phone">{studioBooking.customer_phone || studioBooking.customerPhone}</p>
                    </div>
                    <WhatsAppButton 
                      phoneNumber={studioBooking.customer_phone || studioBooking.customerPhone || '+201000000000'}
                      message={`Hello ${studioBooking.customer_name || studioBooking.customerName}, this is regarding your rental at ${studio.title || studio.name}.`}
                      contactType="customer"
                      label="Contact Tenant"
                    />
                  </>
                ) : (
                  // Customer viewing or no booking - Show agency contact
                  <WhatsAppButton 
                    phoneNumber={studio.adminPhone || studio.contact_number || '+201000000000'}
                    message={`Hello, I'm interested in ${studio.title || studio.name} for ${studioDisplayPrice}`}
                    contactType="agency"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal - Only for Admin/Master Admin access */}
      {(navigationSource === 'admin-dashboard' || navigationSource === 'master-admin-dashboard' || navigationSource === 'admin-tracking' || navigationSource === 'admin-rental-alerts' || navigationSource === 'master-admin-rental-alerts') && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          studio={studio}
          onBookingSubmit={handleBookingSubmit}
          isLoading={isBookingLoading}
        />
      )}

      {/* Edit Studio Modal - Only for Admin/Master Admin access */}
      {isEditModalOpen && (navigationSource === 'admin-dashboard' || navigationSource === 'master-admin-dashboard' || navigationSource === 'admin-tracking' || navigationSource === 'admin-rental-alerts' || navigationSource === 'master-admin-rental-alerts') && (
        <EditStudioModal
          onClose={() => setIsEditModalOpen(false)}
          studio={studio}
          apartmentId={studio?.apartment_id}
          onStudioUpdated={handleStudioUpdate}
          isLoading={isEditLoading}
        />
      )}
      
      {/* Footer - Only show for customer views */}
      {navigationSource === 'customer-studios' && <Footer />}
    </div>
  );
};

export default StudioDetailsPage;