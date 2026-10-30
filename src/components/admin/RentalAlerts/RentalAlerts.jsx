import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { rentalContractsApi, apartmentPartsApi, adminApi } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import './RentalAlerts.css';

const RentalAlerts = ({ adminId, onContractDeleted, showAllAdmins = false, navigationSource = 'admin-rental-alerts' }) => {
  const navigate = useNavigate();
  const [alertContracts, setAlertContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [deletingContractId, setDeletingContractId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);
  const [adminNames, setAdminNames] = useState({});
  const { showError } = useToast();

  // Calculate days until expiration
  const calculateDaysUntilExpiry = (endDate) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Determine alert status
  const getAlertStatus = (daysRemaining) => {
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 7) return 'critical';
    if (daysRemaining <= 30) return 'warning';
    if (daysRemaining <= 60) return 'info';
    return null; // No alert needed
  };

  // Fetch contracts and check for alerts
  const fetchRentalAlerts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all active rental contracts
      const contracts = await rentalContractsApi.getAll({ is_active: true });
      
      if (!contracts || !Array.isArray(contracts)) {
        setAlertContracts([]);
        return;
      }

      // Filter by admin if adminId is provided and not showing all admins
      let filteredContracts = contracts;
      if (adminId && !showAllAdmins) {
        filteredContracts = contracts.filter(contract => 
          contract.created_by_admin_id === adminId
        );
      }

      // Fetch admin names if showing all admins (master admin view)
      if (showAllAdmins) {
        try {
          const admins = await adminApi.getAll();
          const namesMap = {};
          if (Array.isArray(admins)) {
            admins.forEach(admin => {
              namesMap[admin.id] = admin.full_name || admin.username || `Admin #${admin.id}`;
            });
          }
          setAdminNames(namesMap);
        } catch (error) {
          console.error('Failed to fetch admin names:', error);
        }
      }

      // Process contracts to find those needing alerts
      const contractsWithAlerts = await Promise.all(
        filteredContracts.map(async (contract) => {
          const daysRemaining = calculateDaysUntilExpiry(contract.rent_end_date);
          const alertStatus = getAlertStatus(daysRemaining);
          
          // Only include contracts that need alerts (within 60 days or overdue)
          if (!alertStatus) return null;

          // Fetch studio details if needed
          let studioDetails = null;
          try {
            studioDetails = await apartmentPartsApi.getById(contract.apartment_part_id);
          } catch (error) {
            console.error(`Failed to fetch studio details for part ${contract.apartment_part_id}:`, error);
          }

          return {
            ...contract,
            daysRemaining,
            alertStatus,
            studioDetails
          };
        })
      );

      // Filter out null values and sort by urgency
      const validAlerts = contractsWithAlerts
        .filter(Boolean)
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

      setAlertContracts(validAlerts);
    } catch (error) {
      console.error('Failed to fetch rental alerts:', error);
      setAlertContracts([]);
    } finally {
      setLoading(false);
    }
  }, [adminId, showAllAdmins]);

  useEffect(() => {
    fetchRentalAlerts();
    
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchRentalAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchRentalAlerts]);

  const getAlertIcon = (status) => {
    switch (status) {
      case 'overdue': return '🚨';
      case 'critical': return '⚠️';
      case 'warning': return '⏰';
      case 'info': return '📅';
      default: return '📋';
    }
  };

  const getAlertClassName = (status) => {
    return `alert-card alert-${status}`;
  };

  const getAlertMessage = (contract) => {
    const days = contract.daysRemaining;
    
    if (days < 0) {
      return `Contract expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
    } else if (days === 0) {
      return 'Contract expires TODAY!';
    } else if (days === 1) {
      return 'Contract expires TOMORROW!';
    } else if (days <= 7) {
      return `Contract expires in ${days} days - URGENT`;
    } else if (days <= 30) {
      return `Contract expires in ${days} days`;
    } else {
      return `Contract expires in ${days} days - Plan ahead`;
    }
  };

  const handleContactTenant = (contract) => {
    const phone = contract.customer_phone;
    if (phone) {
      const message = encodeURIComponent(
        `Hello ${contract.customer_name}, your rental contract for Studio ${contract.studioDetails?.title || 'N/A'} is expiring soon. Please contact us to discuss renewal options.`
      );
      window.open(`https://wa.me/${phone.replace(/\+/g, '')}?text=${message}`, '_blank');
    }
  };

  const handleStudioClick = (contract) => {
    if (contract.apartment_part_id) {
      navigate(`/studio/${contract.apartment_part_id}?source=${navigationSource}`);
    }
  };

  const handleDeleteClick = (contract, e) => {
    e.stopPropagation();
    setContractToDelete(contract);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;

    try {
      setDeletingContractId(contractToDelete.id);
      await rentalContractsApi.delete(contractToDelete.id);
      
      // Remove from local state
      setAlertContracts(prev => prev.filter(c => c.id !== contractToDelete.id));
      
      // Notify parent component
      if (onContractDeleted) {
        onContractDeleted();
      }
      
      setShowDeleteConfirm(false);
      setContractToDelete(null);
    } catch (error) {
      console.error('Failed to delete contract:', error);
      showError('Failed to delete contract: ' + (error.message || 'Unknown error'));
    } finally {
      setDeletingContractId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setContractToDelete(null);
  };

  if (loading) {
    return (
      <div className="rental-alerts loading">
        <div className="loading-spinner"></div>
        <p>Loading rental alerts...</p>
      </div>
    );
  }

  if (alertContracts.length === 0) {
    return (
      <div className="rental-alerts no-alerts">
        <h3>🎉 No Rental Alerts</h3>
        <p>All your rentals are up to date!</p>
      </div>
    );
  }

  const displayedAlerts = showAllAlerts ? alertContracts : alertContracts.slice(0, 3);

  // Calculate summary stats
  const overdueCount = alertContracts.filter(c => c.alertStatus === 'overdue').length;
  const criticalCount = alertContracts.filter(c => c.alertStatus === 'critical').length;
  const warningCount = alertContracts.filter(c => c.alertStatus === 'warning').length;

  return (
    <div className="rental-alerts">
      <div className="alerts-header">
        <h3>
          🔔 Rental Alerts 
          <span className="alert-count">({alertContracts.length})</span>
        </h3>
        {alertContracts.length > 3 && (
          <button 
            className="toggle-alerts-btn"
            onClick={() => setShowAllAlerts(!showAllAlerts)}
          >
            {showAllAlerts ? 'Show Less' : `Show All (${alertContracts.length})`}
          </button>
        )}
      </div>

      <div className="alerts-list">
        {displayedAlerts.map((contract) => (
          <div key={contract.id} className={getAlertClassName(contract.alertStatus)}>
            <div className="alert-icon">{getAlertIcon(contract.alertStatus)}</div>
            
            <div className="alert-content" onClick={() => handleStudioClick(contract)}>
              <div className="alert-title">
                <h4>{contract.studioDetails?.title || `Studio #${contract.apartment_part_id}`}</h4>
                <span className="contract-dates">
                  {new Date(contract.rent_start_date).toLocaleDateString()} - {new Date(contract.rent_end_date).toLocaleDateString()}
                </span>
              </div>
              
              <div className="alert-message">
                {getAlertMessage(contract)}
              </div>
              
              <div className="tenant-info">
                <strong>Tenant:</strong> {contract.customer_name}
                {contract.customer_phone && (
                  <span className="tenant-contact">
                    • {contract.customer_phone}
                  </span>
                )}
              </div>

              <div className="contract-details">
                <span>Monthly: EGP {parseFloat(contract.rent_price).toLocaleString()}</span>
                <span>Period: {contract.rent_period} months</span>
                {showAllAdmins && contract.created_by_admin_id && (
                  <span className="admin-info">
                    Admin: {adminNames[contract.created_by_admin_id] || `Admin #${contract.created_by_admin_id}`}
                  </span>
                )}
              </div>
            </div>
            
            <div className="alert-actions">
              {contract.customer_phone && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactTenant(contract);
                  }}
                  title="Contact tenant via WhatsApp"
                >
                  💬 WhatsApp
                </button>
              )}
              
              <button 
                className="btn btn-info btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStudioClick(contract);
                }}
                title="View studio details"
              >
                👁️ View
              </button>

              <button 
                className="btn btn-danger btn-sm"
                onClick={(e) => handleDeleteClick(contract, e)}
                disabled={deletingContractId === contract.id}
                title="Delete contract"
              >
                {deletingContractId === contract.id ? '⏳' : '🗑️'} Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {alertContracts.length > 0 && (
        <div className="alerts-summary">
          <p>
            <strong>Summary:</strong>{' '}
            {overdueCount > 0 && <span className="summary-overdue">{overdueCount} overdue</span>}
            {overdueCount > 0 && (criticalCount > 0 || warningCount > 0) && ', '}
            {criticalCount > 0 && <span className="summary-critical">{criticalCount} critical (≤7 days)</span>}
            {criticalCount > 0 && warningCount > 0 && ', '}
            {warningCount > 0 && <span className="summary-warning">{warningCount} expiring soon (≤30 days)</span>}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && contractToDelete && (
        <div className="delete-modal-overlay" onClick={cancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Confirm Deletion</h3>
            <p>Are you sure you want to delete this rental contract?</p>
            <div className="contract-info-summary">
              <strong>Studio:</strong> {contractToDelete.studioDetails?.title || `Studio #${contractToDelete.apartment_part_id}`}<br/>
              <strong>Tenant:</strong> {contractToDelete.customer_name}<br/>
              <strong>Period:</strong> {new Date(contractToDelete.rent_start_date).toLocaleDateString()} - {new Date(contractToDelete.rent_end_date).toLocaleDateString()}
            </div>
            <p className="warning-text">This action cannot be undone!</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={cancelDelete}
                disabled={deletingContractId === contractToDelete.id}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deletingContractId === contractToDelete.id}
              >
                {deletingContractId === contractToDelete.id ? 'Deleting...' : 'Delete Contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalAlerts;
