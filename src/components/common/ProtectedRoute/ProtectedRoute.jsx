import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMasterAuth } from '../../../hooks/useRedux';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../LoadingSpinner';

const ProtectedRoute = ({ children, requireMasterAdmin = true }) => {
  const { currentUser, isLoading } = useMasterAuth();
  const location = useLocation();
  const masterAuthInitialized = useSelector(state => state.masterAuth?.initialized);
  const [initializationComplete, setInitializationComplete] = useState(false);

  useEffect(() => {
    // Wait for master auth initialization to complete
    if (masterAuthInitialized) {
      // Add a small delay to ensure Redux state is fully updated
      const timer = setTimeout(() => {
        setInitializationComplete(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [masterAuthInitialized]);

  // Show loading spinner while initializing or loading
  if (isLoading || !initializationComplete) {
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

  // After initialization, check if user is authenticated
  if (!currentUser && requireMasterAdmin) {
    // Add query parameter to indicate this redirect came from a protected route
    const redirectUrl = `/master-admin/login?from=protected&path=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={redirectUrl} replace />;
  }

  return children;
};

export default ProtectedRoute;