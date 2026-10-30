import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../../../components/common/BackButton';
import ApartmentSaleCard from '../../../components/customer/ApartmentSaleCard/ApartmentSaleCard';
import Footer from '../../../components/common/Footer';
import { saleApartmentsApi, handleApiError } from '../../../services/api';
import './BuyApartmentPage.css';
import AYGLogo from '../../../assets/images/logo/AYG.png';

const BuyApartmentPage = () => {
  const [allSaleApartments, setAllSaleApartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('all');
  const [bedroomFilter, setBedroomFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const locationOptions = React.useMemo(() => {
    const uniqueLocations = new Map();

    allSaleApartments.forEach((apartment) => {
      const location = String(apartment.location || '').trim();
      if (!location) return;

      const key = location.toLowerCase();
      if (!uniqueLocations.has(key)) {
        uniqueLocations.set(key, location);
      }
    });

    return Array.from(uniqueLocations.values()).sort((a, b) => a.localeCompare(b));
  }, [allSaleApartments]);

  // Transform API apartment data to frontend format
  const transformSaleApartmentData = (apiApartment) => ({
    id: apiApartment.id,
    title: apiApartment.name,
    name: apiApartment.name,
    location: apiApartment.location,
    address: apiApartment.address,
    price: parseFloat(apiApartment.price) || 0,
    area: parseFloat(apiApartment.area) || 0,
    bedrooms: apiApartment.bedrooms,
    bathrooms: apiApartment.bathrooms === 'private' ? 1 : 0.5,
    description: apiApartment.description,
    images: apiApartment.photos_url || [],
    contactNumber: apiApartment.contact_number,
    floor: apiApartment.floor,
    unitNumber: apiApartment.number,
    amenities: apiApartment.facilities_amenities?.split(', ') || [],
    mapLocation: apiApartment.location_on_map,
    createdAt: apiApartment.created_at,
    updatedAt: apiApartment.updated_at,
    listedByAdminId: apiApartment.listed_by_admin_id,
    // Frontend compatibility
    type: 'sale',
    ownership: 'Sale',
    postedDate: new Date(apiApartment.created_at).toLocaleDateString() || 'Recently',
    isAvailable: true,
    completionStatus: 'Ready',
    coordinates: { lat: 30.0444, lng: 31.2357 } // Default Cairo coordinates
  });

  // Fetch sale apartments from API
  const fetchSaleApartments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await saleApartmentsApi.getAll();

      const transformedApartments = response.map(transformSaleApartmentData);

      setAllSaleApartments(transformedApartments);
      return { success: true, apartments: transformedApartments };
    } catch (error) {
const errorMessage = handleApiError(error, 'Failed to load apartments for sale');
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchSaleApartments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredApartments = allSaleApartments.filter(apartment => {
    // Price range filter
    if (priceRange === 'all') {
      // Continue to next filter
    } else if (priceRange === 'low' && apartment.price >= 4000000) {
      return false;
    } else if (priceRange === 'high' && apartment.price < 4000000) {
      return false;
    }

    // Bedroom filter
    if (bedroomFilter === 'all') {
      // Continue to next filter
    } else if (bedroomFilter === '1' && apartment.bedrooms !== 1) {
      return false;
    } else if (bedroomFilter === '2' && apartment.bedrooms !== 2) {
      return false;
    } else if (bedroomFilter === '3+' && apartment.bedrooms < 3) {
      return false;
    }

    // Location filter
    if (locationFilter !== 'all') {
      if (!apartment.location || !apartment.location.toLowerCase().includes(locationFilter.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const sortedApartments = [...filteredApartments].sort((a, b) => {
    if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'area-low') return (a.area || 0) - (b.area || 0);
    if (sortBy === 'area-high') return (b.area || 0) - (a.area || 0);
    return new Date(b.createdAt) - new Date(a.createdAt); // Default newest
  });

  // Retry function for error state
  const handleRetry = () => {
    fetchSaleApartments();
  };

  return (
    <div className="buy-apartment-page">
      <nav className="apartments-nav">
        <BackButton text="← Back" to="/" />
        <div className="brand">
          <img src={AYGLogo} alt="AYG logo" className="brand-logo" />
          <span className="brand-text">AYG</span>
        </div>
      </nav>

      <div className="apartments-container">
        <header className="apartments-header">
          <h1>Apartments for Sale</h1>
          {!isLoading && !error && (
            <p>{sortedApartments.length} properties found</p>
          )}
        </header>

        {/* Error State */}
        {error && (
          <div className="error-state">
            <div className="error-content">
              <h3>Failed to Load Apartments</h3>
              <p>{error}</p>
              <button className="retry-btn" onClick={handleRetry}>
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Filters Section - Only show when not loading and no error */}
        {!isLoading && !error && (
          <div className="filters-section">
            <div className="filter-group">
              <label htmlFor="location">Location:</label>
              <select 
                id="location"
                value={locationFilter} 
                onChange={(e) => setLocationFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Locations</option>
                {locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="sort">Sort by:</label>
              <select 
                id="sort"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest Listed</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="area-low">Area: Small to Large</option>
                <option value="area-high">Area: Large to Small</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="price">Price Range:</label>
              <select 
                id="price"
                value={priceRange} 
                onChange={(e) => setPriceRange(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Prices</option>
                <option value="low">Under 4M EGP</option>
                <option value="high">Above 4M EGP</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="bedrooms">Bedrooms:</label>
              <select 
                id="bedrooms"
                value={bedroomFilter} 
                onChange={(e) => setBedroomFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3+">3+ Bedrooms</option>
              </select>
            </div>
          </div>
        )}

        {/* Apartments Grid - Only show when not loading and no error */}
        {!isLoading && !error && (
          <div className="apartments-grid">
            {sortedApartments.map(apartment => (
              <ApartmentSaleCard key={apartment.id} apartment={apartment} />
            ))}
          </div>
        )}

        {/* No results states */}
        {!isLoading && !error && sortedApartments.length === 0 && allSaleApartments.length === 0 && (
          <div className="no-results">
            <h3>No apartments available</h3>
            <p>There are currently no apartments listed for sale. Please check back later.</p>
          </div>
        )}

        {!isLoading && !error && sortedApartments.length === 0 && allSaleApartments.length > 0 && (
          <div className="no-results">
            <h3>No apartments found</h3>
            <p>Try adjusting your filters to see more options.</p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default BuyApartmentPage;