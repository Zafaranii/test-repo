import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { authApi } from '../../../services/api';
import LoadingSpinner from '../LoadingSpinner';

/**
 * AdminProtectedRoute Component
 * Protects regular admin routes and ensures authentication persistence across page refreshes
 * Verifies JWT token on mount and restores admin session from API
 */
const AdminProtectedRoute = ({ children }) => {
  const { currentAdmin, isLoading, initializeAdminAuth } = useAdminAuth();
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // Only initialize once
      if (initializationAttempted) {
        return;
      }

      setInitializationAttempted(true);

      try {
        // Check if we have a JWT token
        const hasToken = authApi.isAuthenticated();
        
        if (hasToken && !currentAdmin) {

          // Initialize admin auth from token
          const result = await initializeAdminAuth();
          
          if (result.success) {

          } else {

          }
        } else if (!hasToken) {

        } else {

        }
      } catch (error) {
} finally {
        // Small delay to ensure state updates are processed
        setTimeout(() => {
          setIsInitializing(false);

        }, 100);
      }
    };

    initAuth();
  }, [initializeAdminAuth, currentAdmin, initializationAttempted]);

  // Show loading spinner while initializing
  if (isInitializing || isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  // After initialization, check if admin is authenticated
  if (!currentAdmin) {

    // Redirect to admin login page
    const redirectUrl = `/admin/login?from=protected&path=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={redirectUrl} replace />;
  }

  // Admin is authenticated, render protected content

  return children;
};

export default AdminProtectedRoute;
