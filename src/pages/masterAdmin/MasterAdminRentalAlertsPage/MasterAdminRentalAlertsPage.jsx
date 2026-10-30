import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMasterAuth } from '../../../hooks/useRedux';
import { apartmentPartsApi, rentalContractsApi, rentApartmentsApi } from '../../../services/api';
import BackButton from '../../../components/common/BackButton';
import RentalAlerts from '../../../components/admin/RentalAlerts/RentalAlerts';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import AYGLogo from '../../../assets/images/logo/AYG.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import heroImg from '../../../assets/images/backgrounds/LP.jpg';
import './MasterAdminRentalAlertsPage.css';

const MasterAdminRentalAlertsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useMasterAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApartments: 0,
    totalStudios: 0,
    rentedStudios: 0,
    availableStudios: 0
  });

  const fetchAllStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all apartments
      const apartmentsResponse = await rentApartmentsApi.getAll();
      const allApartments = Array.isArray(apartmentsResponse) ? apartmentsResponse : [];

      // Fetch all studios
      const studiosResponse = await apartmentPartsApi.getAll();
      const allStudios = Array.isArray(studiosResponse) ? studiosResponse : [];

      // Fetch active rental contracts
      const contractsResponse = await rentalContractsApi.getAll({ is_active: true });
      const activeContracts = Array.isArray(contractsResponse) ? contractsResponse : [];

      // Calculate rented studios
      const rentedStudioIds = new Set(activeContracts.map(contract => contract.apartment_part_id));
      const rentedStudios = allStudios.filter(studio => rentedStudioIds.has(studio.id)).length;
      const availableStudios = allStudios.length - rentedStudios;

      setStats({
        totalApartments: allApartments.length,
        totalStudios: allStudios.length,
        rentedStudios,
        availableStudios
      });
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setStats({
        totalApartments: 0,
        totalStudios: 0,
        rentedStudios: 0,
        availableStudios: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  const handleContractDeleted = () => {
    // Refresh stats after contract deletion
    fetchAllStats();
  };

  if (!currentUser) {
    return (
      <div className="master-admin-alerts-loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="master-admin-alerts-loading">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="master-admin-rental-alerts-page">
      {/* Hero Section with Background */}
      <div className="master-alerts-hero" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="master-alerts-hero-overlay">
          <div className="master-alerts-hero-content">
            {/* Navigation */}
            <nav className="master-alerts-nav">
              <div className="master-alerts-nav-actions">
                <BackButton 
                  text="← Back to Master Admin Dashboard"
                  onClick={() => navigate('/master-admin/dashboard')}
                  variant="transparent"
                />
              </div>
              <div className="master-alerts-brand">
                <img src={AYGLogo} alt="AYG logo" className="brand-logo" />
                <span className="brand-text">AYG</span>
              </div>
            </nav>

            {/* Page Header */}
            <div className="master-alerts-page-header">
              <h2 className="master-alerts-title">
                Rental <span className="accent">Alerts</span>
              </h2>
              <p className="master-alerts-subtitle">
                Monitor all rental expirations across the entire system
              </p>
              
              {/* Quick Stats */}
              <div className="master-alerts-stats">
                <div className="stat-card">
                  <div className="stat-number">{stats.totalApartments}</div>
                  <div className="stat-label">Apartments</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.totalStudios}</div>
                  <div className="stat-label">Total Studios</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.rentedStudios}</div>
                  <div className="stat-label">Rented</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.availableStudios}</div>
                  <div className="stat-label">Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Alerts Section */}
      <div className="master-alerts-main-section">
        <div className="master-alerts-container">
          <div className="master-alerts-section-header">
            <h3><FontAwesomeIcon icon={faBell} /> Active Rental Alerts</h3>
            <p>All rental contracts requiring attention across the system</p>
          </div>
          
          {/* Rental Alerts Component */}
          <div className="master-alerts-content">
            <RentalAlerts 
              showAllAdmins={true} 
              onContractDeleted={handleContractDeleted}
              navigationSource="master-admin-rental-alerts"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterAdminRentalAlertsPage;