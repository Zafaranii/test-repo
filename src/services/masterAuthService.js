/**
 * Master Admin Authentication Service
 * Provides comprehensive authentication logic with credential validation
 * against static database backend
 */

import { authApi, adminApi } from './api';

class MasterAuthService {
  constructor() {
    this.isAuthenticating = false;
    this.lastAuthAttempt = null;
  }

  /**
   * Authenticate master admin with comprehensive validation
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.identifier - Email or phone number
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>} Authentication result
   */
  async authenticateMasterAdmin(credentials) {
    const { identifier, password } = credentials;
    
    if (this.isAuthenticating) {
      throw new Error('Authentication already in progress');
    }

    this.isAuthenticating = true;
    this.lastAuthAttempt = new Date();

    try {
      // Step 1: Validate input format
      const validationResult = this.validateCredentials(identifier, password);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      // Step 2: Attempt authentication against static database

      await this.validateWithBackend(identifier, password);

      // Step 3: Fetch and validate user profile

      const userProfile = await this.fetchUserProfile();

      // Step 4: Verify master admin role

      const roleValidation = this.validateMasterRole(userProfile);
      if (!roleValidation.isValid) {
        authApi.logout(); // Clear token
        throw new Error(roleValidation.error);
      }

      // Step 5: Cross-validate credentials with profile

      const crossValidation = this.crossValidateCredentials(identifier, userProfile);
      if (!crossValidation.isValid) {
        authApi.logout(); // Clear token
        throw new Error(crossValidation.error);
      }

      // Step 6: Final security checks
      const securityCheck = this.performSecurityChecks(userProfile);
      if (!securityCheck.isValid) {
        authApi.logout(); // Clear token
        throw new Error(securityCheck.error);
      }

      const successResult = {
        success: true,
        user: userProfile,
        loginTime: new Date().toISOString(),
        authMethod: this.determineIdentifierType(identifier),
        sessionId: this.generateSessionId()
      };

      return successResult;

    } catch (error) {
      console.error('❌ Master Admin Authentication Failed', {
        identifier: identifier,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // Ensure clean state on failure
      authApi.logout();

      throw new Error(this.formatErrorMessage(error));
    } finally {
      this.isAuthenticating = false;
    }
  }

  /**
   * Validate credential format
   * @param {string} identifier - Email or phone
   * @param {string} password - Password
   * @returns {Object} Validation result
   */
  validateCredentials(identifier, password) {
    if (!identifier || !password) {
      return {
        isValid: false,
        error: 'Email/phone and password are required'
      };
    }

    if (password.length < 6) {
      return {
        isValid: false,
        error: 'Password must be at least 6 characters long'
      };
    }

    const isEmail = identifier.includes('@');
    const isPhone = /^(\+20|0)?1[0-9]{9}$/.test(identifier.replace(/\s/g, ''));

    if (!isEmail && !isPhone) {
      return {
        isValid: false,
        error: 'Please enter a valid email address or Egyptian mobile number'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate credentials against backend
   * @param {string} identifier - Email or phone
   * @param {string} password - Password
   * @returns {Promise<Object>} Authentication result
   */
  async validateWithBackend(identifier, password) {
    try {
      const loginResponse = await authApi.login(identifier, password);
      
      if (!loginResponse.access_token) {
        throw new Error('No access token received from backend');
      }

      return {
        success: true,
        token: loginResponse.access_token,
        tokenType: loginResponse.token_type
      };

    } catch (error) {
if (error.status === 401) {
        throw new Error('Invalid email/phone or password. Please check your credentials.');
      } else if (error.status === 422) {
        throw new Error('Invalid input format. Please check your email or phone number.');
      } else if (error.status === 404) {
        throw new Error('Account not found. Please verify your credentials.');
      } else {
        throw new Error('Authentication service unavailable. Please try again later.');
      }
    }
  }

  /**
   * Fetch user profile from backend
   * @returns {Promise<Object>} User profile
   */
  async fetchUserProfile() {
    try {
      const userProfile = await adminApi.getMe();

      return userProfile;
    } catch (error) {
throw new Error('Failed to retrieve user profile from database');
    }
  }

  /**
   * Validate master admin role
   * @param {Object} userProfile - User profile from backend
   * @returns {Object} Validation result
   */
  validateMasterRole(userProfile) {
    const validRoles = ['super_admin', 'master_admin'];
    
    if (!userProfile.role || !validRoles.includes(userProfile.role)) {
      return {
        isValid: false,
        error: `Access denied: Master admin privileges required. Current role: ${userProfile.role || 'undefined'}`
      };
    }

    return { isValid: true };
  }

  /**
   * Cross-validate login credentials with user profile
   * @param {string} identifier - Login identifier
   * @param {Object} userProfile - User profile from backend
   * @returns {Object} Validation result
   */
  crossValidateCredentials(identifier, userProfile) {
    const isEmail = identifier.includes('@');
    
    if (isEmail) {
      const profileEmail = userProfile.email?.toLowerCase();
      const inputEmail = identifier.toLowerCase();
      
      if (profileEmail !== inputEmail) {
return {
          isValid: false,
          error: 'Email validation failed: Login email does not match profile'
        };
      }
    } else {
      // Phone validation
      const normalizedInputPhone = identifier.replace(/[^0-9+]/g, '');
      const normalizedProfilePhone = userProfile.phone?.replace(/[^0-9+]/g, '');
      
      if (normalizedProfilePhone !== normalizedInputPhone) {
return {
          isValid: false,
          error: 'Phone validation failed: Login phone does not match profile'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Perform additional security checks
   * @param {Object} userProfile - User profile
   * @returns {Object} Security check result
   */
  performSecurityChecks(userProfile) {
    // Check for required profile fields
    if (!userProfile.email && !userProfile.phone) {
      return {
        isValid: false,
        error: 'Invalid user profile: Missing contact information'
      };
    }

    if (!userProfile.full_name) {
      return {
        isValid: false,
        error: 'Invalid user profile: Missing user information'
      };
    }

    // Check for account status (if available)
    if (userProfile.status === 'inactive' || userProfile.is_active === false) {
      return {
        isValid: false,
        error: 'Account is inactive. Please contact system administrator.'
      };
    }

    return { isValid: true };
  }

  /**
   * Determine identifier type (email or phone)
   * @param {string} identifier - Login identifier
   * @returns {string} Type ('email' or 'phone')
   */
  determineIdentifierType(identifier) {
    return identifier.includes('@') ? 'email' : 'phone';
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `mas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format error message for user display
   * @param {Error} error - Original error
   * @returns {string} Formatted error message
   */
  formatErrorMessage(error) {
    const message = error.message || 'Authentication failed';
    
    // Don't expose sensitive internal errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'Authentication request timed out. Please try again.';
    }
    
    return message;
  }

  /**
   * Check if user is currently authenticated
   * @returns {boolean} Authentication status
   */
  isCurrentlyAuthenticated() {
    return authApi.isAuthenticated();
  }

  /**
   * Log out current user
   */
  logout() {

    authApi.logout();
  }

  /**
   * Get authentication statistics
   * @returns {Object} Auth statistics
   */
  getAuthStats() {
    return {
      lastAuthAttempt: this.lastAuthAttempt,
      isAuthenticating: this.isAuthenticating,
      isAuthenticated: this.isCurrentlyAuthenticated()
    };
  }
}

// Create and export singleton instance
const masterAuthService = new MasterAuthService();
export default masterAuthService;

// Export for direct usage
export { MasterAuthService };
