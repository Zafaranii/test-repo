import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faUsers, 
  faBell, 
  faSignOutAlt,
  faEye,
  faEyeSlash,
  faEnvelope,
  faPhone,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faBuilding,
  faHome,
  faSyncAlt,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useMasterAuth, useAdminAuth } from '../../../hooks/useRedux';
import { usePropertyManagement } from '../../../hooks/usePropertyManagement';
import { apartmentPartsApi } from '../../../services/api';
import ApartmentCard from '../../../components/admin/ApartmentCard';
import SaleApartmentCard from '../../../components/admin/SaleApartmentCard';
import AddStudioModal from '../../../components/admin/AddStudioModal';
import AddApartmentModal from '../../../components/admin/AddApartmentModal';
import AddSaleApartmentModal from '../../../components/admin/AddSaleApartmentModal/AddSaleApartmentModal';
import { formatPhoneForAPI, validateEgyptianPhone, normalizePhoneInput } from '../../../utils/phoneUtils';
import './MasterAdminDashboard.css';
import heroImg from '../../../assets/images/backgrounds/LP.jpg';
import AYGLogo from '../../../assets/images/logo/AYG.png';

const MasterAdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout, updateProfile } = useMasterAuth();
  const { createAdminAccount, getAllAdminAccounts, deleteAdminAccount } = useAdminAuth();
  const { apartments, addApartment, addStudio, 
          saleApartments, addSaleApartment, getSaleApartmentsByCreator, fetchRentApartments, fetchSaleApartments } = usePropertyManagement();
  const [isAddStudioModalOpen, setIsAddStudioModalOpen] = useState(false);
  const [isAddApartmentModalOpen, setIsAddApartmentModalOpen] = useState(false);
  const [isAddSaleApartmentModalOpen, setIsAddSaleApartmentModalOpen] = useState(false);
  const [selectedApartmentId, setSelectedApartmentId] = useState(null);
  
  // Admin management states
  const [allAdmins, setAllAdmins] = useState([]);
  const [allStudios, setAllStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasInitialFetch = useRef(false);
  const isFetching = useRef(false);
  const [selectedAdminFilter, setSelectedAdminFilter] = useState('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('rental'); // 'rental' or 'sale'
  const [existingAdmins, setExistingAdmins] = useState([]);
  const [selectedAdminToDelete, setSelectedAdminToDelete] = useState('');
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);
  const [deleteAdminMessage, setDeleteAdminMessage] = useState({ type: '', text: '' });
  
  // Modal states
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isManageAdminsModalOpen, setIsManageAdminsModalOpen] = useState(false);
  
  // Edit Profile form state
  const [profileForm, setProfileForm] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [editType, setEditType] = useState('email'); // 'email' or 'password'
  
  // Password visibility states for Edit Profile
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Manage Admins form state
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    role: 'studio_rental' // Default role
  });
  const [adminErrors, setAdminErrors] = useState({});
  const [adminMessage, setAdminMessage] = useState({ type: '', text: '' });
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  
  // Password visibility states for Manage Admins
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Memoized fetch function to prevent infinite re-renders
  const fetchAllData = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);

    try {
      // Set up timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
setLoading(false);
      }, 10000); // 10 second timeout
      
      // Fetch rental and sale apartments using correct API endpoints

      let rentResult;
      try {
        rentResult = await Promise.race([
          fetchRentApartments(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Rent apartments timeout')), 5000))
        ]);

      } catch (rentError) {
}

      let saleResult;
      try {
        saleResult = await Promise.race([
          fetchSaleApartments(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Sale apartments timeout')), 5000))
        ]);

      } catch (saleError) {
}
      
      // Clear the timeout if we reach here
      clearTimeout(timeoutId);
      
      // Fetch studios data from apartmentPartsApi
      try {
        const studiosResponse = await Promise.race([
          apartmentPartsApi.getAll(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Studios timeout')), 5000))
        ]);

        setAllStudios(studiosResponse || []);
      } catch (studioError) {
setAllStudios([]);
      }

      // Fetch all admins using API

      try {
        const adminsResult = await Promise.race([
          getAllAdminAccounts(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Admins timeout')), 5000))
        ]);

        if (Array.isArray(adminsResult)) {
          setAllAdmins(adminsResult);
          setExistingAdmins(adminsResult);

        } else if (adminsResult?.success && Array.isArray(adminsResult.data)) {
          setAllAdmins(adminsResult.data);
          setExistingAdmins(adminsResult.data);

        } else {
setAllAdmins([]);
          setExistingAdmins([]);
        }
      } catch (adminError) {
setAllAdmins([]);
        setExistingAdmins([]);
      }

    } catch (error) {
setAllAdmins([]);
      setExistingAdmins([]);
      setAllStudios([]);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [currentUser, fetchRentApartments, fetchSaleApartments, getAllAdminAccounts]);

  // Fetch all data from API - only run once when component mounts
  useEffect(() => {
    // Prevent multiple simultaneous fetches and re-fetching
    if (!currentUser || hasInitialFetch.current || isFetching.current) {
      if (!currentUser) {
        setLoading(false);
      }
      return;
    }
    
    // Mark as fetching
    isFetching.current = true;
    hasInitialFetch.current = true;
    
    fetchAllData();
    
    // Emergency timeout - force loading to false after 15 seconds
    const emergencyTimeout = setTimeout(() => {
setLoading(false);
      isFetching.current = false;
    }, 15000);
    
    return () => {
      clearTimeout(emergencyTimeout);
      isFetching.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount - do not add dependencies
  
  // Memoize apartments enriched with their studios
  const apartmentsWithStudios = useMemo(() => {
    if (!apartments || apartments.length === 0 || !allStudios) {
      return apartments || [];
    }

    // Combine apartments with their studios
    return apartments.map(apartment => {
      // Find all studios that belong to this apartment
      const apartmentStudios = allStudios
        .filter(studio => studio.apartment_id === apartment.id)
        .map(studio => ({
          id: studio.id,
          apartmentId: studio.apartment_id,
          studioNumber: studio.title,
          title: studio.title,
          unitNumber: studio.title,
          rentValue: parseFloat(studio.monthly_price) || parseFloat(studio.rent_value) || 0,
          price: `${parseFloat(studio.monthly_price) || parseFloat(studio.rent_value) || 0} EGP/month`,
          area: `${parseFloat(studio.area) || 0} sq ft`,
          floor: `Floor ${studio.floor || 'N/A'}`,
          bedrooms: studio.bedrooms || 1,
          bathrooms: studio.bathrooms || 'private',
          furnished: studio.furnished || 'no',
          balcony: studio.balcony || 'no',
          description: studio.description || '',
          images: studio.photos_url || [],
          status: studio.status,
          isAvailable: studio.status === 'available',
          createdBy: studio.created_by_admin_id,
          createdAt: studio.created_at
        }));

      return {
        ...apartment,
        studios: apartmentStudios,
        totalStudios: apartment.total_parts || apartmentStudios.length
      };
    });
  }, [apartments, allStudios]);

  // Memoize filtered properties to prevent recalculation on every render
  const filteredProperties = useMemo(() => {
    let properties = propertyTypeFilter === 'rental' ? apartmentsWithStudios : saleApartments;
    
    if (selectedAdminFilter !== 'all') {
      properties = properties.filter(property => 
        property.listed_by_admin_id === parseInt(selectedAdminFilter) || 
        property.createdBy === parseInt(selectedAdminFilter)
      );
    }
    
    return properties;
  }, [apartmentsWithStudios, saleApartments, propertyTypeFilter, selectedAdminFilter]);

  // Note: Removed localStorage persistence to prevent unnecessary re-renders
  // Forms will reset when modals are closed, improving performance

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Toast notification function
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 4000);
  };

  // Edit Profile Modal Functions
  const openEditProfileModal = () => {

    setEditType('email'); // Default to email editing
    setProfileForm({
      email: currentUser?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setProfileErrors({});
    setProfileMessage({ type: '', text: '' });
    setIsEditProfileModalOpen(true);

  };

  const closeEditProfileModal = () => {
    setIsEditProfileModalOpen(false);
    setEditType('email'); // Reset to default
    setProfileForm({
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setProfileErrors({});
    setProfileMessage({ type: '', text: '' });
    // Reset password visibility
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfileForm = () => {
    const errors = {};
    
    // Current password is always required for verification
    if (!profileForm.currentPassword) {
      errors.currentPassword = 'Current password is required for verification';
    }
    
    if (editType === 'email') {
      // Email validation
      if (!profileForm.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
        errors.email = 'Email is invalid';
      }
    } else if (editType === 'password') {
      // Password validation
      if (!profileForm.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (profileForm.newPassword.length < 6) {
        errors.newPassword = 'New password must be at least 6 characters';
      }
      if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    setIsProfileSubmitting(true);
    setProfileMessage({ type: '', text: '' });

    try {
      // Check if user is authenticated
      if (!currentUser) {
        setProfileMessage({ type: 'error', text: 'You are not authenticated. Please login again.' });
        setIsProfileSubmitting(false);
        return;
      }

      // Prepare update parameters based on edit type
      let emailToUpdate = currentUser.email; // Keep current email by default
      let passwordToUpdate = null; // Don't change password by default
      
      if (editType === 'email') {
        emailToUpdate = profileForm.email;
        passwordToUpdate = null; // Don't change password when updating email
      } else if (editType === 'password') {
        emailToUpdate = currentUser.email; // Keep current email
        passwordToUpdate = profileForm.newPassword;
      }

      // Call the updateProfile method from context with proper data format
      const updateData = {
        email: emailToUpdate,
        currentPassword: profileForm.currentPassword,
        newPassword: passwordToUpdate
      };

      const result = await updateProfile(updateData);

      if (result.success) {
        const successMessage = editType === 'email' 
          ? 'Email updated successfully! Redirecting to login...'
          : 'Password updated successfully! Redirecting to login...';
          
        setProfileMessage({ 
          type: 'success', 
          text: successMessage
        });
        
        // Wait 2 seconds then logout and redirect to login
        setTimeout(() => {
          logout(); // This will clear the session
          navigate('/auth/master-admin-login'); // Redirect to login page
        }, 2000);

      } else {
        setProfileMessage({ 
          type: 'error', 
          text: result.message || 'Failed to update profile. Please try again.' 
        });
      }

    } catch (error) {
setProfileMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  // Manage Admins Modal Functions
  const openManageAdminsModal = async () => {

    // CRITICAL: Fetch fresh admin list FIRST before opening modal

    try {
      const adminsResponse = await getAllAdminAccounts();

      if (adminsResponse && Array.isArray(adminsResponse)) {

        
        setAllAdmins(adminsResponse);
        setExistingAdmins(adminsResponse);
      } else {
setAllAdmins([]);
        setExistingAdmins([]);
      }
    } catch (error) {
showToast('Failed to load admin list. Please try again.', 'error');
      // Don't open modal if we can't load the list
      return;
    }
    
    // Clear form and open modal AFTER loading data
    setAdminForm({
      name: '',
      email: '',
      password: '',
      mobile: '',
      role: 'studio_rental'
    });
    setAdminErrors({});
    setAdminMessage({ type: '', text: '' });
    setIsManageAdminsModalOpen(true);

  };

  const closeManageAdminsModal = () => {
    setIsManageAdminsModalOpen(false);
    setAdminForm({
      name: '',
      email: '',
      password: '',
      mobile: '',
      role: 'studio_rental' // Reset to default role when closing modal
    });
    setAdminErrors({});
    setAdminMessage({ type: '', text: '' });
    // Reset password visibility
    setShowAdminPassword(false);
  };

  const handleAdminInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Handle phone number input - allow only digits and preserve leading zero
    if (name === 'mobile') {
      // Remove any non-digit characters
      processedValue = value.replace(/\D/g, '');
      // Limit to 11 digits
      if (processedValue.length > 11) {
        processedValue = processedValue.slice(0, 11);
      }
    }
    
    setAdminForm(prev => ({ ...prev, [name]: processedValue }));
    if (adminErrors[name]) {
      setAdminErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateAdminForm = () => {
    const errors = {};

    if (!adminForm.name?.trim()) {
      errors.name = 'Name is required';
    }
    if (!adminForm.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(adminForm.email)) {
      errors.email = 'Email is invalid';
    }
    if (!adminForm.password?.trim()) {
      errors.password = 'Password is required';
    } else if (adminForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!adminForm.mobile?.trim()) {
      errors.mobile = 'Mobile number is required';
    } else {
      // Remove spaces and check length
      const cleanedMobile = adminForm.mobile.replace(/\s/g, '');
      
      // Must be 11 digits starting with 010, 011, 012, or 015
      if (!/^(010|011|012|015)\d{8}$/.test(cleanedMobile)) {
        errors.mobile = 'Must be 11 digits starting with 010, 011, 012, or 015 (e.g., 01012345678)';
      }
    }
    
    // Simplified role validation for debugging

    if (!adminForm.role) {

      errors.role = 'Please select a valid admin role';
    }

    setAdminErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();

    if (!validateAdminForm()) {

      return;
    }

    // Fetch fresh admin list to ensure we have latest data

    let freshAdmins = [];
    try {
      freshAdmins = await getAllAdminAccounts() || [];

    } catch (error) {
freshAdmins = existingAdmins; // Fallback to cached list
    }
    
    // Check for duplicate email
    const emailToCheck = adminForm.email.toLowerCase().trim();

    
    const existingAdminWithEmail = freshAdmins.find(admin => 
      admin.email?.toLowerCase() === emailToCheck
    );
    
    if (existingAdminWithEmail) {
      const errorMsg = `This email is already registered. An admin account with "${adminForm.email}" already exists. Please use a different email address.`;
setAdminMessage({ type: 'error', text: errorMsg });
      showToast(errorMsg, 'error');
      setIsAdminSubmitting(false);
      return;
    }
    
    // Check for duplicate phone
    const phoneToCheck = formatPhoneForAPI(adminForm.mobile.trim());

    
    const existingAdminWithPhone = freshAdmins.find(admin => {
      const adminPhone = admin.phone || admin.mobile || admin.mobileNumber || '';
      return adminPhone === phoneToCheck;
    });
    
    if (existingAdminWithPhone) {
      const errorMsg = `This phone number is already registered. An admin account with "${adminForm.mobile}" already exists. Please use a different phone number.`;
setAdminMessage({ type: 'error', text: errorMsg });
      showToast(errorMsg, 'error');
      setIsAdminSubmitting(false);
      return;
    }



    setIsAdminSubmitting(true);
    setAdminMessage({ type: '', text: '' });

    try {


      // Transform form data to match API requirements  
      const apiData = {
        full_name: adminForm.name.trim(),
        email: adminForm.email.toLowerCase().trim(),
        phone: formatPhoneForAPI(adminForm.mobile.trim()),
        password: adminForm.password.trim(),
        role: adminForm.role
      };

      // Create admin account via API

      const response = await createAdminAccount(apiData);

      if (response.success) {
        // Show success toast
        showToast('Admin created successfully!', 'success');
        
        // Clear the form
        setAdminForm({
          name: '',
          email: '',
          password: '',
          mobile: '',
          role: 'studio_rental'
        });
        setAdminErrors({});
        setAdminMessage({ type: '', text: '' });
        
        // Refresh admins list immediately after creation

        const adminsResponse = await getAllAdminAccounts();
        if (adminsResponse && Array.isArray(adminsResponse)) {

          setAllAdmins(adminsResponse);
          setExistingAdmins(adminsResponse);
        } else {
}
        
        // Close modal after a short delay
        setTimeout(() => {
          closeManageAdminsModal();
        }, 2000);
      } else {
let errorMsg = response.error || response.message || 'Failed to create admin account. Please try again.';
        
        // Make error message more user-friendly
        if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('exists') || errorMsg.toLowerCase().includes('duplicate')) {

          // Fetch fresh admin list to identify exactly what's duplicate
          try {
            const freshAdmins = await getAllAdminAccounts();

            if (freshAdmins && Array.isArray(freshAdmins)) {
              // Check email match - check BOTH 'email' and 'account' fields
              const matchingEmail = freshAdmins.find(a => {
                const adminEmail = (a.email || a.account || '').toLowerCase();
                const searchEmail = apiData.email.toLowerCase();
                return adminEmail === searchEmail;
              });
              
              // Check phone match - check ALL possible phone field variations
              const matchingPhone = freshAdmins.find(a => {
                const adminPhone = a.phone || a.mobile || a.mobileNumber || '';
                return adminPhone === apiData.phone;
              });
              
              if (matchingEmail && matchingPhone && matchingEmail.id === matchingPhone.id) {
                errorMsg = `Backend detected a duplicate but it's not showing in our admin list. This might be a database sync issue. Tried to create: Email: ${apiData.email} â€¢ Phone: ${apiData.phone}. Try refreshing the page or use completely different values.`;
              } else if (matchingEmail) {
                errorMsg = `Backend detected a duplicate but it's not showing in our admin list. This might be a database sync issue. Tried to create: Email: ${apiData.email} â€¢ Phone: ${apiData.phone}. Try refreshing the page or use completely different values.`;
              } else if (matchingPhone) {
                errorMsg = `Backend detected a duplicate but it's not showing in our admin list. This might be a database sync issue. Tried to create: Email: ${apiData.email} â€¢ Phone: ${apiData.phone}. Try refreshing the page or use completely different values.`;
              } else {
                errorMsg = `Backend detected a duplicate but it's not showing in our admin list. This might be a database sync issue. Tried to create: Email: ${apiData.email} â€¢ Phone: ${apiData.phone}. Try refreshing the page or use completely different values.`;
              }
            } else {
              errorMsg = `âŒ Backend says duplicate exists but could not fetch admin list to identify the issue.\n\nPlease try different email and phone number.`;
            }
          } catch (fetchError) {
            errorMsg = `âŒ Backend detected duplicate values but could not verify details.\n\nPlease try different email and phone number.`;
          }
        }
        
        setAdminMessage({ 
          type: 'error', 
          text: errorMsg
        });
        showToast(errorMsg, 'error');
      }

    } catch (error) {
const errorMsg = error.message || 'Failed to create admin account. Please try again.';
      setAdminMessage({ type: 'error', text: errorMsg });
      showToast(errorMsg, 'error');
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdminToDelete) {
      setDeleteAdminMessage({ type: 'error', text: 'Please select an admin to delete.' });
      return;
    }


    setIsDeletingAdmin(true);
    setDeleteAdminMessage({ type: '', text: '' });

    try {
      // Find the admin by ID
      const adminToDelete = existingAdmins.find(admin => admin.id === parseInt(selectedAdminToDelete));
      
      if (!adminToDelete) {
setDeleteAdminMessage({ type: 'error', text: 'Admin not found in the list.' });
        setIsDeletingAdmin(false);
        return;
      }

      // Call API to delete admin

      const response = await deleteAdminAccount(adminToDelete.id);

      if (response && response.success) {

        setDeleteAdminMessage({ 
          type: 'success', 
          text: `Admin "${adminToDelete.full_name || adminToDelete.name}" deleted successfully!` 
        });
        
        showToast('Admin account deleted successfully!', 'success');
        
        // Refresh the admin list

        const adminsResponse = await getAllAdminAccounts();

        if (adminsResponse) {
          setAllAdmins(adminsResponse);
          setExistingAdmins(adminsResponse);
        }
        
        // Reset selection
        setSelectedAdminToDelete('');
        
        // If the deleted admin was selected in filter, reset to 'all'
        if (selectedAdminFilter === String(adminToDelete.id)) {

          setSelectedAdminFilter('all');
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setDeleteAdminMessage({ type: '', text: '' });
        }, 3000);
      } else {
setDeleteAdminMessage({ 
          type: 'error', 
          text: (response && response.error) || (response && response.message) || 'Failed to delete admin account.' 
        });
        showToast('Failed to delete admin account', 'error');
      }
    } catch (error) {
const errorMessage = error.data?.detail || error.message || 'Failed to delete admin account. Please try again.';
      setDeleteAdminMessage({ type: 'error', text: errorMessage });
      showToast(errorMessage, 'error');
    } finally {
      setIsDeletingAdmin(false);

    }
  };

  const handleAddStudio = (apartmentId) => {
    setSelectedApartmentId(apartmentId);
    setIsAddStudioModalOpen(true);
  };

  const handleStudioAdded = async (newStudio) => {
    try {
      // Studio was already created by the modal - just close and refresh
      setIsAddStudioModalOpen(false);
      setSelectedApartmentId(null);
      await fetchRentApartments();
      // Also refresh studios so dashboard counts update
      try {
        const studiosResponse = await apartmentPartsApi.getAll();
        setAllStudios(studiosResponse || []);
      } catch (studioError) {
        // ignore
      }
    } catch (error) {
    }
  };

  const handleApartmentAdded = async (newApartment) => {
    try {
      // Apartment was already created by the modal - just close and refresh
      if (propertyTypeFilter === 'rental') {
        setIsAddApartmentModalOpen(false);
        await fetchRentApartments();
      } else {
        setIsAddSaleApartmentModalOpen(false);
        await fetchSaleApartments();
      }
    } catch (error) {
    }
  };

  const handleSaleApartmentAdded = async (newSaleApartment) => {
    try {
      // Apartment was already created by the modal - just close and refresh
      setIsAddSaleApartmentModalOpen(false);
      await fetchSaleApartments();
    } catch (error) {
    }
  };

  // Memoize statistics calculations to prevent recalculation on every render
  const statistics = useMemo(() => {
    const totalStudios = allStudios?.length || 0;
    const availableStudios = allStudios?.filter(studio => 
      studio.status === 'available' || studio.isAvailable
    )?.length || 0;
    
    return {
      totalApartments: apartments.length,
      totalSaleApartments: saleApartments.length,
      totalStudios,
      availableStudios,
      totalAdmins: allAdmins.length
    };
  }, [allStudios, apartments, saleApartments, allAdmins]);

  // Safety check for user authentication
  if (!currentUser) {

    return null; // Let the auth system handle the redirect
  }

  if (loading) {

    return (
      <div className="master-admin-dashboard loading">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="master-admin-dashboard">
      {/* Hero Section */}
      <section 
        className="dashboard-hero"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="dashboard-hero__overlay" />
        
        <nav className="dashboard-nav">
          <div className="nav-left">
            <img src={AYGLogo} alt="AYG logo" className="brand-logo" />
            <span className="brand-text">AYG</span>
          </div>
          
          <div className="nav-right">
            <button 
              className="nav-btn edit-profile-btn"
              onClick={openEditProfileModal}
            >
              <FontAwesomeIcon icon={faEdit} /> Edit Profile
            </button>
            <button 
              className="nav-btn manage-admins-btn"
              onClick={openManageAdminsModal}
            >
              <FontAwesomeIcon icon={faUsers} /> Manage Admins
            </button>
            <button 
              className="nav-btn rental-alerts-btn"
              onClick={() => navigate('/master-admin/rental-alerts')}
            >
              <FontAwesomeIcon icon={faBell} /> Rental Alerts
            </button>
            <button 
              className="nav-btn logout-btn"
              onClick={handleLogout}
            >
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
            </button>
          </div>
        </nav>

        <div className="dashboard-hero-content">
          <h1>Master Admin Dashboard</h1>
          
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-number">{statistics.totalApartments}</div>
              <div className="stat-label">Total Apartments</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{statistics.totalStudios}</div>
              <div className="stat-label">Total Studios</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{statistics.availableStudios}</div>
              <div className="stat-label">Available Studios</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h2>Property Management</h2>
            <div className="dashboard-header-buttons">
              <div className="admin-filter-section">
                <label htmlFor="property-type-filter">Property Type:</label>
                <select 
                  id="property-type-filter"
                  value={propertyTypeFilter} 
                  onChange={(e) => setPropertyTypeFilter(e.target.value)}
                  className="admin-filter-select"
                >
                  <option value="rental">Rental Apartments</option>
                  <option value="sale">Sale Apartments</option>
                </select>
              </div>
              <div className="admin-filter-section">
                <label htmlFor="admin-filter">Filter by Admin:</label>
                <select 
                  id="admin-filter"
                  value={selectedAdminFilter} 
                  onChange={(e) => setSelectedAdminFilter(e.target.value)}
                  className="admin-filter-select"
                >
                  <option value="all">All Admins</option>
                  {existingAdmins.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.full_name || admin.name || admin.username}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                className="add-apartment-btn"
                onClick={() => {
                  if (propertyTypeFilter === 'rental') {
                    setIsAddApartmentModalOpen(true);
                  } else {
                    setIsAddSaleApartmentModalOpen(true);
                  }
                }}
              >
                + Add New {propertyTypeFilter === 'rental' ? 'Rental' : 'Sale'} Apartment
              </button>
            </div>
          </div>

          <div className="apartments-grid">
            {propertyTypeFilter === 'rental' ? (
              filteredProperties.map(apartment => (
                <ApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  onAddStudio={handleAddStudio}
                />
              ))
            ) : (
              filteredProperties.map(apartment => (
                <SaleApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  isAdminView={false}
                  showCreatedBy={true}
                />
              ))
            )}
          </div>

          {filteredProperties.length === 0 && (
            <div className="empty-state">
              {selectedAdminFilter === 'all' ? (
                <>
                  <h3>No {propertyTypeFilter === 'rental' ? 'rental' : 'sale'} apartments found</h3>
                  <p>Start by adding your first {propertyTypeFilter === 'rental' ? 'rental apartment complex' : 'apartment for sale'}</p>
                </>
              ) : (
                <>
                  <h3>No {propertyTypeFilter === 'rental' ? 'rental' : 'sale'} properties found for selected admin</h3>
                  <p>This admin has not created any {propertyTypeFilter === 'rental' ? 'rental apartments' : 'apartments for sale'} yet</p>
                </>
              )}
              <button 
                className="add-apartment-btn"
                onClick={() => {
                  if (propertyTypeFilter === 'rental') {
                    setIsAddApartmentModalOpen(true);
                  } else {
                    setIsAddSaleApartmentModalOpen(true);
                  }
                }}
              >
                + Add First {propertyTypeFilter === 'rental' ? 'Rental' : 'Sale'} Apartment
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {isAddStudioModalOpen && (
        <AddStudioModal
          isOpen={isAddStudioModalOpen}
          apartmentId={selectedApartmentId}
          onStudioAdded={handleStudioAdded}
          onClose={() => {
            setIsAddStudioModalOpen(false);
            setSelectedApartmentId(null);
          }}
        />
      )}

      {isAddApartmentModalOpen && (
        <AddApartmentModal
          isOpen={isAddApartmentModalOpen}
          onApartmentAdded={handleApartmentAdded}
          onClose={() => setIsAddApartmentModalOpen(false)}
        />
      )}

      {isAddSaleApartmentModalOpen && (
        <AddSaleApartmentModal
          isOpen={isAddSaleApartmentModalOpen}
          onApartmentAdded={handleSaleApartmentAdded}
          onClose={() => setIsAddSaleApartmentModalOpen(false)}
        />
      )}

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div className="modal-overlay" onClick={closeEditProfileModal}>
          <div className="modal-content admin-management-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close-btn" onClick={closeEditProfileModal}>×</button>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="modal-form">
              {profileMessage.text && (
                <div className={`modal-message ${profileMessage.type}`}>
                  {profileMessage.text}
                </div>
              )}

              <div className="form-section">
                <h3>What would you like to update?</h3>
                
                {/* Choice Selection */}
                <div className="form-group" >
                  <div className="choice-buttons">
                    <button
                      type="button"
                      className={`choice-btn ${editType === 'email' ? 'active' : ''}`}
                      onClick={() => setEditType('email')}
                    >
                      <FontAwesomeIcon icon={faEnvelope} /> Update Email
                    </button>
                    <button
                      type="button"
                      className={`choice-btn ${editType === 'password' ? 'active' : ''}`}
                      onClick={() => setEditType('password')}
                    >
                      <FontAwesomeIcon icon={faEdit} /> Update Password
                    </button>
                  </div>
                </div>

                {/* Email Update Section */}
                {editType === 'email' && (
                  <div className="form-group" >
                    <label htmlFor="email">New Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileInputChange}
                      className={profileErrors.email ? 'error' : ''}
                      placeholder="Enter your new email address"
                    />
                    {profileErrors.email && <span className="error-text">{profileErrors.email}</span>}
                  </div>
                )}

                {/* Password Update Section */}
                {editType === 'password' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <div className="password-input-container">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="newPassword"
                          name="newPassword"
                          value={profileForm.newPassword}
                          onChange={handleProfileInputChange}
                          className={profileErrors.newPassword ? 'error' : ''}
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label="Toggle password visibility"
                        >
                          <FontAwesomeIcon icon={showNewPassword ? faEye : faEyeSlash} />
                        </button>
                      </div>
                      {profileErrors.newPassword && <span className="error-text">{profileErrors.newPassword}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <div className="password-input-container">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={profileForm.confirmPassword}
                          onChange={handleProfileInputChange}
                          className={profileErrors.confirmPassword ? 'error' : ''}
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label="Toggle password visibility"
                        >
                          <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} />
                        </button>
                      </div>
                      {profileErrors.confirmPassword && <span className="error-text">{profileErrors.confirmPassword}</span>}
                    </div>
                  </>
                )}
              </div>

              <div className="verification-section">
                <h3>Verification Required</h3>
                <div className="form-group">
                  <label htmlFor="currentPassword">Enter Current Password to Confirm Changes *</label>
                  <div className="password-input-container">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={profileForm.currentPassword}
                      onChange={handleProfileInputChange}
                      className={profileErrors.currentPassword ? 'error' : ''}
                      placeholder="Enter your current password to verify changes"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label="Toggle password visibility"
                    >
                      <FontAwesomeIcon icon={showCurrentPassword ? faEye : faEyeSlash} />
                    </button>
                  </div>
                  {profileErrors.currentPassword && <span className="error-text">{profileErrors.currentPassword}</span>}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeEditProfileModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isProfileSubmitting}>
                  {isProfileSubmitting 
                    ? 'Updating...' 
                    : editType === 'email' 
                      ? 'Update Email' 
                      : 'Update Password'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Admins Modal */}
      {isManageAdminsModalOpen && (
        <div className="modal-overlay" onClick={closeManageAdminsModal}>
          <div className="modal-content admin-management-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Admin Accounts</h2>
              <button className="modal-close-btn" onClick={closeManageAdminsModal}>×</button>
            </div>
            
            <div className="admin-management-content">
              {/* Existing Admins Section */}
              <div className="tab-section" style={{backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '24px'}}>
                <h3 style={{fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <FontAwesomeIcon icon={faUsers} /> Existing Admin Accounts ({existingAdmins.length})
                  <button 
                    type="button" 
                    onClick={async () => {

                      try {
                        const freshAdmins = await getAllAdminAccounts();
                        setAllAdmins(freshAdmins);
                        setExistingAdmins(freshAdmins);
                        showToast('Admin list refreshed!', 'success');
                      } catch (error) {
showToast('Failed to refresh admin list', 'error');
                      }
                    }}
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.85rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginLeft: 'auto'
                    }}
                  >
                    <FontAwesomeIcon icon={faSyncAlt} /> Refresh
                  </button>
                </h3>
                {existingAdmins.length === 0 ? (
                  <p style={{color: '#6b7280', fontSize: '0.9rem', margin: '8px 0'}}>No admins found. Create the first admin below.</p>
                ) : (
                  <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                    <table style={{width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse'}}>
                      <thead style={{position: 'sticky', top: 0, backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb'}}>
                        <tr>
                          <th style={{padding: '8px', textAlign: 'left', fontWeight: '600'}}>Name</th>
                          <th style={{padding: '8px', textAlign: 'left', fontWeight: '600'}}>Email</th>
                          <th style={{padding: '8px', textAlign: 'left', fontWeight: '600'}}>Phone</th>
                          <th style={{padding: '8px', textAlign: 'left', fontWeight: '600'}}>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {existingAdmins.map(admin => (
                          <tr key={admin.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                            <td style={{padding: '8px'}}>{admin.full_name || admin.name || admin.username || 'N/A'}</td>
                            <td style={{padding: '8px', color: '#3b82f6'}}>{admin.email}</td>
                            <td style={{padding: '8px', color: '#10b981'}}>{admin.phone || admin.mobile || admin.mobileNumber || 'N/A'}</td>
                            <td style={{padding: '8px'}}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                backgroundColor: admin.role === 'super_admin' ? '#fef3c7' : '#dbeafe',
                                color: admin.role === 'super_admin' ? '#92400e' : '#1e40af'
                              }}>
                                  {admin.role === 'super_admin' ? '★ Super Admin' : 
                                 admin.role === 'studio_rental' ? <><FontAwesomeIcon icon={faBuilding} /> Studio Rental</> : <><FontAwesomeIcon icon={faHome} /> Apt Sales</>}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p style={{color: '#6b7280', fontSize: '0.8rem', marginTop: '8px', fontStyle: 'italic'}}>
                  <FontAwesomeIcon icon={faInfoCircle} /> Make sure to use unique email and phone number when creating new admin
                </p>
              </div>

              <div className="tab-section">
                <h3>Create New Admin</h3>
                <form onSubmit={handleAdminSubmit} className="modal-form">
                  {adminMessage.text && (
                    <div className={`modal-message ${adminMessage.type}`}>
                      {adminMessage.text}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={adminForm.name}
                      onChange={handleAdminInputChange}
                      className={adminErrors.name ? 'error' : ''}
                      placeholder="Enter admin's full name"
                    />
                    {adminErrors.name && <span className="error-text">{adminErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={adminForm.email}
                      onChange={handleAdminInputChange}
                      onBlur={(e) => {
                        const emailValue = e.target.value.toLowerCase().trim();
                        if (!emailValue) return;

                        // Check BOTH email and account fields
                        const matchingAdmin = existingAdmins.find(a => {
                          const adminEmail = (a.email || a.account || '').toLowerCase();
                          return adminEmail === emailValue;
                        });
                        
                        if (matchingAdmin) {
                          setAdminErrors(prev => ({
                            ...prev,
                            email: `âš ï¸ Email already used by: ${matchingAdmin.full_name || matchingAdmin.name || 'existing admin'}`
                          }));
                        } else {
                          // Clear email error if it was previously set
                          setAdminErrors(prev => {
                            const newErrors = {...prev};
                            delete newErrors.email;
                            return newErrors;
                          });
                        }
                      }}
                      className={adminErrors.email ? 'error' : ''}
                      placeholder="Enter admin's email (must be unique)"
                    />
                    {adminErrors.email && <span className="error-text">{adminErrors.email}</span>}
                    {adminForm.email && !adminErrors.email && existingAdmins.length > 0 && (
                      <small style={{color: '#10b981', fontSize: '0.85rem', display: 'block', marginTop: '4px'}}>
                        <FontAwesomeIcon icon={faCheckCircle} /> Email is available
                      </small>
                    )}
                    {adminForm.email && !adminErrors.email && existingAdmins.length === 0 && (
                      <small style={{color: '#f59e0b', fontSize: '0.85rem', display: 'block', marginTop: '4px'}}>
                        <FontAwesomeIcon icon={faExclamationTriangle} /> Unable to verify - admin list not loaded
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-container">
                      <input
                        type={showAdminPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={adminForm.password}
                        onChange={handleAdminInputChange}
                        className={adminErrors.password ? 'error' : ''}
                        placeholder="Enter admin's password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        aria-label="Toggle password visibility"
                      >
                        <FontAwesomeIcon icon={showAdminPassword ? faEye : faEyeSlash} />
                      </button>
                    </div>
                    {adminErrors.password && <span className="error-text">{adminErrors.password}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="mobile">Mobile Phone (11 digits)</label>
                    <input
                      type="text"
                      id="mobile"
                      name="mobile"
                      value={adminForm.mobile}
                      onChange={handleAdminInputChange}
                      onBlur={(e) => {
                        const phoneValue = e.target.value.trim();
                        if (!phoneValue) return;
                        
                        if (/^(010|011|012|015)\d{8}$/.test(phoneValue)) {
                          const formattedPhone = formatPhoneForAPI(phoneValue);


                          
                          const matchingAdmin = existingAdmins.find(a => 
                            (a.phone || a.mobile || a.mobileNumber) === formattedPhone
                          );
                          
                          if (matchingAdmin) {

                            setAdminErrors(prev => ({
                              ...prev,
                              mobile: `âš ï¸ Phone already used by: ${matchingAdmin.full_name || matchingAdmin.name}`
                            }));
                          } else {

                            // Clear mobile error if it was previously set
                            setAdminErrors(prev => {
                              const newErrors = {...prev};
                              delete newErrors.mobile;
                              return newErrors;
                            });
                          }
                        }
                      }}
                      className={adminErrors.mobile ? 'error' : ''}
                      placeholder="01012345678 (must be unique)"
                      maxLength="11"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    {adminErrors.mobile && <span className="error-text">{adminErrors.mobile}</span>}
                    {!adminErrors.mobile && adminForm.mobile && /^(010|011|012|015)\d{8}$/.test(adminForm.mobile) && existingAdmins.length > 0 && (
                      <small style={{color: '#10b981', fontSize: '0.85rem', display: 'block', marginTop: '4px'}}>
                        <FontAwesomeIcon icon={faCheckCircle} /> Phone number is valid and available
                      </small>
                    )}
                    {!adminErrors.mobile && adminForm.mobile && /^(010|011|012|015)\d{8}$/.test(adminForm.mobile) && existingAdmins.length === 0 && (
                      <small style={{color: '#f59e0b', fontSize: '0.85rem', display: 'block', marginTop: '4px'}}>
                        <FontAwesomeIcon icon={faExclamationTriangle} /> Unable to verify - admin list not loaded
                      </small>
                    )}
                    {!adminErrors.mobile && (!adminForm.mobile || !/^(010|011|012|015)\d{8}$/.test(adminForm.mobile)) && (
                      <small className="field-hint" style={{color: '#6b7280', fontSize: '0.85rem', display: 'block', marginTop: '4px'}}>
                        Enter 11 digits starting with 010, 011, 012, or 015
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="role">Admin Role</label>
                    <select
                      id="role"
                      name="role"
                      value={adminForm.role}
                      onChange={handleAdminInputChange}
                      className={adminErrors.role ? 'error' : ''}
                    >
                      <option value="studio_rental">Studio Rental Manager</option>
                      <option value="apartment_sale">Apartment Sales Manager</option>
                    </select>
                    {adminErrors.role && <span className="error-text">{adminErrors.role}</span>}
                    <small className="field-description">
                      Studio Rental Managers can manage studio rentals, while Apartment Sales Managers can list apartments for sale.
                    </small>
                  </div>

                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={() => {
                        // Clear the form
                        setAdminForm({
                          name: '',
                          email: '',
                          password: '',
                          mobile: '',
                          role: 'studio_rental'
                        });
                        setAdminErrors({});
                        setAdminMessage({ type: '', text: '' });
                        showToast('Form cleared!', 'success');
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} /> Clear Form
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={async () => {

                        try {
                          const freshAdmins = await getAllAdminAccounts();
                          setAllAdmins(freshAdmins);
                          setExistingAdmins(freshAdmins);
                          showToast('Admin list refreshed!', 'success');
                        } catch (error) {
showToast('Failed to refresh admin list', 'error');
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faSyncAlt} /> Refresh List
                    </button>
                    <button type="submit" className="btn-primary" disabled={isAdminSubmitting}>
                      {isAdminSubmitting ? 'Creating...' : 'Create Admin'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="delete-admin-section">
                <h3>Delete Admin Account</h3>
                {deleteAdminMessage.text && (
                  <div className={`modal-message ${deleteAdminMessage.type}`}>
                    {deleteAdminMessage.text}
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="admin-to-delete">Select Admin to Delete</label>
                  <select 
                    id="admin-to-delete"
                    value={selectedAdminToDelete} 
                    onChange={(e) => {

                      setSelectedAdminToDelete(e.target.value);
                    }}
                    className="admin-select"
                  >
                    <option value="">-- Select Admin --</option>
                    {existingAdmins.map(admin => (
                      <option key={admin.id} value={admin.id}>
                        {admin.full_name || admin.name || admin.username}
                      </option>
                    ))}
                  </select>
                  {existingAdmins.length === 0 && (
                    <small className="field-hint" style={{color: '#6b7280', fontSize: '0.85rem', display: 'block', marginTop: '4px'}}>
                      No admins available to delete. Create an admin first.
                    </small>
                  )}
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-danger" 
                    onClick={handleDeleteAdmin}
                    disabled={isDeletingAdmin || !selectedAdminToDelete}
                    style={{
                      opacity: isDeletingAdmin || !selectedAdminToDelete ? 0.5 : 1,
                      cursor: isDeletingAdmin || !selectedAdminToDelete ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isDeletingAdmin ? 'Deleting...' : 'Delete Admin'}
                  </button>
                </div>
              </div>

              <div className="modal-actions main-actions">
                <button type="button" className="btn-secondary" onClick={closeManageAdminsModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            <span className="toast-icon">
              <FontAwesomeIcon icon={toast.type === 'success' ? faCheckCircle : faTimesCircle} />
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterAdminDashboard;
