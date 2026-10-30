import React, { useState } from 'react';
import { getValidOptions } from '../../../utils/apiEnums';
import { formatPhoneForAPI, validateEgyptianPhone, normalizePhoneInput } from '../../../utils/phoneUtils';
import './BookingModal.css';

const BookingModal = ({ isOpen, onClose, studio, onBookingSubmit, editMode = false, initialData = null }) => {
  const [formData, setFormData] = useState({
    customerName: initialData?.customer_name || initialData?.customerName || '',
    customerPhone: initialData?.customer_phone || initialData?.customerPhone || '',
    customerId: initialData?.customer_id_number || initialData?.customerId || '',
    contract: null,
    paidDeposit: initialData?.paid_deposit || initialData?.paidDeposit || '',
    warranty: initialData?.warrant_amount || initialData?.warranty || '',
    rentPeriod: initialData?.rent_period || initialData?.rentPeriod || '',
    platformSource: initialData?.how_did_customer_find_us || initialData?.platformSource || '',
    startDate: initialData?.rent_start_date || initialData?.startDate || '',
    endDate: initialData?.rent_end_date || initialData?.endDate || '',
    commission: initialData?.commission || '0'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use proper enum values for platform sources from API documentation
  const platformOptions = getValidOptions.customerSources();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Handle phone number input without requiring +2 prefix
    if (name === 'customerPhone') {
      processedValue = normalizePhoneInput(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        contract: file
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else {
      const phoneValidation = validateEgyptianPhone(formData.customerPhone);
      if (!phoneValidation.isValid) {
        newErrors.customerPhone = phoneValidation.error;
      }
    }

    if (!formData.customerId.trim()) {
      newErrors.customerId = 'Customer ID is required';
    }

    if (!formData.paidDeposit.trim()) {
      newErrors.paidDeposit = 'Paid deposit is required';
    } else if (isNaN(formData.paidDeposit) || parseFloat(formData.paidDeposit) < 0) {
      newErrors.paidDeposit = 'Please enter a valid deposit amount';
    }

    if (!formData.warranty.trim()) {
      newErrors.warranty = 'Warranty amount is required';
    } else if (isNaN(formData.warranty) || parseFloat(formData.warranty) < 0) {
      newErrors.warranty = 'Please enter a valid warranty amount';
    }

    if (!formData.rentPeriod.trim()) {
      newErrors.rentPeriod = 'Rent period is required';
    }

    if (!formData.platformSource) {
      newErrors.platformSource = 'Platform source is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData = {
        id: editMode ? initialData?.id : `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        studioId: studio.id,
        studioTitle: studio.title,
        studioPrice: studio.price,
        customerName: formData.customerName.trim(),
        customerPhone: formatPhoneForAPI(formData.customerPhone.trim()),
        customerId: formData.customerId.trim(),
        contract: formData.contract,
        paidDeposit: parseFloat(formData.paidDeposit),
        warranty: parseFloat(formData.warranty),
        rentPeriod: formData.rentPeriod.trim(),
        commission: parseFloat(formData.commission) || 0,
        how_did_customer_find_us: formData.platformSource, // API field name
        startDate: formData.startDate,
        endDate: formData.endDate,
        bookingDate: editMode ? (initialData?.created_at || initialData?.bookingDate) : new Date().toISOString(),
        totalAmount: parseFloat(formData.paidDeposit) + parseFloat(formData.warranty)
      };

      onBookingSubmit(bookingData, editMode);
      
      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        customerId: '',
        contract: null,
        paidDeposit: '',
        warranty: '',
        rentPeriod: '',
        platformSource: '',
        startDate: '',
        endDate: ''
      });
      
      onClose();
    } catch (error) {
setErrors({ general: 'An error occurred while submitting the booking. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="booking-modal">
        <div className="modal-header">
          <h2>{editMode ? '✏️ Edit Booking' : '📋 Book Studio'}: {studio?.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerName">Customer Name *</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className={errors.customerName ? 'error' : ''}
                placeholder="Enter customer full name"
              />
              {errors.customerName && <span className="error-text">{errors.customerName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="customerPhone">Phone Number (without +2) *</label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                className={errors.customerPhone ? 'error' : ''}
                placeholder="01012345678 (11 digits)"
                maxLength="11"
                inputMode="numeric"
              />
              {errors.customerPhone && <span className="error-text">{errors.customerPhone}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerId">Customer ID *</label>
              <input
                type="text"
                id="customerId"
                name="customerId"
                value={formData.customerId}
                onChange={handleInputChange}
                className={errors.customerId ? 'error' : ''}
                placeholder="National ID or Passport number"
              />
              {errors.customerId && <span className="error-text">{errors.customerId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="platformSource">How did customer find us? *</label>
              <select
                id="platformSource"
                name="platformSource"
                value={formData.platformSource}
                onChange={handleInputChange}
                className={errors.platformSource ? 'error' : ''}
              >
                <option value="">Select platform</option>
                {platformOptions.map(platform => (
                  <option key={platform.value} value={platform.value}>{platform.label}</option>
                ))}
              </select>
              {errors.platformSource && <span className="error-text">{errors.platformSource}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="paidDeposit">Paid Deposit (EGP) *</label>
              <input
                type="number"
                id="paidDeposit"
                name="paidDeposit"
                value={formData.paidDeposit}
                onChange={handleInputChange}
                className={errors.paidDeposit ? 'error' : ''}
                placeholder="5000"
                min="0"
                step="0.01"
              />
              {errors.paidDeposit && <span className="error-text">{errors.paidDeposit}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="warranty">Warranty Amount (EGP) *</label>
              <input
                type="number"
                id="warranty"
                name="warranty"
                value={formData.warranty}
                onChange={handleInputChange}
                className={errors.warranty ? 'error' : ''}
                placeholder="2000"
                min="0"
                step="0.01"
              />
              {errors.warranty && <span className="error-text">{errors.warranty}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Rent Start Date *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={errors.startDate ? 'error' : ''}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.startDate && <span className="error-text">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Rent End Date *</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={errors.endDate ? 'error' : ''}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
              {errors.endDate && <span className="error-text">{errors.endDate}</span>}
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="rentPeriod">Rent Period Description *</label>
            <input
              type="text"
              id="rentPeriod"
              name="rentPeriod"
              value={formData.rentPeriod}
              onChange={handleInputChange}
              className={errors.rentPeriod ? 'error' : ''}
              placeholder="e.g., 12 months, 6 months, etc."
            />
            {errors.rentPeriod && <span className="error-text">{errors.rentPeriod}</span>}
          </div>

          <div className="form-group full-width">
            <label htmlFor="contract">Upload Contract (PDF, DOC, DOCX)</label>
            <input
              type="file"
              id="contract"
              name="contract"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="file-input"
            />
            {formData.contract && (
              <div className="file-info">
                📄 {formData.contract.name}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Booking...' : 'Create Booking & Generate Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;