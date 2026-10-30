/**
 * AO Real Estate API Service
 * Handles all backend communication with JWT authentication
 * Configuration loaded from environment variables
 */

// Import enum constants for proper API value mapping
import { convertToApiEnum, convertFromApiEnum, validateEnum, LOCATIONS, BATHROOM_TYPES, FURNISHED_STATUS, BALCONY_TYPES, CUSTOMER_SOURCES, ADMIN_ROLES, PART_STATUS } from '../utils/apiEnums.js';

// Base URL of the backend API. Defaults to same-origin "/api/v1", which the Vite dev server
// and the production server (server.js) both proxy to the backend. Set VITE_API_BASE_URL at
// build time only when the API is hosted on a different origin.
const env = import.meta.env;
const API_BASE_URL = (env.VITE_API_BASE_URL || '/api/v1').trim().replace(/\/$/, '');

// API Configuration from environment variables only
const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: parseInt(env.VITE_API_TIMEOUT) || 10000,
  HEADERS: {
    'Content-Type': 'application/json'
  },
  ENVIRONMENT: env.VITE_ENVIRONMENT || env.MODE,
  ENABLE_LOGGING: env.VITE_ENABLE_API_LOGGING === 'true',
  ENABLE_RETRY: env.VITE_ENABLE_RETRY_LOGIC !== 'false',
  MAX_RETRIES: parseInt(env.VITE_MAX_RETRY_ATTEMPTS) || 3
};

export { API_BASE_URL };

// Token Management
class TokenManager {
  static TOKEN_KEY = env.VITE_TOKEN_STORAGE_KEY || 'api_access_token';
  static isBrowser() {
    return typeof window !== 'undefined';
  }
  
  static getToken() {
    if (!this.isBrowser()) {
      return null;
    }
    // Ensure TOKEN_KEY is not null/undefined
    if (!this.TOKEN_KEY) {
this.TOKEN_KEY = 'api_access_token';
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  static setToken(token) {
    if (!this.isBrowser()) {
      return;
    }
    // Ensure TOKEN_KEY is not null/undefined
    if (!this.TOKEN_KEY) {
this.TOKEN_KEY = 'api_access_token';
    }
    localStorage.setItem(this.TOKEN_KEY, token);
    if (API_CONFIG.ENABLE_LOGGING) {

    }
  }
  
  static removeToken() {
    if (!this.isBrowser()) {
      return;
    }
    // Ensure TOKEN_KEY is not null/undefined
    if (!this.TOKEN_KEY) {
this.TOKEN_KEY = 'api_access_token';
    }
    localStorage.removeItem(this.TOKEN_KEY);
  }
  
  static isAuthenticated() {
    return !!this.getToken();
  }
}

// Validate API Configuration
const validateConfig = () => {
  // Ensure valid timeout
  if (isNaN(API_CONFIG.TIMEOUT) || API_CONFIG.TIMEOUT < 1000) {
API_CONFIG.TIMEOUT = 10000;
  }
  
  // Ensure valid max retries
  if (isNaN(API_CONFIG.MAX_RETRIES) || API_CONFIG.MAX_RETRIES < 0) {
API_CONFIG.MAX_RETRIES = 3;
  }
  
  if (API_CONFIG.ENABLE_LOGGING) {

  }
};

// Validate configuration on module load
validateConfig();

// API Constants from backend documentation
export const API_CONSTANTS = {
  ADMIN_ROLES: {
    SUPER_ADMIN: 'super_admin',
    STUDIO_RENTAL: 'studio_rental',
    APARTMENT_SALE: 'apartment_sale'
  },
  LOCATIONS: {
    MAADI: 'maadi',
    MOKKATTAM: 'mokkattam'
  },
  BATHROOM_TYPES: {
    PRIVATE: 'private',
    SHARED: 'shared'
  },
  PART_STATUS: {
    AVAILABLE: 'available',
    RENTED: 'rented',
    UPCOMING_END: 'upcoming_end'
  },
  FURNISHED_STATUS: {
    YES: 'yes',
    NO: 'no'
  },
  BALCONY_TYPES: {
    YES: 'yes',
    SHARED: 'shared',
    NO: 'no'
  },
  CUSTOMER_SOURCES: {
    FACEBOOK: 'facebook',
    INSTAGRAM: 'instagram',
    GOOGLE: 'google',
    BAYUT: 'Bayut',
    AQAR_MAP: 'Aqar map',
    DUBIZZLE: 'Dubizzle',
    REFERRAL: 'referral',
    WALK_IN: 'walk_in',
    OTHER: 'other'
  }
};

// HTTP Client with interceptors
class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Create request headers
  createHeaders(includeAuth = true, contentType = 'application/json') {
    const headers = {};
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    if (includeAuth && TokenManager.isAuthenticated()) {
      headers['Authorization'] = `Bearer ${TokenManager.getToken()}`;
    }
    
    return headers;
  }

  // Handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      
      // Handle different error types
      switch (response.status) {
        case 401:
          TokenManager.removeToken();
          throw new ApiError('Authentication failed', 401, errorData);
        case 403:
          throw new ApiError('Access forbidden', 403, errorData);
        case 404:
          throw new ApiError('Resource not found', 404, errorData);
        case 422:
          throw new ApiError('Validation error', 422, errorData);
        case 500:
          throw new ApiError('Server error', 500, errorData);
        default:
          throw new ApiError('Request failed', response.status, errorData);
      }
    }
    
