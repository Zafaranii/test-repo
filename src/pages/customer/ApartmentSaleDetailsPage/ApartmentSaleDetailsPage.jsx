import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faBed, 
  faShower, 
  faRuler, 
  faMapMarkerAlt, 
  faKey, 
  faMoneyBillWave, 
  faMap, 
  faCheck 
} from '@fortawesome/free-solid-svg-icons';
import BackButton from '../../../components/common/BackButton';
import ImageGallery from '../../../components/customer/ImageGallery/ImageGallery';
import WhatsAppButton from '../../../components/customer/WhatsAppButton/WhatsAppButton';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import Footer from '../../../components/common/Footer';
import { saleApartmentsApi } from '../../../services/api';
import './ApartmentSaleDetailsPage.css';
import AYGLogo from '../../../assets/images/logo/AYG.png';
import { SITE_CONTACT } from '../../../config/siteConfig';

const ApartmentSaleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminPhone, setAdminPhone] = useState(null);

  // Fetch apartment details from API
  useEffect(() => {
    const fetchApartmentDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await saleApartmentsApi.getById(id);
        
        if (response) {
          // The API names these photos_url / number; the page reads images / apartment_number.
          setApartment({
            ...response,
            images: response.images || response.photos_url || [],
            apartment_number: response.apartment_number || response.number,
          });
          
          // Get admin's contact number from apartment data
          // The contact_number field contains the admin's phone number
          // Check if created by master admin (typically ID 1) and use special number
          const isMasterAdmin = response.listed_by_admin_id === 1;
          const masterAdminPhone = SITE_CONTACT.masterAdminPhone;
          setAdminPhone(isMasterAdmin ? masterAdminPhone : (response.contact_number || '+201000000000'));
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
      fetchApartmentDetails();
    }
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="apartment-details-page">
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
      <div className="apartment-details-page">
        <div className="container">
          <div className="error-container">
            <h1>Error Loading Apartment</h1>
            <p className="error-message">{error}</p>
            <BackButton onClick={() => navigate(-1)} />
          </div>
        </div>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="apartment-details-page">
        <div className="container">
          <h1>Apartment not found</h1>
          <BackButton onClick={() => navigate('/')} />
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    if (!price) return 'Contact for price';
    return `EGP ${price.toLocaleString()}`;
  };

  const openGoogleMaps = () => {
    if (apartment.location_coordinates && apartment.location_coordinates.lat && apartment.location_coordinates.lng) {
      const mapsUrl = `https://www.google.com/maps?q=${apartment.location_coordinates.lat},${apartment.location_coordinates.lng}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else if (apartment.location) {
      const searchQuery = encodeURIComponent(apartment.location);
      const mapsUrl = `https://www.google.com/maps/search/${searchQuery}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="apartment-details-page">
      <nav className="apartment-nav">
        <button 
          className="back-to-apartments-btn" 
          onClick={() => navigate('/buy-apartments')}
        >
          ← Back to Apartments
        </button>
        <div className="brand">
          <img src={AYGLogo} alt="AYG logo" className="brand-logo" />
          <span className="brand-text">AYG</span>
        </div>
      </nav>

      <div className="apartment-container">
        <div className="apartment-gallery-section">
          <ImageGallery 
            images={apartment.images || []} 
            title={apartment.name || apartment.title}
            fallbackImage="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23f0f0f0' width='800' height='600'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='32' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Image Available%3C/text%3E%3C/svg%3E"
          />
        </div>

        <div className="apartment-content">
          {/* Card 1: Main Information */}
          <div className="apartment-card apartment-main-info">
            <div className="apartment-header">
              <div className="apartment-title-section">
                <h1 className="apartment-title">{apartment.name || apartment.title}</h1>
                <div className="apartment-subtitle">
                  {apartment.apartment_number && (
                    <span className="apartment-number">{apartment.apartment_number}</span>
                  )}
                </div>
              </div>
              <div className="apartment-price-section">
                <div className="apartment-price">{formatPrice(apartment.price || apartment.sale_price)}</div>
              </div>
            </div>

            <div className="apartment-posted">
              Listed {apartment.created_at ? 
                new Date(apartment.created_at).toLocaleDateString() : 
                'Recently'
              }
            </div>

            {/* Google Maps Link */}
            {(apartment.location_coordinates || apartment.location) && (
              <div className="apartment-location-section">
                <h3><FontAwesomeIcon icon={faMapMarkerAlt} /> Location</h3>
                <button 
                  onClick={openGoogleMaps}
                  className="maps-button"
                  type="button"
                >
                  <FontAwesomeIcon icon={faMap} /> View on Google Maps
                </button>
              </div>
            )}

            <div className="apartment-features">
              <h2>Property Highlights</h2>
              <div className="highlights-grid">
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faHome} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Type</div>
                    <div className="highlight-value">Apartment</div>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faKey} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Ownership</div>
                    <div className="highlight-value">For Sale</div>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faRuler} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Area</div>
                    <div className="highlight-value">{apartment.area ? `${apartment.area} m²` : 'N/A'}</div>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faBed} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Bedrooms</div>
                    <div className="highlight-value">{apartment.bedrooms || apartment.number_of_bedrooms || 'N/A'}</div>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faShower} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Bathrooms</div>
                    <div className="highlight-value">{apartment.bathrooms || apartment.number_of_bathrooms || 'N/A'}</div>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
                  <div className="highlight-content">
                    <div className="highlight-label">Price</div>
                    <div className="highlight-value">{formatPrice(apartment.price || apartment.sale_price)}</div>
                  </div>
                </div>
              </div>
            </div>

            {apartment.description && (
              <div className="apartment-description">
                <h2>Description</h2>
                <p>{apartment.description}</p>
              </div>
            )}



            {((apartment.amenities && apartment.amenities.length > 0) || (apartment.facilities && apartment.facilities.length > 0)) && (
              <div className="amenities-section">
                <h2>Facilities & Amenities</h2>
                <div className="amenities-grid">
                  {(apartment.facilities || apartment.amenities || []).map((amenity, index) => (
                    <div key={index} className="amenity-item">
                      <span className="amenity-icon"><FontAwesomeIcon icon={faCheck} /></span>
                      <span className="amenity-name">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Property Details and Contact */}
          <div className="apartment-card apartment-details-card">
            <div className="details-section">
              <h2>Property Details</h2>
              <div className="details-table">
                <div className="detail-row">
                  <span className="detail-label">Apartment Number</span>
                  <span className="detail-value">{apartment.apartment_number || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Listing Date</span>
                  <span className="detail-value">{apartment.created_at ? 
                    new Date(apartment.created_at).toLocaleDateString() : 
                    'Recently'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Listed By</span>
                  <span className="detail-value">{apartment.created_by || 'AYG'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Property Type</span>
                  <span className="detail-value">Apartment for Sale</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{apartment.location}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">{apartment.address || apartment.location}</span>
                </div>
              </div>
            </div>

            <div className="apartment-actions">
              <WhatsAppButton 
                phoneNumber={adminPhone || apartment.contact_number || "+201000000000"}
                message={`Hi! I'm interested in the apartment "${apartment.name || apartment.title}" listed for ${formatPrice(apartment.price || apartment.sale_price)}. Could you provide more details?`}
              />
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ApartmentSaleDetailsPage;