import { useSelector, useDispatch } from 'react-redux';
import { authApi, adminApi, handleApiError } from '../services/api';
import {
  setLoading,
  clearError,
  loginSuccess,
  loginFailure,
  logout as logoutAction,
  selectAdminAuth,
  selectCurrentAdmin,
  selectAdminLoading,
  selectAdminError,
  selectIsAdminAuthenticated,
  selectAllAdminAccounts
} from '../store/slices/adminAuthSlice';

export const useAdminAuth = () => {
  const dispatch = useDispatch();
  const adminAuth = useSelector(selectAdminAuth);
  const currentAdmin = useSelector(selectCurrentAdmin);
  const isLoading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);
  const isAuthenticated = useSelector(selectIsAdminAuthenticated);
  const allAdminAccounts = useSelector(selectAllAdminAccounts);

  // Transform API admin data to frontend format
  const transformAdminFromApi = (apiAdmin) => {
    // Backend returns: id, full_name, email, phone, role, created_at, updated_at
    // We need to preserve ALL fields and create aliases for compatibility
    return {
      // Original backend fields (preserve exactly as received)
      ...apiAdmin,
      
      // Aliases for frontend compatibility
      id: apiAdmin.id,
      full_name: apiAdmin.full_name,
      username: apiAdmin.full_name,
      name: apiAdmin.full_name,
      
      // Email aliases
      email: apiAdmin.email,
      account: apiAdmin.email,
      
      // Phone aliases  
      phone: apiAdmin.phone,
      mobile: apiAdmin.phone,
      mobileNumber: apiAdmin.phone,
      
      // Status and role
      role: apiAdmin.role,
      isActive: apiAdmin.is_active !== false,
      
      // Timestamps
      created_at: apiAdmin.created_at,
      createdAt: apiAdmin.created_at || new Date().toISOString(),
      updated_at: apiAdmin.updated_at,
      updatedAt: apiAdmin.updated_at || new Date().toISOString(),
      loginTime: new Date().toISOString()
    };
  };

  // Admin login with API
  const loginAdmin = async (accountOrMobileOrEmail, password) => {
    try {
      dispatch(setLoading(true));
      
      // Login through API
      await authApi.login(accountOrMobileOrEmail, password);
      
      // Get current admin info
      const adminData = await adminApi.getMe();
      const transformedAdmin = transformAdminFromApi(adminData);
      
      dispatch(loginSuccess({ admin: transformedAdmin }));
      return { success: true, admin: transformedAdmin };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Invalid credentials');
      dispatch(loginFailure(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Admin logout
  const logoutAdmin = () => {
    authApi.logout(); // Clear API token
    dispatch(logoutAction());
  };

  // Check admin authentication status
  const checkAuthStatus = async () => {
    try {
      if (authApi.isAuthenticated()) {
        const adminData = await adminApi.getMe();
        const transformedAdmin = transformAdminFromApi(adminData);
        dispatch(loginSuccess({ admin: transformedAdmin }));
        return { success: true, admin: transformedAdmin };
      }
      return { success: false, message: 'Not authenticated' };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Authentication check failed');
      dispatch(loginFailure(errorMessage));
      return { success: false, message: errorMessage };
    }
  };

  // Initialize admin auth on app start
  const initializeAdminAuth = async () => {
    try {
      if (authApi.isAuthenticated()) {
        return await checkAuthStatus();
      }
      return { success: false, message: 'No active session' };
    } catch (error) {
return { success: false, message: 'Initialization failed' };
    }
  };

  // Clear admin error
  const clearAdminError = () => {
    dispatch(clearError());
  };

  // Legacy compatibility methods
  const createAdminAccount = async (adminData) => {


    try {

      // Quick network sanity check
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
return { success: false, error: 'No network connection. Please check your internet or backend server.' };
      }
      
      // Transform to API format
      const apiData = {
        full_name: adminData.full_name || adminData.name || adminData.username,
        email: adminData.email || adminData.account,
        phone: adminData.phone || adminData.mobile || adminData.mobileNumber,
        role: adminData.role || 'studio_rental',
        password: adminData.password
      };




      const response = await adminApi.create(apiData);

      return { 
        success: true, 
        message: 'Admin account created successfully',
        admin: transformAdminFromApi(response)
      };
    } catch (error) {
// Extract the detail message from the backend
      let errorMessage = 'Failed to create admin account';
      
      if (error.data?.detail) {
        errorMessage = error.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage, message: errorMessage };
    }
  };

  const getAllAdminAccounts = async () => {
    // Make API call to fetch all admin accounts
    try {

      const response = await adminApi.getAll();

      if (Array.isArray(response)) {
        const transformedAdmins = response.map(transformAdminFromApi);

        return transformedAdmins;
      } else {
return [];
      }
    } catch (error) {
return [];
    }
  };

  const updateAdminStatus = async (adminId, isActive) => {
    try {
      await adminApi.update(adminId, { is_active: isActive });
      return { success: true, message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully` };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update admin status');
      return { success: false, message: errorMessage };
    }
  };

  const deleteAdminAccount = async (adminId) => {
    try {
      await adminApi.delete(adminId);
      return { success: true, message: 'Admin account deleted successfully' };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete admin account');
      return { success: false, message: errorMessage };
    }
  };

  return {
    // State
    adminAuth,
    currentAdmin,
    isLoading,
    error,
    isAuthenticated,
    allAdminAccounts,
    
    // Actions
    loginAdmin,
    logoutAdmin,
    checkAuthStatus,
    initializeAdminAuth,
    clearError: clearAdminError,
    
    // Legacy compatibility
    createAdminAccount,
    getAllAdminAccounts,
    updateAdminStatus,
    deleteAdminAccount
  };
};