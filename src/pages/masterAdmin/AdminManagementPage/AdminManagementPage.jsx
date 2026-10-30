import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../../hooks/useRedux';
import BackButton from '../../../components/common/BackButton';
import InfiniteScrollTable from '../../../components/admin/InfiniteScrollTable';
import './AdminManagementPage.css';

const AdminManagementPage = () => {
  const { 
    createAdminAccount, 
    getAllAdminAccounts, 
    updateAdminStatus, 
    deleteAdminAccount
  } = useAdminAuth();
  
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    username: '',
    account: '',
    password: '',
    mobileNumber: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Load admin accounts on component mount
  const loadAdminAccounts = useCallback(async () => {
    try {
      const accounts = await getAllAdminAccounts(); // Now async API call
      setAdminAccounts(accounts);
    } catch (error) {
setAdminAccounts([]);
    }
  }, [getAllAdminAccounts]);

  useEffect(() => {
    loadAdminAccounts();
  }, [loadAdminAccounts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.account.trim()) {
      newErrors.account = 'Account is required';
    } else if (formData.account.length < 3) {
      newErrors.account = 'Account must be at least 3 characters';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[+]?[\d\s-()]+$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Invalid mobile number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await createAdminAccount(formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setFormData({
          username: '',
          account: '',
          password: '',
          mobileNumber: ''
        });
        setShowCreateForm(false);
        loadAdminAccounts(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create admin account' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    const success = updateAdminStatus(adminId, !currentStatus);
    if (success) {
      loadAdminAccounts();
      setMessage({ 
        type: 'success', 
        text: `Admin account ${!currentStatus ? 'activated' : 'deactivated'} successfully` 
      });
    } else {
      setMessage({ type: 'error', text: 'Failed to update admin status' });
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (confirmDeleteId !== adminId) {
      setConfirmDeleteId(adminId);
      return;
    }
    setConfirmDeleteId(null);
    const success = deleteAdminAccount(adminId);
    if (success) {
      loadAdminAccounts();
      setMessage({ type: 'success', text: 'Admin account deleted successfully' });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete admin account' });
    }
  };

  return (
    <div className="admin-management-page">
      <div className="admin-management-container">
        <BackButton text="← Back" />
        
        <header className="page-header">
          <h1>Admin Management</h1>
          <p>Create and manage admin accounts</p>
          <button 
            className="create-admin-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New Admin
          </button>
        </header>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Create Admin Form Modal */}
        {showCreateForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Create New Admin Account</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="create-form">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={errors.username ? 'error' : ''}
                    placeholder="Enter username"
                  />
                  {errors.username && <span className="error-text">{errors.username}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="account">Account</label>
                  <input
                    type="text"
                    id="account"
                    name="account"
                    value={formData.account}
                    onChange={handleInputChange}
                    className={errors.account ? 'error' : ''}
                    placeholder="Enter account name"
                  />
                  {errors.account && <span className="error-text">{errors.account}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? 'error' : ''}
                    placeholder="Enter password"
                  />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="mobileNumber">Mobile Number</label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    className={errors.mobileNumber ? 'error' : ''}
                    placeholder="Enter mobile number"
                  />
                  {errors.mobileNumber && <span className="error-text">{errors.mobileNumber}</span>}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin Accounts Table with Infinite Scroll */}
        <div className="admin-table-section">
          <h2>Admin Accounts ({adminAccounts.length})</h2>
          
          <InfiniteScrollTable
            data={adminAccounts}
            itemsPerPage={8}
            emptyMessage="No admin accounts found. Create your first admin account to get started."
            columns={[
              { title: 'Username', className: 'username-col' },
              { title: 'Account', className: 'account-col' },
              { title: 'Mobile Number', className: 'mobile-col' },
              { title: 'Status', className: 'status-col' },
              { title: 'Created', className: 'date-col' },
              { title: 'Actions', className: 'actions-col' }
            ]}
            renderRow={(admin, index) => (
              <>
                <td className="username-cell">{admin.username}</td>
                <td className="account-cell">{admin.account}</td>
                <td className="mobile-cell">{admin.mobileNumber}</td>
                <td className="status-cell">
                  <span className={`status-badge ${admin.isActive ? 'active' : 'inactive'}`}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="date-cell">
                  {new Date(admin.createdAt).toLocaleDateString()}
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className={`action-btn ${admin.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleStatus(admin.id, admin.isActive)}
                      title={admin.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {admin.isActive ? '🔒' : '🔓'}
                    </button>
                    {confirmDeleteId === admin.id ? (
                      <div className="delete-confirm-inline">
                        <span>Confirm?</span>
                        <button className="action-btn delete confirm-yes-btn" onClick={() => handleDeleteAdmin(admin.id)}>Yes</button>
                        <button className="action-btn confirm-no-btn" onClick={() => setConfirmDeleteId(null)}>No</button>
                      </div>
                    ) : (
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        title="Delete Admin"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </>
            )}
            className="admin-management-table"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminManagementPage;