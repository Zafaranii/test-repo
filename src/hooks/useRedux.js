import { useSelector, useDispatch } from 'react-redux';
import { useMemo } from 'react';

// Import all actions and selectors
import {
  // Property actions
  addApartment,
  updateApartment,
  deleteApartment,
  addStudio,
  updateStudio,
  deleteStudio,
  toggleStudioAvailability,
  addSaleApartment,
  updateSaleApartment,
  deleteSaleApartment,
  clearAllData,
  // Property selectors
  selectApartments,
  selectSaleApartments,
  selectPropertyLoading,
  selectPropertyError,
  selectApartmentsByCreator,
  selectAllAvailableStudios,
  selectAllStudios,
  selectStudiosByCreator,
  selectStudioById,
  selectApartmentById,
  selectSaleApartmentsByCreator,
  selectAllAvailableSaleApartments,
  selectSaleApartmentById,
  selectAllAdminCreators
} from '../store/slices/propertySlice';

import {
  // Admin auth actions
  loginAdmin,
  createAdminAccount,
  logout as adminLogout,
  updateAdminStatus,
  deleteAdmin, deleteAdminAccount,
  updateAdminPassword,
  clearError as clearAdminError,
  // Admin auth selectors
  selectCurrentAdmin,
  selectAdminLoading,
  selectAdminError,
  selectAllAdmins,
  selectIsAdminAuthenticated,
  selectAllAdminAccounts
} from '../store/slices/adminAuthSlice';

import {
  // Master auth actions
  loginMasterAdmin,
  updateMasterProfile,
  logout as masterLogout,
  clearError as clearMasterError,
  // Master auth selectors
  selectCurrentUser,
  selectMasterLoading,
  selectMasterError,
  selectIsMasterAuthenticated,
  selectCurrentUserProfile
} from '../store/slices/masterAuthSlice';

import {
  // Theme actions
  setTheme,
  toggleTheme,
  useSystemTheme,
  addCustomTheme,
  removeCustomTheme,
  resetToDefault,
  detectSystemTheme,
  // Theme selectors
  selectCurrentTheme,
  selectAvailableThemes,
  selectIsDarkTheme,
  selectIsLightTheme,
  selectThemeConfig
} from '../store/slices/themeSlice';

// Property hook - replaces useProperty
export const useProperty = () => {
  const dispatch = useDispatch();
  const apartments = useSelector(selectApartments);
  const saleApartments = useSelector(selectSaleApartments);
  const isLoading = useSelector(selectPropertyLoading);
  const error = useSelector(selectPropertyError);

  // Helper functions that return values directly
  const getApartmentsByCreator = (createdBy) => {
    return apartments.filter(apartment => apartment.createdBy === createdBy);
  };

  const getAllAvailableStudios = () => {
    return apartments.reduce((allStudios, apartment) => {
      const availableStudios = apartment.studios.filter(studio => studio.isAvailable);
      return [...allStudios, ...availableStudios];
    }, []);
  };

  const getAllStudios = () => {
    return apartments.reduce((allStudios, apartment) => {
      return [...allStudios, ...apartment.studios];
    }, []);
  };

  const getStudiosByCreator = (createdBy) => {
    return apartments.reduce((allStudios, apartment) => {
      const adminStudios = apartment.studios.filter(studio => 
        studio.createdBy === createdBy || apartment.createdBy === createdBy
      );
      return [...allStudios, ...adminStudios];
    }, []);
  };

  const getStudioById = (studioId) => {
    for (const apartment of apartments) {
      const studio = apartment.studios.find(studio => studio.id === studioId);
      if (studio) return studio;
    }
    return null;
  };

  const getApartmentById = (apartmentId) => {
    return apartments.find(apt => apt.id === apartmentId);
  };

  const getSaleApartmentsByCreator = (createdBy) => {
    return saleApartments.filter(apartment => apartment.createdBy === createdBy);
  };

  const getAllAvailableSaleApartments = () => {
    return saleApartments.filter(apartment => apartment.isAvailable !== false);
  };

  const getSaleApartmentById = (apartmentId) => {
    return saleApartments.find(apartment => apartment.id === apartmentId);
  };

  const getAllAdminCreators = () => {
    const creators = new Set();
    
    apartments.forEach(apartment => {
      if (apartment.createdBy) {
        creators.add(apartment.createdBy);
      }
      
      apartment.studios.forEach(studio => {
        if (studio.createdBy) {
          creators.add(studio.createdBy);
        }
      });
    });
    
    return Array.from(creators);
  };

  // Memoized dispatch functions
  const helpers = useMemo(() => ({
    // Apartment functions
    addApartment: (apartment) => dispatch(addApartment(apartment)),
    updateApartment: (apartment) => dispatch(updateApartment(apartment)),
    deleteApartment: (apartmentId) => dispatch(deleteApartment(apartmentId)),
    
    // Studio functions
    addStudio: (apartmentId, studio) => dispatch(addStudio({ apartmentId, studio })),
    updateStudio: (apartmentId, studio) => dispatch(updateStudio({ apartmentId, studio })),
    deleteStudio: (apartmentId, studioId) => dispatch(deleteStudio({ apartmentId, studioId })),
    toggleStudioAvailability: (apartmentId, studioId) => 
      dispatch(toggleStudioAvailability({ apartmentId, studioId })),
    
    // Sale apartment functions
    addSaleApartment: (apartment) => dispatch(addSaleApartment(apartment)),
    updateSaleApartment: (apartment) => dispatch(updateSaleApartment(apartment)),
    deleteSaleApartment: (apartmentId) => dispatch(deleteSaleApartment(apartmentId)),
    
    // Clear data
    clearAllData: () => dispatch(clearAllData()),

    // Debug function to verify data consistency across portals
    verifyDataConsistency: () => {
      const totalApartments = apartments.length;
      const totalStudios = getAllStudios().length;
      const availableStudios = getAllAvailableStudios().length;




      apartments.forEach(apartment => {
      });
      
      return { totalApartments, totalStudios, availableStudios, apartments };
    }
  }), [dispatch, apartments, getAllAvailableStudios, getAllStudios]);

  return {
    apartments,
    saleApartments,
    isLoading,
    error,
    // Helper functions
    getApartmentsByCreator,
    getAllAvailableStudios,
    getAllStudios,
    getStudiosByCreator,
    getStudioById,
    getApartmentById,
    getSaleApartmentsByCreator,
    getAllAvailableSaleApartments,
    getSaleApartmentById,
    getAllAdminCreators,
    ...helpers
  };
};

