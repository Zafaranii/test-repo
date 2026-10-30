import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import BackButton from '../../../components/common/BackButton';
import StudioMiniCard from '../../../components/admin/StudioMiniCard';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import AddStudioModal from '../../../components/admin/AddStudioModal';
import { rentApartmentsApi, apartmentPartsApi } from '../../../services/api';
import './ApartmentDetailPage.css';

const ApartmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apartment, setApartment] = useState(null);
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddStudioModalOpen, setIsAddStudioModalOpen] = useState(false);
  const [navigationSource, setNavigationSource] = useState('admin-dashboard');

  // Detect navigation source
  useEffect(() => {
    const source = searchParams.get('source');
    if (source) {
      setNavigationSource(source);
    }
  }, [searchParams]);

  // Fetch apartment and studios data
  useEffect(() => {
    const fetchApartmentData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch apartment details
        const apartmentResponse = await rentApartmentsApi.getById(id);
        
        if (apartmentResponse) {
          setApartment(apartmentResponse);

          // Fetch studios (apartment parts) for this apartment
          const studiosResponse = await apartmentPartsApi.getAll({ apartment_id: id });
          
          if (studiosResponse && Array.isArray(studiosResponse)) {
            setStudios(studiosResponse);
          } else {
            setStudios([]);
          }
        } else {
          setError('Apartment not found');
        }
      } catch (err) {
setError('Failed to load apartment details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchApartmentData();
    }
  }, [id]);

  const handleStudioAdded = async () => {
    // Refresh studios list after adding a new one
    try {
      const studiosResponse = await apartmentPartsApi.getAll({ apartment_id: id });
      if (studiosResponse && Array.isArray(studiosResponse)) {
        setStudios(studiosResponse);
      }
      setIsAddStudioModalOpen(false);
    } catch (err) {
}
  };

  const getBackLink = () => {
    if (navigationSource === 'master-admin-dashboard') {
      return '/master-admin/dashboard';
    }
    return '/admin/dashboard';
  };

  const availableStudios = studios.filter(studio => studio.status === 'available').length;
  const occupiedStudios = studios.length - availableStudios;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="apartment-detail-page error-state">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <BackButton text="← Go Back" onClick={() => navigate(getBackLink())} />
        </div>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="apartment-detail-page error-state">
        <div className="error-container">
          <h2>Apartment Not Found</h2>
          <p>The apartment you're looking for doesn't exist.</p>
          <BackButton text="← Go Back" onClick={() => navigate(getBackLink())} />
        </div>
      </div>
    );
  }

  return (
    <div className="apartment-detail-page">
      <div className="apartment-detail-container">
        <BackButton text="← Back to Dashboard" onClick={() => navigate(getBackLink())} />

        {/* Apartment Header */}
        <div className="apartment-detail-header">
          <div className="apartment-header-content">
            <div className="apartment-main-info">
              <h1 className="apartment-name">{apartment.name}</h1>
              <p className="apartment-location">📍 {apartment.location}</p>
              <p className="apartment-address">{apartment.address}</p>
            </div>

            <div className="apartment-stats-summary">
              <div className="stat-box">
                <span className="stat-number">{studios.length}</span>
                <span className="stat-label">Total Studios</span>
              </div>
              <div className="stat-box available">
                <span className="stat-number">{availableStudios}</span>
                <span className="stat-label">Available</span>
              </div>
              <div className="stat-box occupied">
                <span className="stat-number">{occupiedStudios}</span>
                <span className="stat-label">Occupied</span>
              </div>
            </div>
          </div>

          {/* Apartment Images */}
          {apartment.photos_url && apartment.photos_url.length > 0 && (
            <div className="apartment-images-gallery">
              {apartment.photos_url.slice(0, 3).map((photo, index) => (
                <div 
                  key={index} 
                  className="apartment-image-item"
                  style={{ backgroundImage: `url(${photo})` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Apartment Details */}
        <div className="apartment-details-section">
          <h2>Apartment Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Area:</span>
              <span className="detail-value">{apartment.area} m²</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Bedrooms:</span>
              <span className="detail-value">{apartment.bedrooms}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Bathrooms:</span>
              <span className="detail-value">{apartment.bathrooms}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Floor:</span>
              <span className="detail-value">{apartment.floor}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Price:</span>
              <span className="detail-value">{apartment.price} EGP</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Contact:</span>
              <span className="detail-value">{apartment.contact_number}</span>
            </div>
          </div>

          {apartment.description && (
            <div className="apartment-description">
              <h3>Description</h3>
              <p>{apartment.description}</p>
            </div>
          )}

          {apartment.facilities_amenities && (
            <div className="apartment-facilities">
              <h3>Facilities & Amenities</h3>
              <div className="facilities-list">
                {(() => {
                  // Handle both string (from backend) and array formats
                  const facilities = typeof apartment.facilities_amenities === 'string' 
                    ? apartment.facilities_amenities.split(',').map(f => f.trim()).filter(f => f.length > 0)
                    : Array.isArray(apartment.facilities_amenities) 
                      ? apartment.facilities_amenities 
                      : [];
                  
                  return facilities.map((facility, index) => (
                    <span key={index} className="facility-tag">{facility}</span>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Studios Section */}
        <div className="studios-section">
          <div className="studios-header">
            <h2>Studios ({studios.length})</h2>
            <button 
              className="add-studio-btn-primary"
              onClick={() => setIsAddStudioModalOpen(true)}
            >
              + Add New Studio
            </button>
          </div>

          {studios.length > 0 ? (
            <div className="studios-grid">
              {studios.map(studio => (
                <StudioMiniCard
                  key={studio.id}
                  studio={{
                    id: studio.id,
                    title: studio.title,
                    unitNumber: studio.title,
                    floor: `Floor ${apartment.floor}`,
                    area: `${apartment.area} m²`,
                    price: `${parseFloat(studio.monthly_price) || 0} EGP/month`,
                    images: apartment.photos_url || ['/api/placeholder/400/300'],
                    isAvailable: studio.status === 'available',
                    apartmentId: apartment.id
                  }}
                  apartmentId={apartment.id}
                />
              ))}
            </div>
          ) : (
            <div className="no-studios-message">
              <div className="no-studios-content">
                <span className="no-studios-icon">🏠</span>
                <h3>No Studios Yet</h3>
                <p>This apartment doesn't have any studios yet. Add your first studio to get started.</p>
                <button 
                  className="add-first-studio-btn"
                  onClick={() => setIsAddStudioModalOpen(true)}
                >
                  + Add First Studio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Studio Modal */}
      {isAddStudioModalOpen && (
        <AddStudioModal
          isOpen={isAddStudioModalOpen}
          onClose={() => setIsAddStudioModalOpen(false)}
          onStudioAdded={handleStudioAdded}
          apartmentId={apartment.id}
        />
      )}
    </div>
  );
};

export default ApartmentDetailPage;
