/**
 * Photo Upload Service
 * Handles photo uploads to the backend using the correct /api/v1/uploads/photos endpoint
 * Based on PHOTO_UPLOAD_API.md specification
 */

import { API_BASE_URL } from './api.js';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  const tokenKey = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'api_access_token';
  return localStorage.getItem(tokenKey);
};

/**
 * Upload photos for apartments, parts, or rental contracts
 * 
 * @param {number} entityId - The ID of the entity (apartment, part, or rental contract)
 * @param {string} entityType - Type: 'rent', 'part', 'sale', or 'rental_contract'
 * @param {File[]} files - Array of File objects to upload
 * @param {string} documentType - Required for 'rental_contract': 'contract' or 'customer_id'
 * @returns {Promise<Object>} Upload response with file URLs
 * 
 * @example
 * // Upload rental apartment photos
 * const result = await uploadPhotos(123, 'rent', fileArray);
 * 
 * @example
 * // Upload studio/part photos
 * const result = await uploadPhotos(456, 'part', fileArray);
 * 
 * @example
 * // Upload sale apartment photos
 * const result = await uploadPhotos(789, 'sale', fileArray);
 * 
 * @example
 * // Upload rental contract document
 * const result = await uploadPhotos(101, 'rental_contract', fileArray, 'contract');
 */
export const uploadPhotos = async (entityId, entityType, files, documentType = null) => {
  // Validation
  if (!entityId || !entityType || !files || files.length === 0) {
    throw new Error('Missing required parameters: entityId, entityType, and files are required');
  }

  // Validate entity type
  const validEntityTypes = ['part', 'rent', 'sale', 'rental_contract'];
  if (!validEntityTypes.includes(entityType)) {
    throw new Error(`Invalid entity_type: ${entityType}. Must be one of: ${validEntityTypes.join(', ')}`);
  }

  // Validate document_type for rental_contract
  if (entityType === 'rental_contract') {
    if (!documentType) {
      throw new Error('document_type is required for rental_contract. Must be "contract" or "customer_id"');
    }
    if (!['contract', 'customer_id'].includes(documentType)) {
      throw new Error(`Invalid document_type: ${documentType}. Must be "contract" or "customer_id"`);
    }
  }

  // Get authentication token
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }

  // Create FormData
  const formData = new FormData();
  formData.append('entity_id', entityId.toString());
  formData.append('entity_type', entityType);
  
  // Add document_type if provided (for rental contracts)
  if (documentType) {
    formData.append('document_type', documentType);
  }

  // Append all files
  files.forEach((file) => {
    formData.append('files', file);
  });

  try {
    // Make upload request
    const response = await fetch(`${API_BASE_URL}/uploads/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // NOTE: Do NOT set Content-Type for FormData - browser sets it automatically with boundary
      },
      body: formData
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    
    
    return {
      success: true,
      data: result,
      files: result.files || [],
      count: result.count || 0,
      entityId: result.entity_id,
      entityType: result.entity_type
    };

  } catch (error) {
    console.error('❌ Photo upload error:', error);
    
    // Re-throw with more context
    throw new Error(
      error.message || 'Failed to upload photos. Please check your connection and try again.'
    );
  }
};

/**
 * Upload photos for rental apartments (entity_type: 'rent')
 * Convenience wrapper for uploadPhotos
 * 
 * @param {number} apartmentId - The rental apartment ID
 * @param {File[]} files - Array of File objects
 * @returns {Promise<Object>} Upload response
 */
export const uploadRentalApartmentPhotos = async (apartmentId, files) => {
  return uploadPhotos(apartmentId, 'rent', files);
};

/**
 * Upload photos for sale apartments (entity_type: 'sale')
 * Convenience wrapper for uploadPhotos
 * 
 * @param {number} apartmentId - The sale apartment ID
 * @param {File[]} files - Array of File objects
 * @returns {Promise<Object>} Upload response
 */
export const uploadSaleApartmentPhotos = async (apartmentId, files) => {
  return uploadPhotos(apartmentId, 'sale', files);
};

/**
 * Upload photos for apartment parts/studios (entity_type: 'part')
 * Convenience wrapper for uploadPhotos
 * 
 * @param {number} partId - The apartment part/studio ID
 * @param {File[]} files - Array of File objects
 * @returns {Promise<Object>} Upload response
 */
export const uploadStudioPhotos = async (partId, files) => {
  return uploadPhotos(partId, 'part', files);
};

/**
 * Upload contract document (entity_type: 'rental_contract', document_type: 'contract')
 * Convenience wrapper for uploadPhotos
 * 
 * @param {number} contractId - The rental contract ID
 * @param {File[]} files - Array of File objects (PDFs, images)
 * @returns {Promise<Object>} Upload response
 */
export const uploadContractDocument = async (contractId, files) => {
  return uploadPhotos(contractId, 'rental_contract', files, 'contract');
};

/**
 * Upload customer ID document (entity_type: 'rental_contract', document_type: 'customer_id')
 * Convenience wrapper for uploadPhotos
 * 
 * @param {number} contractId - The rental contract ID
 * @param {File[]} files - Array of File objects (ID photos/scans)
 * @returns {Promise<Object>} Upload response
 */
export const uploadCustomerIdDocument = async (contractId, files) => {
  return uploadPhotos(contractId, 'rental_contract', files, 'customer_id');
};

/**
 * Remove one photo (or one contract document) from an item and delete the file from storage.
 *
 * @param {string} entityType - 'rent' | 'sale' | 'part' | 'rental_contract'
 * @param {number} entityId
 * @param {string} url - photo URL to remove (ignored for rental_contract)
 * @param {string} documentType - 'contract' | 'customer_id' (rental_contract only)
 */
export const deletePhoto = async (entityType, entityId, url = null, documentType = null) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }

  const params = new URLSearchParams({ entity_type: entityType, entity_id: String(entityId) });
  if (url) params.set('url', url);
  if (documentType) params.set('document_type', documentType);

  const response = await fetch(`${API_BASE_URL}/uploads/photos?${params}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Delete failed' }));
    throw new Error(errorData.detail || `Delete failed with status ${response.status}`);
  }
  return response.json();
};

