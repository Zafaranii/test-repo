import React, { useState } from 'react';
import { validateFiles } from '../../../services/uploadService';
import './EditStudioModal.css';

const EditStudioModal = ({ studio, apartmentId, onStudioUpdated, onClose }) => {
  const [formData, setFormData] = useState({
    title: studio.title || '',
    area: studio.area || '',
    floor: studio.floor || '',
    unitNumber: studio.unitNumber || '',
    price: studio.price || '',
    pricePerMonth: studio.pricePerMonth || 0,
    bedrooms: studio.bedrooms?.toString() || '1',
    bathrooms: studio.bathrooms?.toString() || '1',
    furnished: studio.furnished || 'Yes',
    description: studio.description || '',
    location: studio.location || '',
    balcony: studio.details?.balcony || 'Yes',
    parking: studio.details?.parking || 'Available',
    isAvailable: studio.isAvailable
  });

  // Photos already stored for this studio (URLs from the API) and files picked in this session.
  // Removed URLs are dropped from photos_url on save; the backend then deletes them from storage.
  const [existingPhotos, setExistingPhotos] = useState(studio.photos_url || []);
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Update pricePerMonth when price changes
    if (name === 'price') {
      const numericPrice = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        price: value,
        pricePerMonth: parseInt(numericPrice) || 0
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleNewPhotos = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (files.length === 0) return;
    const validation = validateFiles(files, 10);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, photos_url: validation.errors.join('; ') }));
      return;
    }
    setErrors(prev => ({ ...prev, photos_url: '' }));
    setNewPhotoFiles(prev => [...prev, ...files]);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title?.toString().trim()) {
      newErrors.title = 'Studio title is required';
    }

    if (!formData.area?.toString().trim()) {
      newErrors.area = 'Area is required';
    }

    if (!formData.floor?.toString().trim()) {
      newErrors.floor = 'Floor is required';
    }

    if (!formData.unitNumber?.toString().trim()) {
      newErrors.unitNumber = 'Unit number is required';
    }

    if (!formData.price?.toString().trim()) {
      newErrors.price = 'Price is required';
    }

    if (!formData.description?.toString().trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.location?.toString().trim()) {
      newErrors.location = 'Location is required';
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
      // Transform data to match backend API schema
      const updatedStudio = {
        // Backend required fields with correct types
        title: String(formData.title).trim(),
        area: parseFloat(String(formData.area).replace(/[^0-9.]/g, '')) || 0,
        floor: parseInt(String(formData.floor).replace(/[^0-9]/g, '')) || 1,
        monthly_price: parseFloat(String(formData.price).replace(/[^0-9.]/g, '')) || 0,
        bedrooms: parseInt(formData.bedrooms) || 1,
        // Backend enum values (lowercase)
        bathrooms: formData.bathrooms === '1' ? 'private' : 'shared',
        furnished: formData.furnished === 'Yes' ? 'yes' : 'no',
        balcony: formData.balcony === 'Yes' ? 'yes' : (formData.balcony === 'Shared' ? 'shared' : 'no'),
        // Optional fields
        description: String(formData.description || '').trim(),
        status: formData.isAvailable ? 'available' : 'rented',
        photos_url: existingPhotos
      };

      await onStudioUpdated(updatedStudio, newPhotoFiles);
    } catch (error) {
setErrors({ general: 'An error occurred while updating the studio. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-studio-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Studio</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form className="studio-form" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Studio Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={errors.title ? 'error' : ''}
                placeholder="e.g., Premium Studio - Unit A"
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="unitNumber">Unit Number *</label>
              <input
                type="text"
                id="unitNumber"
                name="unitNumber"
                value={formData.unitNumber}
                onChange={handleInputChange}
                className={errors.unitNumber ? 'error' : ''}
                placeholder="e.g., A-301"
              />
              {errors.unitNumber && <span className="error-text">{errors.unitNumber}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="area">Area *</label>
              <input
                type="text"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className={errors.area ? 'error' : ''}
                placeholder="e.g., 50 sqm"
              />
              {errors.area && <span className="error-text">{errors.area}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="floor">Floor *</label>
              <input
                type="text"
                id="floor"
                name="floor"
                value={formData.floor}
                onChange={handleInputChange}
                className={errors.floor ? 'error' : ''}
                placeholder="e.g., 3rd Floor"
              />
              {errors.floor && <span className="error-text">{errors.floor}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Monthly Price (EGP) *</label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={errors.price ? 'error' : ''}
                placeholder="e.g., 15,000"
              />
              {errors.price && <span className="error-text">{errors.price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="bedrooms">Bedrooms</label>
              <select
                id="bedrooms"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bathrooms">Bathrooms</label>
              <select
                id="bathrooms"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="furnished">Furnished</label>
              <select
                id="furnished"
                name="furnished"
                value={formData.furnished}
                onChange={handleInputChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Semi-furnished">Semi-furnished</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="balcony">Balcony</label>
              <select
                id="balcony"
                name="balcony"
                value={formData.balcony}
                onChange={handleInputChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="parking">Parking</label>
              <select
                id="parking"
                name="parking"
                value={formData.parking}
                onChange={handleInputChange}
              >
                <option value="Available">Available</option>
                <option value="Valet">Valet</option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={errors.location ? 'error' : ''}
              placeholder="e.g., New Cairo, Cairo Governorate"
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? 'error' : ''}
              placeholder="Describe the studio features, amenities, and unique selling points..."
              rows="4"
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-group full-width">
            <label htmlFor="edit-photos">Photos</label>
            <input
              type="file"
              id="edit-photos"
              multiple
              accept="image/*"
              onChange={handleNewPhotos}
            />
            {errors.photos_url && <span className="error-text">{errors.photos_url}</span>}
            {(existingPhotos.length > 0 || newPhotoFiles.length > 0) && (
              <div className="photo-preview-grid">
                {existingPhotos.map((url) => (
                  <div key={url} className="photo-preview-item">
                    <img src={url} alt="Studio" className="photo-preview-image" />
                    <button
                      type="button"
                      className="photo-remove-btn"
                      title="Remove photo (deleted when you save)"
                      onClick={() => setExistingPhotos(prev => prev.filter(u => u !== url))}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {newPhotoFiles.map((file, index) => (
                  <div key={`new-${index}`} className="photo-preview-item">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="photo-preview-image" />
                    <button
                      type="button"
                      className="photo-remove-btn"
                      title="Remove"
                      onClick={() => setNewPhotoFiles(prev => prev.filter((_, i) => i !== index))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleInputChange}
              />
              <span className="checkbox-text">Studio is available for rent</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Updating Studio...' : 'Update Studio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudioModal;