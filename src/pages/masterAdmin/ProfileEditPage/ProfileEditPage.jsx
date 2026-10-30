import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMasterAuth } from '../../../hooks/useRedux';
import BackButton from '../../../components/common/BackButton/BackButton';
import './ProfileEditPage.css';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, logout, getCurrentUserProfile } = useMasterAuth();
  const userProfile = getCurrentUserProfile();
  const [formData, setFormData] = useState({
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load saved form data on component mount
  useEffect(() => {
    const savedForm = localStorage.getItem('profileEditForm');
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        setFormData(prev => ({
          ...prev,
          email: parsed.email || currentUser?.email || '',
          // Don't restore passwords for security
        }));
      } catch (error) {
}
    }
  }, [currentUser]);

  // Save form data to localStorage (excluding passwords)
  useEffect(() => {
    const formToSave = {
      email: formData.email,
      // Don't save passwords
    };
    localStorage.setItem('profileEditForm', JSON.stringify(formToSave));
  }, [formData.email]);

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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const result = await updateProfile(
        formData.email,
        formData.currentPassword,
        formData.newPassword || null
      );

      if (result.success) {
        setMessage({ type: 'success', text: result.message + ' Redirecting to login...' });
        
        // Clear saved form data
        localStorage.removeItem('profileEditForm');
        
        // Clear form passwords
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));

        // Logout and redirect after successful update
        setTimeout(() => {
          logout();
          navigate('/master-admin/login');
        }, 2000);
        
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Update failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-edit-page">
      <div className="profile-edit-container">
        <BackButton text="← Back" />
        
        <header className="profile-header">
          <h1>Edit Profile</h1>
          <p>Update your master admin account settings</p>
        </header>

        <form onSubmit={handleSubmit} className="profile-form">
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              className={errors.currentPassword ? 'error' : ''}
              placeholder="Enter current password"
            />
            {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
          </div>

          <div className="password-section">
            <h3>Change Password (Optional)</h3>
            <p className="section-hint">Leave blank if you don't want to change your password</p>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className={errors.newPassword ? 'error' : ''}
                placeholder="Enter new password (optional)"
              />
              {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Confirm new password"
                disabled={!formData.newPassword}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="update-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>

        <div className="account-info">
          <h3>Account Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Account ID:</label>
              <span>{userProfile?.id || currentUser?.id}</span>
            </div>
            <div className="info-item">
              <label>Role:</label>
              <span>Master Admin</span>
            </div>
            <div className="info-item">
              <label>Current Email:</label>
              <span>{userProfile?.email || currentUser?.email}</span>
            </div>
            <div className="info-item">
              <label>Account Created:</label>
              <span>{userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Last Updated:</label>
              <span>{userProfile?.updatedAt ? new Date(userProfile.updatedAt).toLocaleString() : 'Never'}</span>
            </div>
            <div className="info-item">
              <label>Login Time:</label>
              <span>{userProfile?.loginTime ? new Date(userProfile.loginTime).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;