/**
 * Get a short-lived URL for opening a private file (contract / customer ID scans).
 * Public listing photos can be used directly and don't need this.
 */
export const getSignedUrl = async (url, expiresIn = 900) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }
  const params = new URLSearchParams({ url, expires_in: String(expiresIn) });
  const response = await fetch(`${API_BASE_URL}/uploads/signed-url?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Could not get file link' }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }
  return (await response.json()).url;
};

/**
 * Validate file before upload
 * 
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum file size in MB (default: 10)
 * @returns {Object} Validation result { valid: boolean, error: string }
 */
export const validateFile = (file, maxSizeMB = 10) => {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)` 
    };
  }

  // Check file type (images and PDFs)
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, GIF, WEBP, PDF` 
    };
  }

  return { valid: true };
};

/**
 * Validate multiple files before upload
 * 
 * @param {File[]} files - Array of files to validate
 * @param {number} maxSizeMB - Maximum file size per file in MB
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export const validateFiles = (files, maxSizeMB = 10) => {
  const errors = [];

  if (!files || files.length === 0) {
    return { valid: false, errors: ['No files provided'] };
  }

  files.forEach((file, index) => {
    const result = validateFile(file, maxSizeMB);
    if (!result.valid) {
      errors.push(`File ${index + 1} (${file.name}): ${result.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  uploadPhotos,
  uploadRentalApartmentPhotos,
  uploadSaleApartmentPhotos,
  uploadStudioPhotos,
  uploadContractDocument,
  uploadCustomerIdDocument,
  deletePhoto,
  getSignedUrl,
  validateFile,
  validateFiles
};
