/**
 * API Enum Constants
 * Based on AO Real Estate API Documentation v1
 * These enums must match the backend API exactly (case-sensitive)
 */

// Admin Role Enums
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  STUDIO_RENTAL: 'studio_rental', 
  APARTMENT_SALE: 'apartment_sale'
};

// Location presets for UI only (backend now accepts free-text location strings)
export const LOCATIONS = {
  MAADI: 'maadi',
  MOKKATTAM: 'mokkattam'
};

// Bathroom Type Enums (string values, not integers)
export const BATHROOM_TYPES = {
  PRIVATE: 'private',
  SHARED: 'shared'
};

// Apartment/Studio Part Status Enums
export const PART_STATUS = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  UPCOMING_END: 'upcoming_end'
};

// Furnished Status Enums (string values)
export const FURNISHED_STATUS = {
  YES: 'yes',
  NO: 'no'
};

// Balcony Type Enums
export const BALCONY_TYPES = {
  YES: 'yes',
  SHARED: 'shared',
  NO: 'no'
};

// Customer Source Enums (how customers found us)
export const CUSTOMER_SOURCES = {
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  GOOGLE: 'google',
  BAYUT: 'Bayut',
  AQAR_MAP: 'Aqar map',
  DUBIZZLE: 'Dubizzle',
  REFERRAL: 'referral',
  WALK_IN: 'walk_in',
  OTHER: 'other'
};

// Apartment Type Enums
export const APARTMENT_TYPES = {
  RENT: 'rent',
  SALE: 'sale'
};

// Contract Status Enums
export const CONTRACT_STATUS = {
  ACTIVE: true,
  INACTIVE: false
};

// Document Type Enums
export const DOCUMENT_TYPES = {
  PDF: 'pdf',
  DOC: 'doc',
  DOCX: 'docx'
};

// Payment Status Enums (if implemented)
export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue'
};

// Entity Types for File Uploads
export const ENTITY_TYPES = {
  RENT: 'rent',
  SALE: 'sale',
  PART: 'part'
};

/**
 * Helper Functions for Enum Validation and Conversion
 */

// Validate enum values
export const validateEnum = (value, enumObject, fieldName = 'field') => {
  const validValues = Object.values(enumObject);
  if (!validValues.includes(value)) {
    throw new Error(`Invalid ${fieldName}: "${value}". Valid values are: ${validValues.join(', ')}`);
  }
  return true;
};

// Get enum key by value
export const getEnumKey = (value, enumObject) => {
  return Object.keys(enumObject).find(key => enumObject[key] === value) || null;
};

