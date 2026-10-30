// Redux middleware for localStorage synchronization
const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Get current state after action is processed
  const state = store.getState();
  
  // Define which actions should trigger localStorage sync
  const propertyActions = [
    'property/addApartment',
    'property/updateApartment', 
    'property/deleteApartment',
    'property/addStudio',
    'property/updateStudio',
    'property/deleteStudio',
    'property/toggleStudioAvailability',
    'property/addSaleApartment',
    'property/updateSaleApartment',
    'property/deleteSaleApartment',
    'property/setApartments',
    'property/setSaleApartments',
    'property/clearAllData'
  ];
  
  // If this is a property action, ensure localStorage is synced
  if (propertyActions.includes(action.type)) {
    try {
      // The propertySlice reducers already handle localStorage saves
    } catch (error) {
      // ignore
    }
  }
  
  return result;
};

export default localStorageMiddleware;
