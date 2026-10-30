import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import BackButton from '../../../components/common/BackButton';
import AYGLogo from '../../../assets/images/logo/AYG.png';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useAdminAuth();
  const [formData, setFormData] = useState({
    accountOrMobile: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (loginError) {
      setLoginError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.accountOrMobile.trim()) {
      newErrors.accountOrMobile = 'Email, account or mobile number is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setLoginError('');

    try {
      const result = await loginAdmin(formData.accountOrMobile, formData.password);
      
      if (result.success) {
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setLoginError(result.message);
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="brand">
              <img src={AYGLogo} alt="AYG logo" className="brand-logo" />
              <span className="brand-text">AYG</span>
            </div>
            <h1>Admin Login</h1>
            <p>Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {loginError && (
              <div className="error-message">
                {loginError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="accountOrMobile">Email, Account or Mobile Number</label>
              <input
                type="text"
                id="accountOrMobile"
                name="accountOrMobile"
                value={formData.accountOrMobile}
                onChange={handleInputChange}
                className={errors.accountOrMobile ? 'error' : ''}
                placeholder="Enter your email, account or mobile number"
                autoComplete="username"
              />
              {errors.accountOrMobile && (
                <span className="error-text">{errors.accountOrMobile}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  👁️
                </button>
              </div>
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <div className="login-links">
              <BackButton 
                text="← Back to Admin Portal" 
                onClick={() => navigate('/admin')}
              />
            </div>
            
            <div className="login-info">
              <p>Don't have an admin account?</p>
              <p>Contact the master administrator to create one for you.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;