// Convert frontend display values to API enum values
export const convertToApiEnum = {
  location: (displayValue) => {
    return String(displayValue || '').trim();
  },

  bathrooms: (displayValue) => {
    const normalizedValue = displayValue?.toLowerCase();
    switch (normalizedValue) {
      case 'private':
      case 'own':
      case 'personal':
        return BATHROOM_TYPES.PRIVATE;
      case 'shared':
      case 'common':
        return BATHROOM_TYPES.SHARED;
      default:
        return normalizedValue;
    }
  },

  furnished: (displayValue) => {
    if (typeof displayValue === 'boolean') {
      return displayValue ? FURNISHED_STATUS.YES : FURNISHED_STATUS.NO;
    }
    const normalizedValue = displayValue?.toLowerCase();
    switch (normalizedValue) {
      case 'yes':
      case 'true':
      case 'furnished':
        return FURNISHED_STATUS.YES;
      case 'no':
      case 'false':
      case 'unfurnished':
        return FURNISHED_STATUS.NO;
      default:
        return normalizedValue;
    }
  },

  balcony: (displayValue) => {
    const normalizedValue = displayValue?.toLowerCase();
    switch (normalizedValue) {
      case 'yes':
      case 'private':
      case 'own':
        return BALCONY_TYPES.YES;
      case 'shared':
      case 'common':
        return BALCONY_TYPES.SHARED;
      case 'no':
      case 'none':
        return BALCONY_TYPES.NO;
      default:
        return normalizedValue;
    }
  },

  customerSource: (displayValue) => {
    const rawValue = String(displayValue || '').trim();
    const normalizedValue = rawValue.toLowerCase();
    switch (normalizedValue) {
      case 'facebook':
      case 'fb':
        return CUSTOMER_SOURCES.FACEBOOK;
      case 'instagram':
      case 'ig':
      case 'insta':
        return CUSTOMER_SOURCES.INSTAGRAM;
      case 'google':
      case 'search':
        return CUSTOMER_SOURCES.GOOGLE;
      case 'bayut':
        return CUSTOMER_SOURCES.BAYUT;
      case 'aqar map':
      case 'aqarmap':
      case 'aqar_map':
        return CUSTOMER_SOURCES.AQAR_MAP;
      case 'dubizzle':
        return CUSTOMER_SOURCES.DUBIZZLE;
      case 'referral':
      case 'friend':
      case 'recommendation':
        return CUSTOMER_SOURCES.REFERRAL;
      case 'walk_in':
      case 'walk-in':
      case 'walkin':
      case 'direct':
        return CUSTOMER_SOURCES.WALK_IN;
      case 'other':
      default:
        return CUSTOMER_SOURCES.OTHER;
    }
  },

  adminRole: (displayValue) => {
    const normalizedValue = displayValue?.toLowerCase().replace(/\s+/g, '_');
    switch (normalizedValue) {
      case 'super_admin':
      case 'master_admin':
      case 'admin':
        return ADMIN_ROLES.SUPER_ADMIN;
      case 'studio_rental':
      case 'rental':
        return ADMIN_ROLES.STUDIO_RENTAL;
      case 'apartment_sale':
      case 'sale':
        return ADMIN_ROLES.APARTMENT_SALE;
      default:
        return normalizedValue;
    }
  },

  status: (displayValue) => {
    const normalizedValue = displayValue?.toLowerCase();
    switch (normalizedValue) {
      case 'available':
      case 'vacant':
      case 'free':
        return PART_STATUS.AVAILABLE;
      case 'rented':
      case 'occupied':
      case 'taken':
        return PART_STATUS.RENTED;
      case 'upcoming_end':
      case 'upcoming-end':
      case 'ending_soon':
        return PART_STATUS.UPCOMING_END;
      default:
        return normalizedValue;
    }
  }
};

// Convert API enum values to frontend display values
export const convertFromApiEnum = {
  location: (apiValue) => {
    return typeof apiValue === 'string' && apiValue.trim()
      ? apiValue.trim()
      : 'Unknown';
  },

  bathrooms: (apiValue) => {
    switch (apiValue) {
      case BATHROOM_TYPES.PRIVATE:
        return 'Private';
      case BATHROOM_TYPES.SHARED:
        return 'Shared';
      default:
        return apiValue?.charAt(0).toUpperCase() + apiValue?.slice(1) || 'Unknown';
    }
  },

  furnished: (apiValue) => {
    switch (apiValue) {
      case FURNISHED_STATUS.YES:
        return 'Furnished';
      case FURNISHED_STATUS.NO:
        return 'Unfurnished';
      default:
        return apiValue === true ? 'Furnished' : 'Unfurnished';
    }
  },

  balcony: (apiValue) => {
    switch (apiValue) {
      case BALCONY_TYPES.YES:
        return 'Private Balcony';
      case BALCONY_TYPES.SHARED:
        return 'Shared Balcony';
      case BALCONY_TYPES.NO:
        return 'No Balcony';
      default:
        return 'Unknown';
    }
  },

  customerSource: (apiValue) => {
    switch (apiValue) {
      case CUSTOMER_SOURCES.FACEBOOK:
        return 'Facebook';
      case CUSTOMER_SOURCES.INSTAGRAM:
        return 'Instagram';
      case CUSTOMER_SOURCES.GOOGLE:
        return 'Google';
      case CUSTOMER_SOURCES.BAYUT:
        return 'Bayut';
      case CUSTOMER_SOURCES.AQAR_MAP:
        return 'Aqar map';
      case CUSTOMER_SOURCES.DUBIZZLE:
        return 'Dubizzle';
      case CUSTOMER_SOURCES.REFERRAL:
        return 'Referral';
      case CUSTOMER_SOURCES.WALK_IN:
        return 'Walk-in';
      case CUSTOMER_SOURCES.OTHER:
        return 'Other';
      default:
        return apiValue?.charAt(0).toUpperCase() + apiValue?.slice(1) || 'Unknown';
    }
  },

  adminRole: (apiValue) => {
    switch (apiValue) {
      case ADMIN_ROLES.SUPER_ADMIN:
        return 'Super Admin';
      case ADMIN_ROLES.STUDIO_RENTAL:
        return 'Studio Rental';
      case ADMIN_ROLES.APARTMENT_SALE:
        return 'Apartment Sale';
      default:
        return apiValue?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
    }
  },

  status: (apiValue) => {
    switch (apiValue) {
      case PART_STATUS.AVAILABLE:
        return 'Available';
      case PART_STATUS.RENTED:
        return 'Rented';
      case PART_STATUS.UPCOMING_END:
        return 'Ending Soon';
      default:
        return apiValue?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
    }
  }
};

// Validation helpers
export const isValidLocation = (value) => typeof value === 'string' && value.trim().length > 0;
export const isValidBathroomType = (value) => Object.values(BATHROOM_TYPES).includes(value);
export const isValidFurnishedStatus = (value) => Object.values(FURNISHED_STATUS).includes(value);
export const isValidBalconyType = (value) => Object.values(BALCONY_TYPES).includes(value);
export const isValidCustomerSource = (value) => Object.values(CUSTOMER_SOURCES).includes(value);
export const isValidAdminRole = (value) => Object.values(ADMIN_ROLES).includes(value);
export const isValidPartStatus = (value) => Object.values(PART_STATUS).includes(value);

// Get all valid values for dropdowns/selects
export const getValidOptions = {
  locations: () => Object.values(LOCATIONS).map(value => ({
    value,
    label: convertFromApiEnum.location(value)
  })),

  bathroomTypes: () => Object.values(BATHROOM_TYPES).map(value => ({
    value,
    label: convertFromApiEnum.bathrooms(value)
  })),

  furnishedStatus: () => Object.values(FURNISHED_STATUS).map(value => ({
    value,
    label: convertFromApiEnum.furnished(value)
  })),

  balconyTypes: () => Object.values(BALCONY_TYPES).map(value => ({
    value,
    label: convertFromApiEnum.balcony(value)
  })),

  customerSources: () => Object.values(CUSTOMER_SOURCES).map(value => ({
    value,
    label: convertFromApiEnum.customerSource(value)
  })),

  adminRoles: () => Object.values(ADMIN_ROLES).map(value => ({
    value,
    label: convertFromApiEnum.adminRole(value)
  })),

  partStatuses: () => Object.values(PART_STATUS).map(value => ({
    value,
    label: convertFromApiEnum.status(value)
  }))
};

// Export default as combined constants object
const apiEnumsDefault = {
  ADMIN_ROLES,
  LOCATIONS,
  BATHROOM_TYPES,
  PART_STATUS,
  FURNISHED_STATUS,
  BALCONY_TYPES,
  CUSTOMER_SOURCES,
  APARTMENT_TYPES,
  CONTRACT_STATUS,
  DOCUMENT_TYPES,
  PAYMENT_STATUS,
  ENTITY_TYPES,
  validateEnum,
  getEnumKey,
  convertToApiEnum,
  convertFromApiEnum,
  isValidLocation,
  isValidBathroomType,
  isValidFurnishedStatus,
  isValidBalconyType,
  isValidCustomerSource,
  isValidAdminRole,
  isValidPartStatus,
  getValidOptions
};

export default apiEnumsDefault;