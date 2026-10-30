import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { usePropertyManagement } from '../../../hooks/usePropertyManagement';
import { useInfiniteScroll } from '../../../hooks/usePagination';
import ApartmentCard from '../../../components/admin/ApartmentCard';
import SaleApartmentCard from '../../../components/admin/SaleApartmentCard';
import AddStudioModal from '../../../components/admin/AddStudioModal';
import AddApartmentModal from '../../../components/admin/AddApartmentModal';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import { myContentApi, handleApiError } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import heroImg from '../../../assets/images/backgrounds/LP.jpg';
import './AdminDashboard.css';
import AYGLogo from '../../../assets/images/logo/AYG.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentAdmin, logoutAdmin } = useAdminAuth();
  const propertyManager = usePropertyManagement();
  const [adminApartments, setAdminApartments] = useState([]);
  const [adminSaleApartments, setAdminSaleApartments] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [isAddStudioModalOpen, setIsAddStudioModalOpen] = useState(false);
  const [isAddApartmentModalOpen, setIsAddApartmentModalOpen] = useState(false);
  const [isAddSaleApartmentModalOpen, setIsAddSaleApartmentModalOpen] = useState(false);
  const [selectedApartmentId, setSelectedApartmentId] = useState(null);
  const [isProcessingStudio, setIsProcessingStudio] = useState(false);
  const [isProcessingApartment, setIsProcessingApartment] = useState(false);
  const { showSuccess, showError } = useToast();
  
  // Get admin role from current admin data
  const adminRole = currentAdmin?.role || 'studio_rental';

  // Transform API data for frontend compatibility
  const transformRentApartmentData = (apiApartment) => ({
    id: apiApartment.id,
    title: apiApartment.name,
    name: apiApartment.name,
    location: apiApartment.location,
    address: apiApartment.address,
    price: parseFloat(apiApartment.price) || 0,
    area: parseFloat(apiApartment.area) || 0,
    bedrooms: apiApartment.bedrooms,
    bathrooms: apiApartment.bathrooms,
    description: apiApartment.description,
    // The API sends amenities as one comma-separated string.
    facilities: (apiApartment.facilities_amenities || '').split(',').map((f) => f.trim()).filter(Boolean),
    images: apiApartment.photos_url || [],
    contactNumber: apiApartment.contact_number,
    floor: apiApartment.floor,
    totalStudios: apiApartment.total_parts || 0,
    createdBy: apiApartment.listed_by_admin_id,
    createdAt: apiApartment.created_at,
    updatedAt: apiApartment.updated_at,
    // Add studios if they exist in the response
    studios: (apiApartment.apartment_parts || []).map(part => ({
      id: part.id,
      apartmentId: part.apartment_id,
      studioNumber: part.title,
      title: part.title,
      unitNumber: part.title,
      rentValue: parseFloat(part.monthly_price) || parseFloat(part.rent_value) || 0,
      price: `${parseFloat(part.monthly_price) || parseFloat(part.rent_value) || 0} EGP/month`,
      area: `${parseFloat(part.area) || 0} sq ft`,
      floor: `Floor ${part.floor || 'N/A'}`,
      bedrooms: part.bedrooms || 1,
      bathrooms: part.bathrooms || 'private',
      furnished: part.furnished || 'no',
      balcony: part.balcony || 'no',
      description: part.description || '',
      images: part.photos_url || [],
      status: part.status,
      isAvailable: part.status === 'available',
      createdBy: part.created_by_admin_id,
      createdAt: part.created_at
    }))
  });

  const transformSaleApartmentData = (apiApartment) => ({
    id: apiApartment.id,
    title: apiApartment.name,
    name: apiApartment.name,
    location: apiApartment.location,
    address: apiApartment.address,
    price: parseFloat(apiApartment.price) || 0,
    area: parseFloat(apiApartment.area) || 0,
    bedrooms: apiApartment.bedrooms,
    bathrooms: apiApartment.bathrooms,
    description: apiApartment.description,
    images: apiApartment.photos_url || [],
    contactNumber: apiApartment.contact_number,
    floor: apiApartment.floor,
    unitNumber: apiApartment.number,
    createdBy: apiApartment.listed_by_admin_id,
    createdAt: apiApartment.created_at,
    updatedAt: apiApartment.updated_at,
    type: 'sale',
    isAvailable: true
  });

  // Fetch admin's own content from API
  const fetchAdminContent = async () => {
    try {
      setIsLoadingData(true);
      setDataError(null);

      const response = await myContentApi.getMyContent();

      // Transform the data
      const rentApartments = (response.rent_apartments || []).map(transformRentApartmentData);
      const saleApartments = (response.sale_apartments || []).map(transformSaleApartmentData);


      setAdminApartments(rentApartments);
      setAdminSaleApartments(saleApartments);

      return { success: true, rentApartments, saleApartments };
    } catch (error) {
const errorMessage = handleApiError(error, 'Failed to load your properties');
      setDataError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load admin's content on component mount
  useEffect(() => {
    if (currentAdmin) {
      fetchAdminContent();
    }
  }, [currentAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    try {
      // Simulate logout processing
      await new Promise(resolve => setTimeout(resolve, 500));
      logoutAdmin();
      navigate('/admin');
    } catch (error) {
}
  };

  const handleAddStudio = (apartmentId = null) => {
    setSelectedApartmentId(apartmentId);
    setIsAddStudioModalOpen(true);
  };

  const handleAddApartment = () => {
    setIsAddApartmentModalOpen(true);
  };

  const handleStudioAdded = async (studioData) => {
    setIsProcessingStudio(true);
    try {
      // Studio was already created by the modal - just refresh and close
      await fetchAdminContent();
      setIsAddStudioModalOpen(false);
      setSelectedApartmentId(null);
      showSuccess('Studio added successfully!');
    } catch (error) {
      showError(error.message || 'Failed to refresh after adding studio');
    } finally {
      setIsProcessingStudio(false);
    }
  };

  const handleApartmentAdded = async (apartmentData) => {
    setIsProcessingApartment(true);
    try {
      // Apartment was already created by the modal - just refresh and close
      if (adminRole === 'studio_rental') {
        setIsAddApartmentModalOpen(false);
      } else if (adminRole === 'apartment_sale') {
        setIsAddSaleApartmentModalOpen(false);
      }
      await fetchAdminContent();
    } catch (error) {
    } finally {
      setIsProcessingApartment(false);
    }
  };

  const handleAddSaleApartment = () => {
    setIsAddSaleApartmentModalOpen(true);
  };

  const handleRetryLoadData = () => {
    fetchAdminContent();
  };

  if (!currentAdmin) {
    return (
      <div className="admin-dashboard-loading">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Hero Section with Background */}
      <div className="admin-hero" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="admin-hero-overlay">
          <div className="admin-hero-content">
            {/* Navigation */}
            <nav className="admin-nav">
              <div className="admin-brand">
                <img src={AYGLogo} alt="AYG logo" className="brand-logo" />
                <span className="brand-text">AYG</span>
              </div>
              <div className="admin-nav-actions">
                <button 
                  onClick={() => navigate('/admin/rental-alerts')}
                  className="rental-alerts-btn"
                >
                  <FontAwesomeIcon icon={faBell} /> Rental Alerts
                </button>
                
                <button 
                  onClick={handleLogout} 
                  className="logout-btn"
                >
                  Logout
                </button>
              </div>
            </nav>

            {/* Dashboard Header */}
            <div className="admin-dashboard-header">
              <h2 className="dashboard-title">
                My <span className="accent">Properties</span>
              </h2>
              <p className="dashboard-subtitle">
                {adminRole === 'studio_rental' 
                  ? 'Manage your rental apartments and studios' 
                  : 'Manage your apartments for sale'
                }
              </p>
              
              <div className="dashboard-controls">
                <div className="cta-group">
                  {adminRole === 'studio_rental' ? (
                    <>
                      <button 
                        onClick={handleAddApartment}
                        className="btn btn--primary"
                        disabled={isProcessingApartment || isProcessingStudio}
                      >
                        {isProcessingApartment ? (
                          <>
                            <LoadingSpinner size="small" color="white" inline />
                            Processing...
                          </>
                        ) : (
                          '+ Add New Rental Apartment'
                        )}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleAddSaleApartment}
                      className="btn btn--primary"
                      disabled={isProcessingApartment}
                    >
                      {isProcessingApartment ? (
                        <>
                          <LoadingSpinner size="small" color="white" inline />
                          Processing...
                        </>
                      ) : (
                        '+ List Apartment for Sale'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Section */}
      <div className="admin-properties-section">
        <div className="properties-container">
          {/* Loading State */}
          {isLoadingData && !dataError && (
            <div className="loading-state">
              <LoadingSpinner size="large" />
            </div>
          )}

          {/* Error State */}
          {dataError && (
            <div className="error-state">
              <div className="error-content">
                <h3>Failed to Load Properties</h3>
                <p>{dataError}</p>
                <button className="retry-btn" onClick={handleRetryLoadData}>
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Properties Grid - Only show when not loading and no error */}
          {!isLoadingData && !dataError && (
            <>
              {adminRole === 'studio_rental' ? (
                <AdminRentalPropertiesGrid 
                  apartments={adminApartments}
                  onAddStudio={handleAddStudio}
                />
              ) : (
                <AdminSalePropertiesGrid 
                  apartments={adminSaleApartments}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {adminRole === 'studio_rental' && (
        <AddStudioModal
          isOpen={isAddStudioModalOpen}
          onClose={() => setIsAddStudioModalOpen(false)}
          onStudioAdded={handleStudioAdded}
          apartmentId={selectedApartmentId}
          isLoading={isProcessingStudio}
        />
      )}

      {adminRole === 'studio_rental' && (
        <AddApartmentModal
          isOpen={isAddApartmentModalOpen}
          onClose={() => setIsAddApartmentModalOpen(false)}
          onApartmentAdded={handleApartmentAdded}
          isLoading={isProcessingApartment}
        />
      )}

      {adminRole === 'apartment_sales' && (
        <AddApartmentModal
          isOpen={isAddSaleApartmentModalOpen}
          onClose={() => setIsAddSaleApartmentModalOpen(false)}
          onApartmentAdded={handleApartmentAdded}
          isLoading={isProcessingApartment}
          isSaleApartment={true}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

// Infinite Scroll Grid Components
const AdminRentalPropertiesGrid = ({ apartments, onAddStudio }) => {
  const {
    displayedItems,
    hasMore,
    isLoading,
    loadMore,
    totalItems,
    displayedCount
  } = useInfiniteScroll(apartments, 6); // 6 cards per page

  if (apartments.length === 0) {
    return (
      <div className="no-properties">
        <div className="no-properties-content">
          <h3>No Rental Properties Yet</h3>
          <p>Start by adding your first apartment to manage studios and rentals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="infinite-properties-container">
      {/* Progress indicator */}
      {totalItems > 6 && (
        <div className="properties-progress">
          <div className="progress-info">
            Showing {displayedCount} of {totalItems} properties
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(displayedCount / totalItems) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Apartments grid */}
      <div className="apartments-grid infinite-grid">
        {displayedItems.map((apartment) => (
          <ApartmentCard
            key={apartment.id}
            apartment={apartment}
            onAddStudio={onAddStudio}
            isAdminView={true}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="grid-loading">
          <LoadingSpinner size="small" />
        </div>
      )}

      {/* Load more button */}
      {hasMore && !isLoading && (
        <div className="load-more-section">
          <button onClick={loadMore} className="load-more-properties">
            Load More Properties ({totalItems - displayedCount} remaining)
          </button>
        </div>
      )}

      {/* End message */}
      {!hasMore && displayedCount > 6 && (
        <div className="all-loaded">
          All {totalItems} properties loaded
        </div>
      )}
    </div>
  );
};

const AdminSalePropertiesGrid = ({ apartments }) => {
  const {
    displayedItems,
    hasMore,
    isLoading,
    loadMore,
    totalItems,
    displayedCount
  } = useInfiniteScroll(apartments, 6); // 6 cards per page

  if (apartments.length === 0) {
    return (
      <div className="no-properties">
        <div className="no-properties-content">
          <h3>No Apartments Listed for Sale</h3>
          <p>Start by listing your first apartment for sale.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="infinite-properties-container">
      {/* Progress indicator */}
      {totalItems > 6 && (
        <div className="properties-progress">
          <div className="progress-info">
            Showing {displayedCount} of {totalItems} properties
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(displayedCount / totalItems) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Sale apartments grid */}
      <div className="apartments-grid infinite-grid">
        {displayedItems.map((apartment) => (
          <SaleApartmentCard
            key={apartment.id}
            apartment={apartment}
            isAdminView={true}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="grid-loading">
          <LoadingSpinner size="small" />
        </div>
      )}

      {/* Load more button */}
      {hasMore && !isLoading && (
        <div className="load-more-section">
          <button onClick={loadMore} className="load-more-properties">
            Load More Properties ({totalItems - displayedCount} remaining)
          </button>
        </div>
      )}

      {/* End message */}
      {!hasMore && displayedCount > 6 && (
        <div className="all-loaded">
          All {totalItems} properties loaded
        </div>
      )}
    </div>
  );
};
