/**
 * Phone number formatting utilities for Egyptian phone numbers
 * Handles phone numbers without requiring +2 prefix from user input
 */

/**
 * Formats a phone number for display (adds +20 if not present)
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number with +20 prefix
 */
export const formatPhoneForDisplay = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all spaces, dashes, parentheses
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  // If already has +20, return as is
  if (cleaned.startsWith('+20')) {
    return cleaned;
  }
  
  // If starts with 20, add +
  if (cleaned.startsWith('20')) {
    return `+${cleaned}`;
  }
  
  // If starts with 0, replace with +20
  if (cleaned.startsWith('0')) {
    return `+2${cleaned}`;
  }
  
  // If starts with 1 (Egyptian mobile format), add +20
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    return `+20${cleaned}`;
  }
  
  // Otherwise, assume it's Egyptian mobile and add +20
  return `+20${cleaned}`;
};

/**
 * Formats a phone number for API submission (ensures +20 prefix)
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Phone number formatted for API
 */
export const formatPhoneForAPI = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all spaces, dashes, parentheses
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  // If already has +20, return as is
  if (cleaned.startsWith('+20')) {
    return cleaned;
  }
  
  // If starts with 20, add +
  if (cleaned.startsWith('20')) {
    return `+${cleaned}`;
  }
  
  // If starts with 0 (Egyptian format 010, 011, 012, 015)
  // Convert 01XXXXXXXXX (11 digits) to +201XXXXXXXXX
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+2${cleaned}`;
  }
  
  // If starts with 0 but not 11 digits, still try to format
  if (cleaned.startsWith('0')) {
    return `+2${cleaned}`;
  }
  
  // If starts with 1 (Egyptian mobile format without leading 0), add +20
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    return `+20${cleaned}`;
  }
  
  // Otherwise, assume it's Egyptian mobile and add +20
  return `+20${cleaned}`;
};

/**
 * Normalizes user input for phone numbers (removes +2 requirement)
 * @param {string} phoneNumber - The user input phone number
 * @returns {string} - Normalized phone number (without +20 for user input)
 */
export const normalizePhoneInput = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all spaces, dashes, parentheses
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  // Only allow digits
  const digitsOnly = cleaned.replace(/[^0-9]/g, '');
  
  // If has +20 prefix, remove it for user input
  if (cleaned.startsWith('+20')) {
    return cleaned.substring(3);
  }
  
  // If starts with 20 (but not 0), assume it's +20 prefix without +
  if (cleaned.startsWith('20') && !cleaned.startsWith('0')) {
    return cleaned.substring(2);
  }
  
  // Keep leading 0 for Egyptian format (01XXXXXXXXX - 11 digits)
  // This is the standard Egyptian mobile format
  return digitsOnly;
};

/**
 * Validates Egyptian phone number
 * @param {string} phoneNumber - The phone number to validate
 * @returns {object} - Validation result with isValid and error
 */
export const validateEgyptianPhone = (phoneNumber) => {
  if (!phoneNumber || !phoneNumber.trim()) {
    return {
      isValid: false,
      error: 'Phone number is required'
    };
  }

  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  // Only allow digits (and + at start)
  const digitsOnly = cleaned.replace(/^\+/, '').replace(/[^0-9]/g, '');
  
  // Primary format: 010/011/012/015 followed by 8 digits (11 total)
  // This is the standard Egyptian mobile format
  if (/^(010|011|012|015)\d{8}$/.test(digitsOnly)) {
    return {
      isValid: true,
      error: null
    };
  }
  
  // Also allow with +20 or 20 prefix: +20 10/11/12/15 + 8 digits
  if (/^(20)?(10|11|12|15)\d{8}$/.test(digitsOnly)) {
    return {
      isValid: true,
      error: null
    };
  }
  
  // Check if user is still typing (allow partial input)
  if (/^0[1]?[0-5]?$/.test(digitsOnly) || digitsOnly.length < 11) {
    return {
      isValid: false,
      error: `Please enter 11 digits (currently ${digitsOnly.length}/11)`
    };
  }
  
  return {
    isValid: false,
    error: 'Must be 11 digits starting with 010, 011, 012, or 015 (e.g., 01012345678)'
  };
};

/**
 * Formats phone number for display in UI (user-friendly format)
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - User-friendly formatted phone number
 */
export const formatPhoneForUI = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  const formatted = formatPhoneForDisplay(phoneNumber);
  
  // Add spacing for better readability: +20 1XX XXX XXXX
  if (formatted.startsWith('+20') && formatted.length === 13) {
    return `${formatted.substring(0, 3)} ${formatted.substring(3, 6)} ${formatted.substring(6, 9)} ${formatted.substring(9)}`;
  }
  
  return formatted;
};

/**
 * Creates a WhatsApp URL with the formatted phone number
 * @param {string} phoneNumber - The phone number
 * @param {string} message - Optional pre-filled message
 * @returns {string} - WhatsApp URL
 */
export const createWhatsAppURL = (phoneNumber, message = '') => {
  const formattedPhone = formatPhoneForAPI(phoneNumber);
  // Remove + from phone number for WhatsApp URL
  const whatsappPhone = formattedPhone.replace('+', '');
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${whatsappPhone}${message ? `?text=${encodedMessage}` : ''}`;
};