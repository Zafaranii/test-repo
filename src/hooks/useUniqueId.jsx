import { useCallback } from 'react';

// Custom hook for generating unique IDs
const useUniqueId = () => {
  const generateId = useCallback((prefix = '') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
  }, []);

  const generateApartmentId = useCallback(() => {
    return generateId('apt');
  }, [generateId]);

  const generateStudioId = useCallback(() => {
    return generateId('studio');
  }, [generateId]);

  const generateAdminId = useCallback(() => {
    return generateId('admin');
  }, [generateId]);

  return {
    generateId,
    generateApartmentId,
    generateStudioId,
    generateAdminId
  };
};

export default useUniqueId;