    return response.json();
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const {
      method = 'GET',
      body,
      headers = {},
      includeAuth = true,
      contentType = 'application/json'
    } = options;

    const requestHeaders = {
      ...this.createHeaders(includeAuth, contentType),
      ...headers
    };

    const config = {
      method,
      headers: requestHeaders
    };

    if (body) {
      if (contentType === 'application/json') {
        config.body = JSON.stringify(body);
      } else {
        config.body = body;
      }
    }

    try {
      // Debug: log the outgoing request (method, url and headers) to help diagnose
      if (API_CONFIG.ENABLE_LOGGING) {


      }
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      config.signal = controller.signal;
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      return await this.handleResponse(response);
    } catch (error) {
      // Log network errors but don't use mock data
      if (error.name === 'AbortError') {
throw new ApiError('Request timeout', 408, { detail: 'Request timed out' });
      } else if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
if (body) console.error('   Body at failure:', body);
        throw new ApiError('Network error', 0, { detail: 'Failed to connect to backend server' });
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, { detail: error.message });
    }
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
      ...options
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    });
  }

  async delete(endpoint) {
    if (API_CONFIG.ENABLE_LOGGING) {

    }
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

// Custom API Error class
export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  getDetails() {
    return this.data?.detail || this.message;
  }

  getValidationErrors() {
    if (this.status === 422 && Array.isArray(this.data?.detail)) {
      return this.data.detail.map(error => ({
        field: error.loc?.[error.loc.length - 1],
        message: error.msg,
        type: error.type
      }));
    }
    return [];
  }
}

// Create API client instance
const apiClient = new ApiClient();

// Authentication API
export const authApi = {
  // Login with username/password (form data)
  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post('/auth/login', formData, {
      contentType: 'application/x-www-form-urlencoded',
      includeAuth: false
    });

    if (response.access_token) {
      TokenManager.setToken(response.access_token);
    }

    return response;
  },

  // Create master admin (one-time setup)
  async createMasterAdmin(data) {
    return apiClient.post('/auth/create-master-admin', data, {
      includeAuth: false
    });
  },

  // Validate master admin credentials against static database
  async validateMasterCredentials(identifier, password) {
    try {
      // First attempt login to validate credentials
      const loginResult = await this.login(identifier, password);
      
      if (loginResult.access_token) {
        // Get user profile to verify role
        const userProfile = await adminApi.getMe();
        
        // Check if user has master admin privileges
        const isMasterAdmin = ['super_admin', 'master_admin'].includes(userProfile.role);
        
        if (!isMasterAdmin) {
          this.logout(); // Clear token for non-master admin
          throw new Error('Access denied: Master admin privileges required');
        }
        
        return {
          isValid: true,
          user: userProfile,
          token: loginResult.access_token
        };
      }
      
      return { isValid: false, error: 'Invalid credentials' };
    } catch (error) {
      this.logout(); // Ensure clean state on failure
      throw error;
    }
  },

  // Logout
  logout() {
    TokenManager.removeToken();
  },

  // Check authentication status
  isAuthenticated() {
    return TokenManager.isAuthenticated();
  }
};

