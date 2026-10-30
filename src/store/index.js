import { configureStore } from '@reduxjs/toolkit';

// Import middleware
import localStorageMiddleware from './middleware/localStorageMiddleware';

// Import all slices
import propertyReducer from './slices/propertySlice';
import adminAuthReducer from './slices/adminAuthSlice';
import masterAuthReducer from './slices/masterAuthSlice';
import themeReducer from './slices/themeSlice';

// Configure the store
export const store = configureStore({
  reducer: {
    property: propertyReducer,
    adminAuth: adminAuthReducer,
    masterAuth: masterAuthReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for non-serializable values
        ignoredActionsPaths: ['payload.timestamp'],
        ignoredPaths: ['adminAuth.currentAdmin.loginTime', 'masterAuth.currentUser.loginTime'],
      },
    }).concat(localStorageMiddleware), // Add localStorage middleware
  devTools: !import.meta.env.PROD,
});

// Export store instance for direct access if needed
export default store;