import React, { useState } from 'react';
import { useMasterAuth } from '../../../hooks/useRedux';
import { usePropertyManagement } from '../../../hooks/usePropertyManagement';
import { uploadSaleApartmentPhotos, validateFiles } from '../../../services/uploadService';
import './AddSaleApartmentModal.css';
import useUniqueId from '../../../hooks/useUniqueId';

const AddSaleApartmentModal = ({ isOpen, onApartmentAdded, onClose }) => {
  const { currentUser } = useMasterAuth();
  const { createSaleApartment } = usePropertyManagement();
  const { generateApartmentId } = useUniqueId();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    description: '',
    price: '',
    bedrooms: '',
    bathrooms: 'private', // REQUIRED enum: must be 'private' or 'shared', not empty string
    area: '',
    apartmentNumber: '',
    floor: '',
    mapUrl: '',
    facilities: [],
    contactNumber: '',
    photoFiles: [] // Store actual File objects
  });

  const [facilityInput, setFacilityInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't render if modal is not open
  if (!isOpen) return null;

  // Helper function to validate URL
  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const commonFacilities = [
    'Swimming Pool', 'Gym', 'Security', 'Parking', 'Garden', 
    'Concierge', 'Spa', 'Business Center', 'Rooftop Pool', 
    'Children\'s Area', 'Community Center', 'Valet Parking',
    'Balcony', 'Central AC', 'Built-in Kitchen', 'Master Bedroom',
    'Walk-in Closet', 'Elevator', 'Laundry Room', 'Storage Room'
  ];

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

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files before adding
    const validation = validateFiles(files, 10); // 10MB max per file
    if (!validation.valid) {
      setErrors(prev => ({
        ...prev,
        photos: validation.errors.join('; ')
      }));
      return;
    }
    
    // Store actual File objects for upload later
    setFormData(prev => ({
      ...prev,
      photoFiles: [...prev.photoFiles, ...files]
    }));

    // Clear error when user uploads photos
    if (errors.photos) {
      setErrors(prev => ({
        ...prev,
        photos: ''
      }));
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photoFiles: prev.photoFiles.filter((_, i) => i !== index)
    }));
  };

  const addFacility = (facility) => {
    if (facility && !formData.facilities.includes(facility)) {
      setFormData(prev => ({
        ...prev,
        facilities: [...prev.facilities, facility]
      }));
      setFacilityInput('');
    }
  };

  const removeFacility = (facilityToRemove) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.filter(facility => facility !== facilityToRemove)
    }));
  };

  const handleFacilityInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFacility(facilityInput);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate required fields with proper API field names
    if (!formData.name?.trim()) {
      newErrors.name = 'Apartment name is required (API field: name)';
    }

    if (!formData.location?.trim()) {
      newErrors.location = 'Location is required (API field: location)';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required (API field: address)';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.price?.toString().trim()) {
      newErrors.price = 'Price is required (API expects string)';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price (positive number)';
    }

    if (!formData.bedrooms?.toString().trim()) {
      newErrors.bedrooms = 'Number of bedrooms is required (API expects integer)';
    } else if (isNaN(Number(formData.bedrooms)) || Number(formData.bedrooms) <= 0 || !Number.isInteger(Number(formData.bedrooms))) {
      newErrors.bedrooms = 'Please enter a valid number of bedrooms (positive integer)';
    }

    // CRITICAL: bathrooms must be enum string 'private' or 'shared', not a number
    if (!formData.bathrooms || (formData.bathrooms !== 'private' && formData.bathrooms !== 'shared')) {
      newErrors.bathrooms = 'Bathroom type must be either "private" or "shared" (API enum requirement)';
    } else {

    }

    if (!formData.area?.toString().trim()) {
      newErrors.area = 'Area is required (API field: area, expects string)';
    } else if (isNaN(Number(formData.area)) || Number(formData.area) <= 0) {
      newErrors.area = 'Please enter a valid area (positive number)';
    }

    if (!formData.apartmentNumber?.trim()) {
      newErrors.apartmentNumber = 'Apartment number is required (API field: number)';
    } else if (formData.apartmentNumber.trim().length < 1) {
      newErrors.apartmentNumber = 'Apartment number cannot be empty';
    }

    // Floor is optional for sale apartments (not in backend schema requirements)
    // But still validate if provided
    if (formData.floor && formData.floor.trim() && isNaN(parseInt(formData.floor))) {
      newErrors.floor = 'Floor must be a valid number if provided';
    }

    // Photos are now optional - no validation required
    // if (formData.photos.length === 0) {
    //   newErrors.photos = 'At least one photo is required for the apartment';
    // }

    if (!formData.contactNumber?.trim()) {
      newErrors.contactNumber = 'Contact number is required (used for WhatsApp integration)';
    } else if (!/^(\+201|01)[0-9]{9}$/.test(formData.contactNumber.trim())) {
      newErrors.contactNumber = 'Please enter a valid Egyptian mobile number (format: +201XXXXXXXXX or 01XXXXXXXXX)';
    } else {

    }

    // Validate mapUrl if provided (optional field)
    if (formData.mapUrl.trim() && !isValidUrl(formData.mapUrl)) {
      newErrors.mapUrl = 'Please enter a valid URL (must start with http:// or https://)';
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
      // Transform frontend data to match EXACT API requirements according to documentation
      // CRITICAL: Sale apartments have DIFFERENT schema than rent apartments
      // REQUIRED FIELDS for sale: name, location, address, area, number, price, bedrooms, bathrooms
      // NOTE: Photos are uploaded AFTER apartment creation using /api/v1/uploads/photos
      const apiData = {
        // === REQUIRED FIELDS ===
        name: formData.name.trim(), // API expects 'name', not 'title'
        location: formData.location.trim(),
        address: formData.address.trim(), // Full address string
        area: formData.area.toString(), // API expects string (decimal)
        number: formData.apartmentNumber.trim(), // API field is 'number' (e.g., "A-301")
        price: formData.price.toString(), // API expects string (decimal), NOT number
        bedrooms: parseInt(formData.bedrooms), // API expects integer
        bathrooms: formData.bathrooms, // API expects enum string: 'private' or 'shared' ONLY
        
        // === OPTIONAL FIELDS ===
        description: formData.description.trim() || null, // Optional description text
        location_on_map: formData.mapUrl ? formData.mapUrl.trim() : null, // Google Maps URL
        facilities_amenities: formData.facilities && formData.facilities.length > 0 
          ? formData.facilities.join(', ') 
          : null // API expects comma-separated string, not array
      };

      // STEP 1: Create the apartment first
      const result = await createSaleApartment(apiData);
      
      if (result.success) {
        const createdApartment = result.apartment;
        
        // STEP 2: Upload photos if any were selected
        if (formData.photoFiles && formData.photoFiles.length > 0) {
          try {
            
            const uploadResult = await uploadSaleApartmentPhotos(
              createdApartment.id,
              formData.photoFiles
            );
            
            
            // Update the apartment object with uploaded photo URLs
            if (uploadResult.files && uploadResult.files.length > 0) {
              createdApartment.photos_url = uploadResult.files.map(f => f.url);
            }
          } catch (uploadError) {
            console.error('⚠️ Photo upload failed:', uploadError);
            // Don't fail the entire operation if photo upload fails
            setErrors({ 
              general: `Apartment created successfully, but photo upload failed: ${uploadError.message}` 
            });
          }
        }

        // Notify parent component with the created apartment
        onApartmentAdded?.(createdApartment);
        onClose();
        
        // Reset form
        setFormData({
          name: '',
          location: '',
          address: '',
          description: '',
          price: '',
          bedrooms: '',
          bathrooms: 'private', // Reset to default enum value
          area: '',
          apartmentNumber: '',
          floor: '',
          mapUrl: '',
          facilities: [],
          contactNumber: '',
          photoFiles: []
        });
        
        setErrors({});

      } else {
        setErrors({ general: result.message || 'Failed to create apartment. Please try again.' });
      }
      
    } catch (error) {
      const errorMessage = error.message || 'An error occurred while adding the apartment. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);

    }
  };

  return (
    <div className="modal-overlay">
      <div className="add-sale-apartment-modal">
        <div className="modal-header">
          <h2>Add New Apartment for Sale</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form className="sale-apartment-form" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Apartment Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? 'error' : ''}
              placeholder="e.g., Luxury 3BR Apartment in New Cairo"
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={errors.location ? 'error' : ''}
                placeholder="e.g., Nasr City - Zone 5"
              />
              {errors.location && <span className="error-text">{errors.location}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={errors.address ? 'error' : ''}
                placeholder="e.g., 90th Street, Maadi"
              />
              {errors.address && <span className="error-text">{errors.address}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="area">Area (sq ft) *</label>
              <input
                type="number"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className={errors.area ? 'error' : ''}
                placeholder="e.g., 1500"
                min="1"
              />
              {errors.area && <span className="error-text">{errors.area}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="apartmentNumber">Apartment Number *</label>
              <input
                type="text"
                id="apartmentNumber"
                name="apartmentNumber"
                value={formData.apartmentNumber}
                onChange={handleInputChange}
                className={errors.apartmentNumber ? 'error' : ''}
                placeholder="e.g., A-301"
              />
              {errors.apartmentNumber && <span className="error-text">{errors.apartmentNumber}</span>}
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
                placeholder="e.g., Ground Floor, 1st Floor, 2nd Floor"
              />
              {errors.floor && <span className="error-text">{errors.floor}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (EGP) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={errors.price ? 'error' : ''}
                placeholder="e.g., 2500000"
                min="1"
              />
              {errors.price && <span className="error-text">{errors.price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="bedrooms">Bedrooms *</label>
              <input
                type="number"
                id="bedrooms"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                className={errors.bedrooms ? 'error' : ''}
                placeholder="e.g., 3"
                min="1"
              />
              {errors.bedrooms && <span className="error-text">{errors.bedrooms}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bathrooms">Bathroom Type *</label>
              <select
                id="bathrooms"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                className={errors.bathrooms ? 'error' : ''}
              >
                <option value="private">Private</option>
                <option value="shared">Shared</option>
              </select>
              {errors.bathrooms && <span className="error-text">{errors.bathrooms}</span>}
              <small className="form-help">Select bathroom type for this apartment</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? 'error' : ''}
              placeholder="Describe the apartment, its features, and unique selling points..."
              rows="4"
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="mapUrl">Google Maps Link</label>
            <input
              type="url"
              id="mapUrl"
              name="mapUrl"
              value={formData.mapUrl}
              onChange={handleInputChange}
              className={errors.mapUrl ? 'error' : ''}
              placeholder="e.g., https://maps.google.com/..."
            />
            {errors.mapUrl && <span className="error-text">{errors.mapUrl}</span>}
            <small className="form-help">
              Optional: Paste the Google Maps link for the apartment location
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="contactNumber">Contact Number *</label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              className={errors.contactNumber ? 'error' : ''}
              placeholder="e.g., +201012345678 or 01012345678"
            />
            {errors.contactNumber && <span className="error-text">{errors.contactNumber}</span>}
            <div className="contact-hint">
              This number will be used for WhatsApp contact button for inquiries about this apartment.
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="photos">Apartment Photos (Optional)</label>
            <div className="photo-upload-container">
              <input
                type="file"
                id="photos"
                name="photos"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="photo-upload-input"
              />
              <label htmlFor="photos" className="photo-upload-label">
                <div className="upload-icon">🏠</div>
                <div className="upload-text">
                  <strong>Click to upload apartment photos (optional)</strong>
                  <span>or drag and drop</span>
                </div>
                <div className="upload-hint">PNG, JPG, GIF up to 10MB each</div>
              </label>
            </div>
            {errors.photos && <span className="error-text">{errors.photos}</span>}
            
            {formData.photoFiles.length > 0 && (
              <div className="photo-preview-grid">
                {formData.photoFiles.map((file, index) => (
                  <div key={index} className="photo-preview-item">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Apartment ${index + 1}`}
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
                    <div className="photo-name">{file.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="facilities">Facilities & Amenities</label>
            
            <div className="facility-input-section">
              <input
                type="text"
                value={facilityInput}
                onChange={(e) => setFacilityInput(e.target.value)}
                onKeyPress={handleFacilityInputKeyPress}
                placeholder="Type a facility and press Enter"
                className="facility-input"
              />
              <button 
                type="button" 
                onClick={() => addFacility(facilityInput)}
                className="add-facility-btn"
              >
                Add
              </button>
            </div>

            <div className="common-facilities">
              <p>Common facilities:</p>
              <div className="facility-suggestions">
                {commonFacilities.map(facility => (
                  <button
                    key={facility}
                    type="button"
                    className="facility-suggestion"
                    onClick={() => addFacility(facility)}
                    disabled={formData.facilities.includes(facility)}
                  >
                    {facility}
                  </button>
                ))}
              </div>
            </div>

            <div className="selected-facilities">
              {formData.facilities.map(facility => (
                <div key={facility} className="selected-facility">
                  <span>{facility}</span>
                  <button
                    type="button"
                    onClick={() => removeFacility(facility)}
                    className="remove-facility"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Apartment...' : 'Add Apartment for Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSaleApartmentModal;