// Admin Management API
export const adminApi = {
  // Get all admins (super admin only)
  async getAll(params = {}) {
    return apiClient.get('/admins/', params);
  },

  // Get current admin info
  async getMe() {
    return apiClient.get('/admins/me');
  },

  // Update current admin's own information
  async updateMe(data) {
    return apiClient.put('/admins/me', data);
  },

  // Create new admin (super admin only)
  async create(data) {
    return apiClient.post('/admins/', data);
  },

  // Update admin (super admin only)
  async update(adminId, data) {
    return apiClient.put(`/admins/${adminId}`, data);
  },

  // Delete admin (super admin only)
  async delete(adminId) {
    return apiClient.delete(`/admins/${adminId}`);
  }
};

// Rent Apartments API
export const rentApartmentsApi = {
  // Get all rent apartments
  async getAll(params = {}) {
    return apiClient.get('/apartments/rent', params);
  },

  // Get specific rent apartment
  async getById(apartmentId) {
    return apiClient.get(`/apartments/rent/${apartmentId}`);
  },

  // Create new rent apartment
  async create(data) {
    return apiClient.post('/apartments/rent', data);
  },

  // Update rent apartment
  async update(apartmentId, data) {
    return apiClient.put(`/apartments/rent/${apartmentId}`, data);
  },

  // Delete rent apartment
  async delete(apartmentId) {
    return apiClient.delete(`/apartments/rent/${apartmentId}`);
  }
};

// Sale Apartments API
export const saleApartmentsApi = {
  // Get all sale apartments
  async getAll(params = {}) {
    return apiClient.get('/apartments/sale', params);
  },

  // Get specific sale apartment
  async getById(apartmentId) {
    return apiClient.get(`/apartments/sale/${apartmentId}`);
  },

  // Create new sale apartment
  async create(data) {
    return apiClient.post('/apartments/sale', data);
  },

  // Update sale apartment
  async update(apartmentId, data) {
    return apiClient.put(`/apartments/sale/${apartmentId}`, data);
  },

  // Delete sale apartment
  async delete(apartmentId) {


    return apiClient.delete(`/apartments/sale/${apartmentId}`);
  }
};

// Apartment Parts (Studios) API
export const apartmentPartsApi = {
  // Get all apartment parts
  async getAll(params = {}) {
    return apiClient.get('/apartments/parts', params);
  },

  // Get specific apartment part
  async getById(partId) {
    return apiClient.get(`/apartments/parts/${partId}`);
  },

  // Create new apartment part for rent apartment
  async create(apartmentId, data) {
    return apiClient.post(`/apartments/rent/${apartmentId}/parts`, data);
  },

  // Update apartment part
  async update(partId, data) {
    return apiClient.put(`/apartments/parts/${partId}`, data);
  },

  // Delete apartment part
  async delete(partId) {
    return apiClient.delete(`/apartments/parts/${partId}`);
  }
};

// Admin's Own Content API
export const myContentApi = {
  // Get admin's own apartments and studios
  async getMyContent(params = {}) {
    return apiClient.get('/apartments/my-content', params);
  }
};

// Rental Contracts API
export const rentalContractsApi = {
  // Get all rental contracts
  async getAll(params = {}) {
    return apiClient.get('/rental-contracts/', params);
  },

  // Get rental contracts by studio (ordered by studio number)
  async getByStudio(params = {}) {
    return apiClient.get('/rental-contracts/by-studio', params);
  },

  // Get specific rental contract
  async getById(contractId) {
    return apiClient.get(`/rental-contracts/${contractId}`);
  },

  // Create new rental contract
  async create(data) {


    // Transform data to match backend schema
    const transformedData = dataTransformers.transformContractToApi(data);


    try {
      const response = await apiClient.post('/rental-contracts/', transformedData);
      
      // Transform response back to frontend format
      if (response) {

        return dataTransformers.transformContractFromApi(response);
      }
      return response;
    } catch (error) {
throw error;
    }
  },

  // Update rental contract
  async update(contractId, data) {
    // Transform data to match backend schema
    const transformedData = dataTransformers.transformContractToApi(data);
    
    const response = await apiClient.put(`/rental-contracts/${contractId}`, transformedData);
    
    // Transform response back to frontend format
    if (response) {
      return dataTransformers.transformContractFromApi(response);
    }
    return response;
  },

  // Delete rental contract (super admin only)
  async delete(contractId) {


    return apiClient.delete(`/rental-contracts/${contractId}`);
  }
};

// Utility functions for data transformation
export const dataTransformers = {
  // Transform frontend apartment data to backend format
  transformApartmentToApi(frontendData, type = 'rent') {
    // Ensure proper enum conversion for bathrooms
    const bathroomsValue = convertToApiEnum.bathrooms(frontendData.bathrooms);
    
    // Validate critical enum values
    try {
      validateEnum(bathroomsValue, BATHROOM_TYPES, 'bathrooms');
    } catch (error) {
throw new Error(`Data validation failed: ${error.message}`);
    }

    return {
      name: frontendData.name || frontendData.title,
      location: String(frontendData.location || '').trim(),
      address: frontendData.address,
      area: String(frontendData.area).replace(' sqm', '').replace(/[^0-9.]/g, ''),
      number: frontendData.number || frontendData.unitNumber,
      price: String(frontendData.price).replace(/[^0-9.]/g, ''),
      bedrooms: Number(frontendData.bedrooms) || 1,
      bathrooms: bathroomsValue,
      description: frontendData.description || '',
      photos_url: Array.isArray(frontendData.photos_url) ? frontendData.photos_url : 
                  Array.isArray(frontendData.images) ? frontendData.images : [],
      location_on_map: frontendData.location_on_map || frontendData.mapLocation || '',
      facilities_amenities: Array.isArray(frontendData.amenities) 
        ? frontendData.amenities.join(', ') 
        : String(frontendData.facilities_amenities || frontendData.amenities || ''),
      floor: Number(frontendData.floor) || 1,
      total_parts: Number(frontendData.total_parts || frontendData.totalStudios || 1),
      contact_number: frontendData.contact_number || frontendData.contactNumber
    };
  },

  // Transform backend apartment data to frontend format
  transformApartmentFromApi(backendData) {
    return {
      id: backendData.id,
      name: backendData.name,
      title: backendData.name,
      location: backendData.location,
      locationEnum: backendData.location,
      address: backendData.address,
      area: backendData.area,
      unitNumber: backendData.number,
      number: backendData.number,
      price: backendData.price,
      bedrooms: backendData.bedrooms,
      bathrooms: convertFromApiEnum.bathrooms(backendData.bathrooms),
      bathroomsEnum: backendData.bathrooms, // Keep original enum value for API calls
      description: backendData.description || '',
      images: backendData.photos_url || [],
      photos_url: backendData.photos_url || [],
      mapLocation: backendData.location_on_map,
      location_on_map: backendData.location_on_map,
      amenities: backendData.facilities_amenities ? backendData.facilities_amenities.split(', ') : [],
      facilities_amenities: backendData.facilities_amenities,
      floor: backendData.floor,
      totalStudios: backendData.total_parts,
      total_parts: backendData.total_parts,
      contactNumber: backendData.contact_number,
      contact_number: backendData.contact_number,
      createdBy: backendData.listed_by_admin_id,
      listed_by_admin_id: backendData.listed_by_admin_id,
      createdAt: backendData.created_at,
      updatedAt: backendData.updated_at,
      isAvailable: true,
      type: 'Apartment',
      ownership: 'Rent',
      completionStatus: 'Ready',
      studios: backendData.apartment_parts ? backendData.apartment_parts.map(part => 
        this.transformStudioFromApi(part)
      ) : []
    };
  },

  // Transform studio part data for API
  transformStudioToApi(frontendData) {
    // Convert enum values
    const bathroomsValue = convertToApiEnum.bathrooms(frontendData.bathrooms);
    const furnishedValue = convertToApiEnum.furnished(frontendData.furnished);
    const balconyValue = convertToApiEnum.balcony(frontendData.balcony);
    const statusValue = convertToApiEnum.status(frontendData.status);

    // Validate enum values
    try {
      validateEnum(bathroomsValue, BATHROOM_TYPES, 'bathrooms');
      validateEnum(furnishedValue, FURNISHED_STATUS, 'furnished');
      validateEnum(balconyValue, BALCONY_TYPES, 'balcony');
      if (statusValue) {
        validateEnum(statusValue, PART_STATUS, 'status');
      }
    } catch (error) {
throw new Error(`Studio data validation failed: ${error.message}`);
    }

    return {
      title: frontendData.title || frontendData.studio_number || frontendData.unitNumber,
      area: String(frontendData.area || '0').replace(' sqm', '').replace(/[^0-9.]/g, ''),
      monthly_price: String(frontendData.monthly_price || frontendData.rent_value || frontendData.price || '0').replace(/[^0-9.]/g, ''),
      bedrooms: Number(frontendData.bedrooms) || 1,
      bathrooms: bathroomsValue,
      furnished: furnishedValue,
      balcony: balconyValue,
      description: frontendData.description || '',
      photos_url: Array.isArray(frontendData.photos_url) ? frontendData.photos_url : 
                  Array.isArray(frontendData.images) ? frontendData.images : [],
      status: statusValue || PART_STATUS.AVAILABLE,
      floor: Number(frontendData.floor) || 1
    };
  },

  transformStudioFromApi(backendData) {
    return {
      id: backendData.id,
      apartment_id: backendData.apartment_id,
      title: backendData.title,
      studio_number: backendData.title || backendData.studio_number,
      unitNumber: backendData.title || backendData.studio_number,
      area: backendData.area,
      monthly_price: backendData.monthly_price,
      rent_value: backendData.monthly_price,
      price: backendData.monthly_price,
      bedrooms: backendData.bedrooms,
      bathrooms: convertFromApiEnum.bathrooms(backendData.bathrooms),
      bathroomsEnum: backendData.bathrooms, // Keep original for API calls
      furnished: convertFromApiEnum.furnished(backendData.furnished),
      furnishedEnum: backendData.furnished, // Keep original for API calls
      balcony: convertFromApiEnum.balcony(backendData.balcony),
      balconyEnum: backendData.balcony, // Keep original for API calls
      description: backendData.description || '',
      photos_url: backendData.photos_url || [],
      images: backendData.photos_url || [],
      status: convertFromApiEnum.status(backendData.status),
      statusEnum: backendData.status, // Keep original for API calls
      isAvailable: backendData.status === PART_STATUS.AVAILABLE,
      floor: backendData.floor,
      created_by_admin_id: backendData.created_by_admin_id,
      createdBy: backendData.created_by_admin_id,
      created_at: backendData.created_at,
      updated_at: backendData.updated_at
    };
  },

  // Transform rental contract data for API
  transformContractToApi(frontendData) {
    // Convert customer source enum
    const customerSourceValue = convertToApiEnum.customerSource(frontendData.how_did_customer_find_us || frontendData.customerSource);
    
    // Validate customer source enum
    try {
      validateEnum(customerSourceValue, CUSTOMER_SOURCES, 'customer_source');
    } catch (error) {
throw new Error(`Contract data validation failed: ${error.message}`);
    }

    return {
      apartment_part_id: frontendData.apartment_part_id || frontendData.studioId,
      customer_name: frontendData.customer_name || frontendData.customerName,
      customer_phone: frontendData.customer_phone || frontendData.customerPhone,
      customer_id_number: frontendData.customer_id_number || frontendData.customerIdNumber,
      how_did_customer_find_us: customerSourceValue,
      paid_deposit: String(frontendData.paid_deposit || frontendData.deposit || '0').replace(/[^0-9.]/g, ''),
      warrant_amount: String(frontendData.warrant_amount || frontendData.warrantyAmount || '0').replace(/[^0-9.]/g, ''),
      rent_start_date: frontendData.rent_start_date || frontendData.startDate,
      rent_end_date: frontendData.rent_end_date || frontendData.endDate,
      rent_period: Number(frontendData.rent_period || frontendData.contractPeriod || 12),
      contract_url: frontendData.contract_url || frontendData.contractDocument || '',
      customer_id_url: frontendData.customer_id_url || frontendData.customerIdDocument || '',
      commission: String(frontendData.commission || '0').replace(/[^0-9.]/g, ''),
      rent_price: String(frontendData.rent_price || frontendData.monthlyRent || '0').replace(/[^0-9.]/g, '')
    };
  },

  // Transform rental contract data from API
  transformContractFromApi(backendData) {
    return {
      id: backendData.id,
      apartment_part_id: backendData.apartment_part_id,
      studioId: backendData.apartment_part_id,
      customer_name: backendData.customer_name,
      customerName: backendData.customer_name,
      customer_phone: backendData.customer_phone,
      customerPhone: backendData.customer_phone,
      customer_id_number: backendData.customer_id_number,
      customerIdNumber: backendData.customer_id_number,
      how_did_customer_find_us: convertFromApiEnum.customerSource(backendData.how_did_customer_find_us),
      customerSource: convertFromApiEnum.customerSource(backendData.how_did_customer_find_us),
      customerSourceEnum: backendData.how_did_customer_find_us, // Keep original for API calls
      paid_deposit: backendData.paid_deposit,
      deposit: backendData.paid_deposit,
      warrant_amount: backendData.warrant_amount,
      warrantyAmount: backendData.warrant_amount,
      rent_start_date: backendData.rent_start_date,
      startDate: backendData.rent_start_date,
      rent_end_date: backendData.rent_end_date,
      endDate: backendData.rent_end_date,
      rent_period: backendData.rent_period,
      contract_url: backendData.contract_url,
      contractDocument: backendData.contract_url,
      customer_id_url: backendData.customer_id_url,
      customerIdDocument: backendData.customer_id_url,
      commission: backendData.commission,
      rent_price: backendData.rent_price,
      monthlyRent: backendData.rent_price,
      is_active: backendData.is_active,
      isActive: backendData.is_active,
      created_by_admin_id: backendData.created_by_admin_id,
      createdBy: backendData.created_by_admin_id,
      created_at: backendData.created_at,
      updated_at: backendData.updated_at
    };
  },

  // Transform admin data for API
  transformAdminToApi(frontendData) {
    // Convert admin role enum
    const roleValue = convertToApiEnum.adminRole(frontendData.role);
    
    // Validate admin role enum
    try {
      validateEnum(roleValue, ADMIN_ROLES, 'admin_role');
    } catch (error) {
throw new Error(`Admin data validation failed: ${error.message}`);
    }

    return {
      full_name: frontendData.full_name || frontendData.fullName || frontendData.name,
      email: frontendData.email,
      phone: frontendData.phone,
      password: frontendData.password,
      role: roleValue
    };
  },

  // Transform admin data from API
  transformAdminFromApi(backendData) {
    return {
      id: backendData.id,
      full_name: backendData.full_name,
      fullName: backendData.full_name,
      name: backendData.full_name,
      email: backendData.email,
      phone: backendData.phone,
      role: convertFromApiEnum.adminRole(backendData.role),
      roleEnum: backendData.role, // Keep original for API calls
      created_at: backendData.created_at,
      updated_at: backendData.updated_at
    };
  }
};

// Enhanced error handler for UI with better user feedback
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (API_CONFIG.ENABLE_LOGGING) {
}
  
  if (error instanceof ApiError) {
    if (error.status === 422) {
      const validationErrors = error.getValidationErrors();
      if (validationErrors.length > 0) {
        return validationErrors.map(err => `${err.field}: ${err.message}`).join(', ');
      }
    }
    
    // Handle different HTTP status codes with user-friendly messages
    switch (error.status) {
      case 0:
        return 'Unable to connect to server. Please check if the backend is running and try again.';
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication failed. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'Conflict: This action cannot be completed due to a conflict with existing data.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later or contact support.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error.getDetails() || defaultMessage;
    }
  }
  
  // Handle network errors - more specific messages
  if (error.name === 'NetworkError' || error.message === 'Failed to fetch') {
    return 'Cannot connect to backend server. Please ensure your backend is running on the configured URL.';
  }
  
  // Handle timeout errors
  if (error.name === 'TimeoutError') {
    return 'Request timed out. Please check your backend server and try again.';
  }
  
  // Handle other common errors
  if (error.message?.includes('CORS')) {
    return 'CORS error. Please check your backend CORS configuration.';
  }
  
  return error.message || defaultMessage;
};

// Enhanced error notifications for different types of operations
export const getOperationErrorMessage = (operation, error) => {
  const baseMessage = handleApiError(error);
  
  const operationMessages = {
    login: 'Login failed',
    signup: 'Account creation failed',
    create: 'Failed to create item',
    update: 'Failed to update item',
    delete: 'Failed to delete item',
    fetch: 'Failed to load data',
    upload: 'Failed to upload file',
    search: 'Search failed'
  };
  
  const prefix = operationMessages[operation] || 'Operation failed';
  
  // If it's a validation error, show just the validation message
  if (baseMessage.includes(':')) {
    return baseMessage;
  }
  
  return `${prefix}: ${baseMessage}`;
};

// Helper function for retry logic
export const createRetryFunction = (apiCall, maxRetries = API_CONFIG.MAX_RETRIES || 3, delay = 1000) => {
  return async (...args) => {
    // Skip retry logic if disabled
    if (!API_CONFIG.ENABLE_RETRY) {
      return apiCall(...args);
    }
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (API_CONFIG.ENABLE_LOGGING && attempt > 0) {

        }
        return await apiCall(...args);
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except for 429 (rate limiting)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
    
    throw lastError;
  };
};

// Export the main API client for direct use if needed
export default apiClient;
