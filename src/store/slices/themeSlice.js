import { createSlice } from '@reduxjs/toolkit';

// Theme constants
const THEME_STORAGE_KEY = 'app_theme';
const isBrowser = typeof window !== 'undefined';

// Get stored theme from localStorage
const getStoredTheme = () => {
  if (!isBrowser) return 'light';
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme || 'light'; // Default to light theme
  } catch (error) {
return 'light';
  }
};

// Save theme to localStorage
const saveTheme = (theme) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
}
};

// Initial state
const initialState = {
  currentTheme: getStoredTheme(),
  availableThemes: ['light', 'dark'],
  systemPreference: 'light', // Could be detected from system
  customThemes: [] // For future custom theme support
};

// Theme slice
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      const newTheme = action.payload;
      if (state.availableThemes.includes(newTheme)) {
        state.currentTheme = newTheme;
        saveTheme(newTheme);
      }
    },
    toggleTheme: (state) => {
      const newTheme = state.currentTheme === 'light' ? 'dark' : 'light';
      state.currentTheme = newTheme;
      saveTheme(newTheme);
    },
    setSystemPreference: (state, action) => {
      state.systemPreference = action.payload;
    },
    useSystemTheme: (state) => {
      state.currentTheme = state.systemPreference;
      saveTheme(state.systemPreference);
    },
    addCustomTheme: (state, action) => {
      const { name, config } = action.payload;
      const existingIndex = state.customThemes.findIndex(theme => theme.name === name);
      
      if (existingIndex !== -1) {
        // Update existing custom theme
        state.customThemes[existingIndex] = { name, config };
      } else {
        // Add new custom theme
        state.customThemes.push({ name, config });
        state.availableThemes.push(name);
      }
    },
    removeCustomTheme: (state, action) => {
      const themeName = action.payload;
      state.customThemes = state.customThemes.filter(theme => theme.name !== themeName);
      state.availableThemes = state.availableThemes.filter(theme => theme !== themeName);
      
      // If current theme is being removed, switch to light theme
      if (state.currentTheme === themeName) {
        state.currentTheme = 'light';
        saveTheme('light');
      }
    },
    resetToDefault: (state) => {
      state.currentTheme = 'light';
      state.customThemes = [];
      state.availableThemes = ['light', 'dark'];
      saveTheme('light');
    }
  }
});

// Export actions
export const {
  setTheme,
  toggleTheme,
  setSystemPreference,
  useSystemTheme,
  addCustomTheme,
  removeCustomTheme,
  resetToDefault
} = themeSlice.actions;

// Thunk for detecting system theme preference
export const detectSystemTheme = () => (dispatch) => {
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      const systemTheme = prefersDark.matches ? 'dark' : 'light';
      
      dispatch(setSystemPreference(systemTheme));
      
      // Listen for system theme changes
      prefersDark.addEventListener('change', (e) => {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        dispatch(setSystemPreference(newSystemTheme));
      });
      
      return systemTheme;
    }
  } catch (error) {
}
  return 'light';
};

// Selectors
export const selectTheme = (state) => state.theme;
export const selectCurrentTheme = (state) => state.theme.currentTheme;
export const selectAvailableThemes = (state) => state.theme.availableThemes;
export const selectSystemPreference = (state) => state.theme.systemPreference;
export const selectCustomThemes = (state) => state.theme.customThemes;
export const selectIsDarkTheme = (state) => state.theme.currentTheme === 'dark';
export const selectIsLightTheme = (state) => state.theme.currentTheme === 'light';
export const selectIsCustomTheme = (state) => 
  !['light', 'dark'].includes(state.theme.currentTheme);

export const selectThemeConfig = (state) => {
  const { currentTheme, customThemes } = state.theme;
  
  // Return built-in theme config
  if (currentTheme === 'light' || currentTheme === 'dark') {
    return {
      name: currentTheme,
      type: 'built-in',
      isDark: currentTheme === 'dark'
    };
  }
  
  // Return custom theme config
  const customTheme = customThemes.find(theme => theme.name === currentTheme);
  if (customTheme) {
    return {
      name: customTheme.name,
      type: 'custom',
      config: customTheme.config
    };
  }
  
  // Fallback to light theme
  return {
    name: 'light',
    type: 'built-in',
    isDark: false
  };
};

export default themeSlice.reducer;