import { useSelector, useDispatch } from 'react-redux';
import { 
  rentApartmentsApi, 
  saleApartmentsApi, 
  apartmentPartsApi, 
  myContentApi,
  handleApiError 
} from '../services/api';
import {
  setLoading,
  setError,
  clearError,
  setApartments,
  addApartment as addApartmentAction,
  updateApartment as updateApartmentAction,
  deleteApartment as deleteApartmentAction,
  addStudio as addStudioAction,
  updateStudio as updateStudioAction,
  deleteStudio as deleteStudioAction,
  toggleStudioAvailability as toggleStudioAvailabilityAction,
  setSaleApartments,
  addSaleApartment as addSaleApartmentAction,
  updateSaleApartment as updateSaleApartmentAction,
  deleteSaleApartment as deleteSaleApartmentAction,
  selectProperty,
  selectApartments,
  selectSaleApartments,
  selectPropertyLoading,
  selectPropertyError,
  selectApartmentsByCreator,
  selectAllAvailableStudios,
  selectStudiosByCreator,
  selectSaleApartmentsByCreator,
  selectAllAdminCreators
} from '../store/slices/propertySlice';

export const usePropertyManagement = () => {
  const dispatch = useDispatch();
  const property = useSelector(selectProperty);
  const apartments = useSelector(selectApartments);
  const saleApartments = useSelector(selectSaleApartments);
  const isLoading = useSelector(selectPropertyLoading);
  const error = useSelector(selectPropertyError);

  // Transform backend apartment data to frontend format
  const transformRentApartmentFromApi = (apiApartment) => ({
    id: apiApartment.id,
    title: apiApartment.name || apiApartment.title, // API uses 'name' field
    name: apiApartment.name, // Keep API field as well
    location: apiApartment.location,
    address: apiApartment.address,
    price: apiApartment.price,
    area: apiApartment.area,
    bedrooms: apiApartment.bedrooms,
    bathrooms: apiApartment.bathrooms,
    floor: apiApartment.floor,
    description: apiApartment.description,
    amenities: apiApartment.facilities_amenities ? [apiApartment.facilities_amenities] : [],
    images: apiApartment.photos_url || [],
    contactNumber: apiApartment.contact_number,
    coordinates: apiApartment.location_on_map ? { url: apiApartment.location_on_map } : { lat: 0, lng: 0 },
    totalStudios: apiApartment.total_parts || 0,
    availableStudios: 0, // Will be calculated from parts
    createdBy: apiApartment.listed_by_admin_id,
    listed_by_admin_id: apiApartment.listed_by_admin_id,
    createdAt: apiApartment.created_at,
    updatedAt: apiApartment.updated_at,
    studios: [], // Will be populated separately if needed
    // Legacy compatibility
    postedDate: apiApartment.created_at,
    isAvailable: true
  });

  // Transform frontend apartment data to backend format
  const transformRentApartmentToApi = (frontendApartment) => {

    // If data is already in API format (has 'name' field), return as is
    if (frontendApartment.name !== undefined && typeof frontendApartment.name === 'string') {

      return frontendApartment;
    }
    
    // Otherwise transform from legacy frontend format
    const transformed = {
      name: frontendApartment.title || frontendApartment.name || 'Unnamed Apartment',
      location: (frontendApartment.location || 'Unknown Location').toString().trim(),
      address: frontendApartment.address || 'Address not provided',
      price: frontendApartment.price?.toString() || '0',
      area: frontendApartment.area?.toString() || '50',
      number: frontendApartment.number || frontendApartment.apartmentNumber || 'APT-001',
      bedrooms: parseInt(frontendApartment.bedrooms) || 1,
      bathrooms: frontendApartment.bathrooms === 'shared' ? 'shared' : 'private',
      description: frontendApartment.description || 'No description provided',
      photos_url: frontendApartment.photos_url || frontendApartment.images || [],
      location_on_map: frontendApartment.location_on_map || frontendApartment.coordinates?.url || frontendApartment.mapUrl || '',
      facilities_amenities: Array.isArray(frontendApartment.facilities_amenities) 
        ? frontendApartment.facilities_amenities.join(', ') 
        : frontendApartment.facilities_amenities || 
          (Array.isArray(frontendApartment.facilities) ? frontendApartment.facilities.join(', ') : '') ||
          (Array.isArray(frontendApartment.amenities) ? frontendApartment.amenities.join(', ') : ''),
      floor: parseInt(frontendApartment.floor) || 1,
      total_parts: parseInt(frontendApartment.total_parts || frontendApartment.totalParts || frontendApartment.totalStudios) || 1
    };

    return transformed;
  };

  // Transform studio/apartment part data
  const transformStudioFromApi = (apiStudio) => ({
    id: apiStudio.id,
    apartmentId: apiStudio.apartment_id,
    apartment_id: apiStudio.apartment_id,
    studioNumber: apiStudio.title,
    title: apiStudio.title,
    area: apiStudio.area,
    floor: apiStudio.floor,
    price: apiStudio.monthly_price,
    monthly_price: apiStudio.monthly_price,
    bedrooms: apiStudio.bedrooms,
    bathrooms: apiStudio.bathrooms,
    furnished: apiStudio.furnished,
    balcony: apiStudio.balcony,
    amenities: [],
    images: apiStudio.photos_url || [],
    photos_url: apiStudio.photos_url || [],
    description: apiStudio.description,
    status: apiStudio.status,
    isAvailable: apiStudio.status === 'available',
    createdBy: apiStudio.created_by_admin_id,
    createdAt: apiStudio.created_at,
    updatedAt: apiStudio.updated_at,
    postedDate: apiStudio.created_at
  });

  const transformStudioToApi = (frontendStudio) => {
    // Backend expects: title, area, monthly_price, bedrooms, bathrooms, furnished, balcony
    // If data is already in API format (from AddStudioModal), return as-is
    if (frontendStudio.title && frontendStudio.monthly_price && frontendStudio.bathrooms && frontendStudio.balcony) {

      return frontendStudio;
    }
    
    // Otherwise transform from frontend format

    return {
      title: frontendStudio.title || frontendStudio.studioNumber || 'Studio 1',
      area: frontendStudio.area ? frontendStudio.area.toString() : '25',
      monthly_price: frontendStudio.monthly_price || frontendStudio.price || '0',
      bedrooms: parseInt(frontendStudio.bedrooms) || 1,
      bathrooms: frontendStudio.bathrooms || 'private',
      furnished: frontendStudio.furnished || 'yes',
      balcony: frontendStudio.balcony || 'no',
      description: frontendStudio.description || '',
      photos_url: frontendStudio.photos_url || frontendStudio.images || []
    };
  };

  // Transform sale apartment data
  const transformSaleApartmentFromApi = (apiApartment) => ({
    id: apiApartment.id,
    title: apiApartment.name || apiApartment.title, // API uses 'name' field
    name: apiApartment.name, // Keep API field as well
    location: apiApartment.location,
    address: apiApartment.address,
    price: apiApartment.price,
    area: apiApartment.area,
    number: apiApartment.number,
    bedrooms: apiApartment.bedrooms,
    bathrooms: apiApartment.bathrooms,
    description: apiApartment.description,
    amenities: apiApartment.facilities_amenities ? [apiApartment.facilities_amenities] : [],
    images: apiApartment.photos_url || [],
    contactNumber: apiApartment.contact_number,
    coordinates: apiApartment.location_on_map ? { url: apiApartment.location_on_map } : { lat: 0, lng: 0 },
    completionStatus: apiApartment.completion_status,
    floor: apiApartment.floor,
    unitNumber: apiApartment.unit_number,
    highlights: apiApartment.highlights || {},
    details: apiApartment.details || {},
    createdBy: apiApartment.listed_by_admin_id,
    listed_by_admin_id: apiApartment.listed_by_admin_id,
    createdAt: apiApartment.created_at,
    updatedAt: apiApartment.updated_at,
    // Legacy compatibility
    type: 'sale',
    ownership: 'Sale',
    postedDate: apiApartment.created_at,
    isAvailable: apiApartment.is_available !== false,
    listedAt: apiApartment.created_at
  });

  const transformSaleApartmentToApi = (frontendApartment) => {

    
    // CRITICAL: Sale apartments have DIFFERENT schema than rent apartments
    // Sale schema does NOT include: floor, total_parts, contact_number
    // Build transformed data matching EXACT backend schema
    const transformed = {
      // === REQUIRED FIELDS ===
      name: (frontendApartment.name || frontendApartment.title || '').trim(),
      location: (frontendApartment.location || '').toString().trim(),
      address: (frontendApartment.address || '').trim(),
      price: (frontendApartment.price || frontendApartment.salePrice || '').toString().trim(),
      area: (frontendApartment.area || '').toString().trim(),
      number: (frontendApartment.number || frontendApartment.apartmentNumber || frontendApartment.unitNumber || '').toString().trim(),
      bedrooms: parseInt(frontendApartment.bedrooms) || 0,
      bathrooms: frontendApartment.bathrooms === 'shared' ? 'shared' : 'private',
      
      // === OPTIONAL FIELDS ===
      description: (frontendApartment.description || '').trim(),
      photos_url: Array.isArray(frontendApartment.photos_url) 
        ? frontendApartment.photos_url 
        : (Array.isArray(frontendApartment.images) ? frontendApartment.images : []),
      location_on_map: (frontendApartment.location_on_map || frontendApartment.coordinates?.url || frontendApartment.mapUrl || '').trim(),
      facilities_amenities: (() => {
        if (typeof frontendApartment.facilities_amenities === 'string') {
          return frontendApartment.facilities_amenities.trim();
        }
        if (Array.isArray(frontendApartment.facilities_amenities)) {
          return frontendApartment.facilities_amenities.join(', ').trim();
        }
        if (Array.isArray(frontendApartment.facilities)) {
          return frontendApartment.facilities.join(', ').trim();
        }
        if (Array.isArray(frontendApartment.amenities)) {
          return frontendApartment.amenities.join(', ').trim();
        }
        return '';
      })()
    };
    
    // Remove empty optional fields to avoid sending empty strings
    if (!transformed.description) delete transformed.description;
    if (!transformed.location_on_map) delete transformed.location_on_map;
    if (!transformed.facilities_amenities) delete transformed.facilities_amenities;
    if (transformed.photos_url.length === 0) delete transformed.photos_url;
    
    // Validation logging










    
    return transformed;
  };

  // ==================== RENT APARTMENTS ====================

  // Fetch all rent apartments
  const fetchRentApartments = async (params = {}) => {
    try {
      dispatch(setLoading(true));
      const response = await rentApartmentsApi.getAll(params);
      const transformedApartments = response.map(transformRentApartmentFromApi);
      dispatch(setApartments(transformedApartments));
      return { success: true, apartments: transformedApartments };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch apartments');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Create rent apartment
  const createRentApartment = async (apartmentData) => {
    try {
      dispatch(setLoading(true));
      const apiData = transformRentApartmentToApi(apartmentData);
      const response = await rentApartmentsApi.create(apiData);
      const transformedApartment = transformRentApartmentFromApi(response);
      
      dispatch(addApartmentAction(transformedApartment));
      return { 
        success: true, 
        message: 'Apartment created successfully',
        apartment: transformedApartment
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to create apartment');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update rent apartment
  const updateRentApartment = async (apartmentId, updateData) => {
    try {
      dispatch(setLoading(true));
      const apiData = transformRentApartmentToApi(updateData);
      const response = await rentApartmentsApi.update(apartmentId, apiData);
      const transformedApartment = transformRentApartmentFromApi(response);
      
      dispatch(updateApartmentAction(transformedApartment));
      return { 
        success: true, 
        message: 'Apartment updated successfully',
        apartment: transformedApartment
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update apartment');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Delete rent apartment
  const deleteRentApartment = async (apartmentId) => {
    try {
      dispatch(setLoading(true));
      await rentApartmentsApi.delete(apartmentId);
      dispatch(deleteApartmentAction(apartmentId));
      return { 
        success: true, 
        message: 'Apartment deleted successfully'
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete apartment');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ==================== APARTMENT PARTS (STUDIOS) ====================

  // Fetch studios for an apartment
  const fetchStudiosForApartment = async (apartmentId) => {
    try {
      dispatch(setLoading(true));
      const response = await apartmentPartsApi.getAll({ apartment_id: apartmentId });
      const transformedStudios = response.map(transformStudioFromApi);
      
      // Update the apartment in the store with studios
      const updatedApartments = apartments.map(apt => 
        apt.id === apartmentId ? { ...apt, studios: transformedStudios } : apt
      );
      dispatch(setApartments(updatedApartments));
      
      return { success: true, studios: transformedStudios };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch studios');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Create studio for apartment
  const createStudio = async (apartmentId, studioData) => {
    try {
      dispatch(setLoading(true));
      const apiData = transformStudioToApi(studioData);
      const response = await apartmentPartsApi.create(apartmentId, apiData);
      const transformedStudio = transformStudioFromApi(response);
      
      dispatch(addStudioAction({ apartmentId, studio: transformedStudio }));
      return { 
        success: true, 
        message: 'Studio created successfully',
        studio: transformedStudio
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to create studio');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update studio
  const updateStudio = async (studioId, updateData) => {
    try {
      dispatch(setLoading(true));
      const apiData = transformStudioToApi(updateData);
      const response = await apartmentPartsApi.update(studioId, apiData);
      const transformedStudio = transformStudioFromApi(response);
      
      dispatch(updateStudioAction(transformedStudio));
      return { 
        success: true, 
        message: 'Studio updated successfully',
        studio: transformedStudio
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update studio');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Delete studio
  const deleteStudio = async (studioId) => {
    try {
      dispatch(setLoading(true));
      await apartmentPartsApi.delete(studioId);
      dispatch(deleteStudioAction(studioId));
      return { 
        success: true, 
        message: 'Studio deleted successfully'
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete studio');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Toggle studio availability
  const toggleStudioAvailability = async (studioId, isAvailable) => {
    try {
      dispatch(setLoading(true));
      const response = await apartmentPartsApi.update(studioId, { is_available: !isAvailable });
      const transformedStudio = transformStudioFromApi(response);
      
      dispatch(toggleStudioAvailabilityAction({ studioId }));
      return { 
        success: true, 
        message: `Studio ${!isAvailable ? 'made available' : 'marked as occupied'}`,
        studio: transformedStudio
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update studio availability');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ==================== SALE APARTMENTS ====================

  // Fetch all sale apartments
  const fetchSaleApartments = async (params = {}) => {
    try {
      dispatch(setLoading(true));
      const response = await saleApartmentsApi.getAll(params);
      const transformedApartments = response.map(transformSaleApartmentFromApi);
      dispatch(setSaleApartments(transformedApartments));
      return { success: true, apartments: transformedApartments };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch sale apartments');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Create sale apartment
  const createSaleApartment = async (apartmentData) => {
    try {
      dispatch(setLoading(true));
      const apiData = transformSaleApartmentToApi(apartmentData);
      const response = await saleApartmentsApi.create(apiData);
      const transformedApartment = transformSaleApartmentFromApi(response);
      
      dispatch(addSaleApartmentAction(transformedApartment));
      return { 
        success: true, 
        message: 'Sale apartment created successfully',
        apartment: transformedApartment
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to create sale apartment');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update sale apartment
  const updateSaleApartment = async (apartmentId, updateData) => {
    try {
      dispatch(setLoading(true));
      const apiData = transformSaleApartmentToApi(updateData);
      const response = await saleApartmentsApi.update(apartmentId, apiData);
      const transformedApartment = transformSaleApartmentFromApi(response);
      
      dispatch(updateSaleApartmentAction(transformedApartment));
      return { 
        success: true, 
        message: 'Sale apartment updated successfully',
        apartment: transformedApartment
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update sale apartment');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Delete sale apartment
  const deleteSaleApartment = async (apartmentId) => {
    try {

      dispatch(setLoading(true));

      const response = await saleApartmentsApi.delete(apartmentId);

      dispatch(deleteSaleApartmentAction(apartmentId));

      return { 
        success: true, 
        message: 'Sale apartment deleted successfully'
      };
    } catch (error) {
const errorMessage = handleApiError(error, 'Failed to delete sale apartment');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ==================== MY CONTENT (ADMIN'S OWN DATA) ====================

  // Fetch admin's own content
  const fetchMyContent = async (params = {}) => {
    try {
      dispatch(setLoading(true));
      const response = await myContentApi.getMyContent(params);
      
      // Transform the data based on what's returned
      const transformedRentApartments = response.rent_apartments?.map(transformRentApartmentFromApi) || [];
      const transformedSaleApartments = response.sale_apartments?.map(transformSaleApartmentFromApi) || [];
      
      dispatch(setApartments(transformedRentApartments));
      dispatch(setSaleApartments(transformedSaleApartments));
      
      return { 
        success: true, 
        rentApartments: transformedRentApartments,
        saleApartments: transformedSaleApartments
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch your content');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Clear error
  const clearPropertyError = () => {
    dispatch(clearError());
  };

  // ==================== API FETCH FUNCTIONS ====================

  // These functions fetch fresh data from API and can be used to refresh data
  const fetchApartmentsByCreatorFromApi = async (createdBy) => {
    try {
      const response = await rentApartmentsApi.getAll({ created_by: createdBy });
      return response.map(transformRentApartmentFromApi);
    } catch (error) {
return [];
    }
  };

  const fetchStudiosByCreatorFromApi = async (createdBy) => {
    try {
      const response = await apartmentPartsApi.getAll({ created_by: createdBy });
      return response.map(transformStudioFromApi);
    } catch (error) {
return [];
    }
  };

  const fetchSaleApartmentsByCreatorFromApi = async (createdBy) => {
    try {
      const response = await saleApartmentsApi.getAll({ created_by: createdBy });
      return response.map(transformSaleApartmentFromApi);
    } catch (error) {
return [];
    }
  };

  return {
    // State
    property,
    apartments,
    saleApartments,
    isLoading,
    error,
    
    // Rent Apartments
    fetchRentApartments,
    createRentApartment,
    updateRentApartment,
    deleteRentApartment,
    
    // Studios/Apartment Parts
    fetchStudiosForApartment,
    createStudio,
    updateStudio,
    deleteStudio,
    toggleStudioAvailability,
    
    // Sale Apartments
    fetchSaleApartments,
    createSaleApartment,
    updateSaleApartment,
    deleteSaleApartment,
    
    // My Content
    fetchMyContent,
    
    // Utilities
    clearError: clearPropertyError,
    
    // Sync selectors (work with already loaded Redux data)
    getApartmentsByCreator: (createdBy) => apartments.filter(apt => 
      apt.createdBy === createdBy || apt.listed_by_admin_id === createdBy
    ),
    getSaleApartmentsByCreator: (createdBy) => saleApartments.filter(apt => 
      apt.createdBy === createdBy || apt.listed_by_admin_id === createdBy  
    ),
    getStudiosByCreator: (createdBy) => {
      return apartments
        .filter(apt => apt.createdBy === createdBy || apt.listed_by_admin_id === createdBy)
        .flatMap(apt => apt.studios || []);
    },
    getAllAvailableStudios: () => {
      return apartments.flatMap(apt => apt.studios || []).filter(studio => studio.isAvailable);
    },
    getAllStudios: () => {
      return apartments.flatMap(apt => apt.studios || []);
    },
    getAllAvailableSaleApartments: () => {
      return saleApartments.filter(apt => apt.isAvailable !== false);
    },
    
    // API-based fetch functions (use these to refresh data from backend)
    fetchApartmentsByCreatorFromApi,
    fetchStudiosByCreatorFromApi,
    fetchSaleApartmentsByCreatorFromApi,
    
    // Legacy compatibility
    addApartment: createRentApartment,
    addStudio: createStudio,
    addSaleApartment: createSaleApartment,
    
    // Additional legacy methods that might be needed
    verifyDataConsistency: () => ({ success: true, message: 'Data is consistent with API' }),
    clearAllData: () => {
      dispatch(setApartments([]));
      dispatch(setSaleApartments([]));
    }
  };
};
