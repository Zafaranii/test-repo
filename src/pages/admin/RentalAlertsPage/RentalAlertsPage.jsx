import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { apartmentPartsApi, rentalContractsApi, rentApartmentsApi } from '../../../services/api';
import BackButton from '../../../components/common/BackButton';
import RentalAlerts from '../../../components/admin/RentalAlerts/RentalAlerts';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import heroImg from '../../../assets/images/backgrounds/LP.jpg';
import './RentalAlertsPage.css';
import AYGLogo from '../../../assets/images/logo/AYG.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

const RentalAlertsPage = () => {
  const navigate = useNavigate();
  const { currentAdmin } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [adminStats, setAdminStats] = useState({
    totalApartments: 0,
    totalStudios: 0,
    rentedStudios: 0,
    availableStudios: 0
  });

  const fetchAdminStats = useCallback(async () => {
    if (currentAdmin?.id || currentAdmin?.email) {
      setIsLoading(true);
      try {
        // Fetch apartments created by this admin
        const apartmentsResponse = await rentApartmentsApi.getAll();
        const adminApartments = Array.isArray(apartmentsResponse) ? 
          apartmentsResponse.filter(apt => apt.listed_by_admin_id === currentAdmin.id) : [];

        // Fetch all studios
        const studiosResponse = await apartmentPartsApi.getAll();
        const allStudios = Array.isArray(studiosResponse) ? studiosResponse : [];
        
        // Filter studios that belong to admin's apartments
        const adminApartmentIds = adminApartments.map(apt => apt.id);
        const adminStudios = allStudios.filter(studio => 
          adminApartmentIds.includes(studio.apartment_id)
        );

        // Get active rental contracts
        const contractsResponse = await rentalContractsApi.getAll({ is_active: true });
        const activeContracts = Array.isArray(contractsResponse) ? contractsResponse : [];

        // Calculate rented studios
        const rentedStudioIds = new Set(activeContracts.map(contract => contract.apartment_part_id));
        const rentedStudios = adminStudios.filter(studio => rentedStudioIds.has(studio.id)).length;
        const availableStudios = adminStudios.length - rentedStudios;

        setAdminStats({
          totalApartments: adminApartments.length,
          totalStudios: adminStudios.length,
          rentedStudios,
          availableStudios
        });
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        setAdminStats({
          totalApartments: 0,
          totalStudios: 0,
          rentedStudios: 0,
          availableStudios: 0
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentAdmin]);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  const handleContractDeleted = () => {
    // Refresh stats after contract deletion
    fetchAdminStats();
  };

  if (!currentAdmin) {
    return (
      <div className="rental-alerts-page-loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rental-alerts-page-loading">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="rental-alerts-page">
      {/* Hero Section with Background */}
      <div className="alerts-hero" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="alerts-hero-overlay">
          <div className="alerts-hero-content">
            {/* Navigation */}
            <nav className="alerts-nav">
              <div className="alerts-nav-actions">
                <BackButton 
                  text="← Back to Admin Dashboard"
                  onClick={() => navigate('/admin/dashboard')}
                  variant="transparent"
                />
              </div>
              <div className="alerts-brand">
                <img src={AYGLogo} alt="AYG logo" className="brand-logo" />
                <span className="brand-text">AYG</span>
              </div>
            </nav>

            {/* Page Header */}
            <div className="alerts-page-header">
              <h2 className="alerts-title">
                Rental <span className="accent">Alerts</span>
              </h2>
              <p className="alerts-subtitle">
                Monitor and manage rental expirations for your properties
              </p>
              
              {/* Quick Stats */}
              <div className="alerts-stats">
                <div className="stat-card">
                  <div className="stat-number">{adminStats.totalApartments}</div>
                  <div className="stat-label">Apartments</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{adminStats.totalStudios}</div>
                  <div className="stat-label">Total Studios</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{adminStats.rentedStudios}</div>
                  <div className="stat-label">Rented</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{adminStats.availableStudios}</div>
                  <div className="stat-label">Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Alerts Section */}
      <div className="alerts-main-section">
        <div className="alerts-container">
          <div className="alerts-section-header">
            <h3><FontAwesomeIcon icon={faBell} /> Active Rental Alerts</h3>
            <p>Studios requiring attention for rental renewals or status updates</p>
          </div>
          
          {/* Rental Alerts Component */}
          <div className="alerts-content">
            <RentalAlerts 
              adminId={currentAdmin?.id}
              onContractDeleted={handleContractDeleted}
              navigationSource="admin-rental-alerts"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalAlertsPage;