import React, { useState } from 'react';
import { apartmentPartsApi, handleApiError, dataTransformers } from '../../../services/api';
import { convertToApiEnum, getValidOptions } from '../../../utils/apiEnums';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import { uploadStudioPhotos, validateFiles } from '../../../services/uploadService';
import './AddStudioModal.css';

const AddStudioModal = ({ isOpen, apartmentId, onStudioAdded, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    area: '',
    monthly_price: '',
    bedrooms: 1,
    bathrooms: 'private',
    furnished: 'yes',
    balcony: 'no',
    description: '',
    photoFiles: [] // Store actual File objects
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  // Don't render if modal is not open or no apartment ID provided
  if (!isOpen || !apartmentId) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsUploadingPhotos(true);
    
    try {
      // Validate files before adding
      const validation = validateFiles(files, 10); // 10MB max per file
      if (!validation.valid) {
        setErrors(prev => ({
          ...prev,
          photos_url: validation.errors.join('; ')
        }));
        setIsUploadingPhotos(false);
        return;
      }
      
      // Store actual File objects for upload later
      setFormData(prev => ({
        ...prev,
        photoFiles: [...prev.photoFiles, ...files]
      }));

      // Clear error when user uploads photos
      if (errors.photos_url) {
        setErrors(prev => ({
          ...prev,
          photos_url: ''
        }));
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        photos_url: 'Error uploading photos. Please try again.'
      }));
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photoFiles: prev.photoFiles.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // REQUIRED: Studio title
    if (!formData.title || !formData.title.trim()) {
      newErrors.title = 'Studio title is required';
    }

    // REQUIRED: Area 
    if (!formData.area || !formData.area.toString().trim()) {
      newErrors.area = 'Area is required';
    } else if (isNaN(parseFloat(formData.area)) || parseFloat(formData.area) <= 0) {
      newErrors.area = 'Area must be a positive number';
    }

    // REQUIRED: Monthly price
    if (!formData.monthly_price || !formData.monthly_price.toString().trim()) {
      newErrors.monthly_price = 'Monthly price is required';
    } else if (isNaN(parseFloat(formData.monthly_price)) || parseFloat(formData.monthly_price) < 0) {
      newErrors.monthly_price = 'Monthly price must be a valid number';
    }

    // REQUIRED: Description
    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // REQUIRED: Validate enum fields have valid values
    if (!['private', 'shared'].includes(formData.bathrooms)) {
      newErrors.bathrooms = 'Bathroom type must be private or shared';
    }

    if (!['yes', 'no'].includes(formData.furnished)) {
      newErrors.furnished = 'Furnished status must be yes or no';
    }

    if (!['yes', 'shared', 'no'].includes(formData.balcony)) {
      newErrors.balcony = 'Balcony type must be yes, shared, or no';
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


      // FAILSAFE: Ensure we have minimum required data
      if (!formData.title?.trim() || !formData.area || !formData.monthly_price) {
        throw new Error(`Missing required studio data: title=${formData.title}, area=${formData.area}, monthly_price=${formData.monthly_price}`);
      }
      
      // Transform the data according to API requirements
      // REQUIRED FIELDS: title, area, monthly_price, bedrooms, bathrooms, furnished, balcony
      // NOTE: Photos are uploaded AFTER studio creation using /api/v1/uploads/photos
      const apiData = {
        title: formData.title?.trim() || 'Unnamed Studio', // REQUIRED - never empty
        area: (formData.area && formData.area.toString().trim()) || '25', // REQUIRED - never empty, default 25 sqm
        monthly_price: (formData.monthly_price && formData.monthly_price.toString().trim()) || '0', // REQUIRED - never empty
        bedrooms: parseInt(formData.bedrooms) || 1, // REQUIRED - always valid integer
        bathrooms: (['private', 'shared'].includes(formData.bathrooms)) ? formData.bathrooms : 'private', // REQUIRED - validated enum
        furnished: (['yes', 'no'].includes(formData.furnished)) ? formData.furnished : 'yes', // REQUIRED - validated enum
        balcony: (['yes', 'shared', 'no'].includes(formData.balcony)) ? formData.balcony : 'no', // REQUIRED - validated enum
        description: formData.description?.trim() || 'No description provided', // Optional
      };


      // STEP 1: Create the studio/part first
      const createdStudio = await apartmentPartsApi.create(apartmentId, apiData);
      
      // STEP 2: Upload photos if any were selected
      if (formData.photoFiles && formData.photoFiles.length > 0) {
        try {
          
          const uploadResult = await uploadStudioPhotos(
            createdStudio.id,
            formData.photoFiles
          );
          
          
          // Update the studio object with uploaded photo URLs
          if (uploadResult.files && uploadResult.files.length > 0) {
            createdStudio.photos_url = uploadResult.files.map(f => f.url);
          }
        } catch (uploadError) {
          console.error('⚠️ Photo upload failed:', uploadError);
          // Don't fail the entire operation if photo upload fails
          setErrors({ 
            general: `Studio created successfully, but photo upload failed: ${uploadError.message}` 
          });
        }
      }

      // Notify parent component
      if (onStudioAdded) {
        onStudioAdded(createdStudio);
      }
      
      // Close modal and reset form
      onClose();
      setFormData({
        title: '',
        area: '',
        monthly_price: '',
        bedrooms: 1,
        bathrooms: 'private',
        furnished: 'yes',
        balcony: 'no',
        description: '',
        photoFiles: []
      });
      setErrors({});
      
    } catch (error) {
      // Specific error messages based on error type
      let errorMessage = 'Failed to create studio';
      
      if (error.message === 'Network error' || error.message?.includes('CORS')) {
        errorMessage = '⚠️ Backend Connection Error: The backend server is not responding. Please check that the API is running and reachable.';
      } else if (error.status === 500) {
        errorMessage = '⚠️ Backend Server Error: The backend encountered an internal error. Check backend console logs for details.';
      } else {
        errorMessage = handleApiError(error, 'Failed to create studio');
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="add-studio-modal">
        <div className="modal-header">
          <h2>Add New Studio</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form className="studio-form" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Studio Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? 'error' : ''}
              placeholder="Modern Studio - Unit A-201"
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="area">Area (sqm) *</label>
              <input
                type="number"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className={errors.area ? 'error' : ''}
                placeholder="e.g., 45.5 (REQUIRED)"
                min="1"
                step="0.1"
                required
              />
              {errors.area && <span className="error-text">{errors.area}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="monthly_price">Monthly Price (EGP) *</label>
              <input
                type="number"
                id="monthly_price"
                name="monthly_price"
                value={formData.monthly_price}
                onChange={handleInputChange}
                className={errors.monthly_price ? 'error' : ''}
                placeholder="e.g., 3500.00 (REQUIRED)"
                min="0"
                step="0.01"
                required
              />
              {errors.monthly_price && <span className="error-text">{errors.monthly_price}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bedrooms">Bedrooms</label>
              <input
                type="number"
                id="bedrooms"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                min="1"
                placeholder="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bathrooms">Bathrooms</label>
              <select
                id="bathrooms"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
              >
                {getValidOptions.bathroomTypes().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="furnished">Furnished</label>
              <select
                id="furnished"
                name="furnished"
                value={formData.furnished}
                onChange={handleInputChange}
              >
                {getValidOptions.furnishedStatus().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="balcony">Balcony</label>
              <select
                id="balcony"
                name="balcony"
                value={formData.balcony}
                onChange={handleInputChange}
              >
                {getValidOptions.balconyTypes().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? 'error' : ''}
              placeholder="Cozy studio apartment with modern amenities..."
              rows="4"
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-group full-width">
            <label htmlFor="photos">Studio Photos (Optional)</label>
            <div className="photo-upload-container">
              <input
                type="file"
                id="photos"
                name="photos"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="photo-upload-input"
                disabled={isUploadingPhotos}
              />
              <label htmlFor="photos" className={`photo-upload-label ${isUploadingPhotos ? 'uploading' : ''}`}>
                {isUploadingPhotos ? (
                  <div className="upload-loading">
                    <LoadingSpinner size="small" color="primary" inline />
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">📸</div>
                    <div className="upload-text">
                      <strong>Click to upload photos (optional)</strong>
                      <span>or drag and drop</span>
                    </div>
                    <div className="upload-hint">PNG, JPG, GIF up to 10MB each</div>
                  </>
                )}
              </label>
            </div>
            {errors.photos_url && <span className="error-text">{errors.photos_url}</span>}
            
            {formData.photoFiles.length > 0 && (
              <div className="photo-preview-grid">
                {formData.photoFiles.map((file, index) => (
                  <div key={index} className="photo-preview-item">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Studio ${index + 1}`}
                      className="photo-preview-image"
                    />
                    <button
                      type="button"
                      className="photo-remove-btn"
                      onClick={() => removePhoto(index)}
                      title="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting || isUploadingPhotos}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" color="white" inline />
                  Adding Studio...
                </>
              ) : (
                'Add Studio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudioModal;
