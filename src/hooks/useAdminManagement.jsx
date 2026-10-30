import { useSelector, useDispatch } from 'react-redux';
import { adminApi, handleApiError } from '../services/api';
import {
  setLoading,
  setError,
  clearError,
  setAdmins,
  addAdmin as addAdminAction,
  updateAdminStatus as updateAdminStatusAction,
  deleteAdmin as deleteAdminAction,
  selectAdminAuth,
  selectAllAdmins,
  selectAdminLoading,
  selectAdminError
} from '../store/slices/adminAuthSlice';

export const useAdminManagement = () => {
  const dispatch = useDispatch();
  const adminAuth = useSelector(selectAdminAuth);
  const allAdmins = useSelector(selectAllAdmins);
  const isLoading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);

  // Transform backend admin data to frontend format
  const transformAdminFromApi = (apiAdmin) => ({
    id: apiAdmin.id,
    username: apiAdmin.full_name,
    name: apiAdmin.full_name,
    account: apiAdmin.email,
    email: apiAdmin.email,
    phone: apiAdmin.phone,
    mobileNumber: apiAdmin.phone,
    mobile: apiAdmin.phone,
    role: apiAdmin.role,
    isActive: apiAdmin.is_active || true,
    createdAt: apiAdmin.created_at || new Date().toISOString(),
    updatedAt: apiAdmin.updated_at || new Date().toISOString()
  });

  // Transform frontend admin data to backend format
  const transformAdminToApi = (frontendAdmin) => ({
    full_name: frontendAdmin.name || frontendAdmin.username,
    email: frontendAdmin.email || frontendAdmin.account,
    phone: frontendAdmin.phone || frontendAdmin.mobileNumber || frontendAdmin.mobile,
    role: frontendAdmin.role || 'studio_rental',
    password: frontendAdmin.password,
    is_active: frontendAdmin.isActive !== undefined ? frontendAdmin.isActive : true
  });

  // Get all admins from API
  const fetchAllAdmins = async () => {
    try {
      dispatch(setLoading(true));
      const response = await adminApi.getAll();
      const transformedAdmins = response.map(transformAdminFromApi);
      dispatch(setAdmins(transformedAdmins));
      return { success: true, admins: transformedAdmins };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch admins');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Create new admin
  const createAdmin = async (adminData) => {
    try {
      dispatch(setLoading(true));
      const apiData = transformAdminToApi(adminData);
      const response = await adminApi.create(apiData);
      const transformedAdmin = transformAdminFromApi(response);
      
      dispatch(addAdminAction(transformedAdmin));
      return { 
        success: true, 
        message: 'Admin account created successfully',
        admin: transformedAdmin
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to create admin account');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update admin
  const updateAdmin = async (adminId, updateData) => {
    try {
      dispatch(setLoading(true));
      const apiData = transformAdminToApi(updateData);
      const response = await adminApi.update(adminId, apiData);
      const transformedAdmin = transformAdminFromApi(response);
      
      // Update in local state
      const updatedAdmins = allAdmins.map(admin => 
        admin.id === adminId ? transformedAdmin : admin
      );
      dispatch(setAdmins(updatedAdmins));
      
      return { 
        success: true, 
        message: 'Admin updated successfully',
        admin: transformedAdmin
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update admin');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update admin status (activate/deactivate)
  const updateAdminStatus = async (adminId, isActive) => {
    try {
      dispatch(setLoading(true));
      const response = await adminApi.update(adminId, { is_active: isActive });
      const transformedAdmin = transformAdminFromApi(response);
      
      dispatch(updateAdminStatusAction({ adminId, isActive }));
      return { 
        success: true, 
        message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
        admin: transformedAdmin
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update admin status');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Delete admin
  const deleteAdmin = async (adminId) => {
    try {
      dispatch(setLoading(true));
      await adminApi.delete(adminId);
      dispatch(deleteAdminAction(adminId));
      return { 
        success: true, 
        message: 'Admin deleted successfully'
      };
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete admin');
      dispatch(setError(errorMessage));
      return { success: false, message: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Clear error
  const clearAdminError = () => {
    dispatch(clearError());
  };

  return {
    // State
    allAdmins,
    isLoading,
    error,
    
    // Actions
    fetchAllAdmins,
    createAdmin,
    updateAdmin,
    updateAdminStatus,
    deleteAdmin,
    clearError: clearAdminError,
    
    // Legacy compatibility (now use API calls)
    getAllAdminAccounts: fetchAllAdmins,
    createAdminAccount: createAdmin,
    deleteAdminAccount: deleteAdmin
  };
};