// Admin auth hook - replaces useAdminAuth
export const useAdminAuth = () => {
  const dispatch = useDispatch();
  const currentAdmin = useSelector(selectCurrentAdmin);
  const isLoading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);
  const allAdmins = useSelector(selectAllAdmins);
  const isAuthenticated = useSelector(selectIsAdminAuthenticated);
  const allAdminAccounts = useSelector(selectAllAdminAccounts);

  const helpers = useMemo(() => ({
    loginAdmin: (accountOrMobileOrEmail, password) => 
      dispatch(loginAdmin(accountOrMobileOrEmail, password)),
    createAdminAccount: (adminData) => dispatch(createAdminAccount(adminData)),
    logoutAdmin: () => dispatch(adminLogout()),
    updateAdminStatus: (adminId, isActive) => dispatch(updateAdminStatus({ adminId, isActive })),
    deleteAdminAccount: (adminId) => dispatch(deleteAdminAccount(adminId)),
    updateAdminPassword: (adminId, newPassword) => 
      dispatch(updateAdminPassword({ adminId, newPassword })),
    clearError: () => dispatch(clearAdminError()),
    isAdminAuthenticated: () => isAuthenticated,
    getAllAdminAccounts: async () => {
      // Fetch fresh data from API instead of returning cached Redux state
      const { adminApi } = await import('../services/api');
      try {

        const response = await adminApi.getAll();

        if (Array.isArray(response)) {
          // Transform to consistent format
          return response.map(admin => ({
            id: admin.id,
            username: admin.full_name,
            name: admin.full_name,
            full_name: admin.full_name,
            account: admin.email,
            email: admin.email,
            mobileNumber: admin.phone,
            mobile: admin.phone,
            phone: admin.phone,
            role: admin.role,
            createdAt: admin.created_at || new Date().toISOString(),
            isActive: admin.is_active !== false
          }));
        }
        return [];
      } catch (error) {
return [];
      }
    }
  }), [dispatch, isAuthenticated, allAdminAccounts]);

  return {
    currentAdmin,
    isLoading,
    error,
    allAdmins,
    isAuthenticated,
    ...helpers
  };
};

// Master auth hook - replaces useMasterAuth
export const useMasterAuth = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectMasterLoading);
  const error = useSelector(selectMasterError);
  const isAuthenticated = useSelector(selectIsMasterAuthenticated);
  const currentUserProfile = useSelector(selectCurrentUserProfile);

  const helpers = useMemo(() => ({
    login: (loginData) => dispatch(loginMasterAdmin(loginData)),
    logout: () => dispatch(masterLogout()),
    updateProfile: (updateData) => dispatch(updateMasterProfile(updateData)),
    clearError: () => dispatch(clearMasterError()),
    isAuthenticated: () => isAuthenticated,
    getCurrentUserProfile: () => currentUserProfile
  }), [dispatch, isAuthenticated, currentUserProfile]);

  return {
    currentUser,
    isLoading,
    error,
    isAuthenticated,
    currentUserProfile,
    ...helpers
  };
};

// Theme hook - new functionality
export const useTheme = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector(selectCurrentTheme);
  const availableThemes = useSelector(selectAvailableThemes);
  const isDarkTheme = useSelector(selectIsDarkTheme);
  const isLightTheme = useSelector(selectIsLightTheme);
  const themeConfig = useSelector(selectThemeConfig);

  const helpers = useMemo(() => ({
    setTheme: (theme) => dispatch(setTheme(theme)),
    toggleTheme: () => dispatch(toggleTheme()),
    useSystemTheme: () => dispatch(useSystemTheme()),
    addCustomTheme: (name, config) => dispatch(addCustomTheme({ name, config })),
    removeCustomTheme: (name) => dispatch(removeCustomTheme(name)),
    resetToDefault: () => dispatch(resetToDefault()),
    detectSystemTheme: () => dispatch(detectSystemTheme())
  }), [dispatch]);

  return {
    currentTheme,
    availableThemes,
    isDarkTheme,
    isLightTheme,
    themeConfig,
    ...helpers
  };
};

// Combined hook for all state management - convenience hook
export const useAppState = () => {
  const property = useProperty();
  const adminAuth = useAdminAuth();
  const masterAuth = useMasterAuth();
  const theme = useTheme();

  return {
    property,
    adminAuth,
    masterAuth,
    theme
  };
};
