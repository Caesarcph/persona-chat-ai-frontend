/**
 * Settings store using Zustand for state management
 * Handles app settings with localStorage persistence
 */

import { create } from 'zustand';
import { AppSettings, DEFAULT_SETTINGS, ModelInfo } from '../types/settings';
import { i18n } from '../utils/i18n';

interface SettingsState {
  // Settings data
  settings: AppSettings;
  
  // Models data
  availableModels: ModelInfo[];
  isLoadingModels: boolean;
  modelsError: string | null;
  lastModelsUpdate: number | null;
  
  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setModels: (models: ModelInfo[]) => void;
  setLoadingModels: (loading: boolean) => void;
  setModelsError: (error: string | null) => void;
  
  // Model-specific actions
  selectModel: (modelName: string) => void;
  updateGenerationParams: (params: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
  }) => void;
  
  // Theme and accessibility actions
  setTheme: (theme: AppSettings['theme']) => void;
  setFontSize: (fontSize: AppSettings['fontSize']) => void;
  setLanguage: (language: AppSettings['language']) => void;
  toggleAnimations: () => void;
  toggleSounds: () => void;
  
  // Accessibility actions
  toggleScreenReader: () => void;
  toggleKeyboardNavigation: () => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  
  // Utility actions
  applyTheme: () => void;
  validateSettings: () => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
      // Initial state
      settings: DEFAULT_SETTINGS,
      availableModels: [],
      isLoadingModels: false,
      modelsError: null,
      lastModelsUpdate: null,
      
      // Settings actions
      updateSettings: (updates) => {
        set((state) => {
          const newSettings = { ...state.settings, ...updates };
          
          // Apply language change to i18n
          if (updates.language && updates.language !== state.settings.language) {
            i18n.setLanguage(updates.language);
          }
          
          // Persist to localStorage
          try {
            localStorage.setItem('persona-chat-settings', JSON.stringify(newSettings));
          } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
          }
          
          return {
            settings: newSettings,
          };
        });
        
        // Apply theme changes immediately
        if (updates.theme || updates.fontSize) {
          get().applyTheme();
        }
      },
      
      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
        
        // Clear localStorage
        try {
          localStorage.removeItem('persona-chat-settings');
        } catch (error) {
          console.warn('Failed to clear settings from localStorage:', error);
        }
        
        get().applyTheme();
        i18n.setLanguage(DEFAULT_SETTINGS.language);
      },
      
      // Models actions
      setModels: (models) => {
        set((state) => {
          let newSettings = state.settings;
          
          // Auto-select first model if none selected
          if (!state.settings.selectedModel && models.length > 0) {
            newSettings = {
              ...state.settings,
              selectedModel: models[0].name,
            };
            
            // Persist to localStorage
            try {
              localStorage.setItem('persona-chat-settings', JSON.stringify(newSettings));
            } catch (error) {
              console.warn('Failed to save settings to localStorage:', error);
            }
          }
          
          return {
            availableModels: models,
            lastModelsUpdate: Date.now(),
            modelsError: null,
            settings: newSettings,
          };
        });
      },
      
      setLoadingModels: (loading) => {
        set({ isLoadingModels: loading });
        if (loading) {
          set({ modelsError: null });
        }
      },
      
      setModelsError: (error) => {
        set({ 
          modelsError: error,
          isLoadingModels: false,
        });
      },
      
      // Model-specific actions
      selectModel: (modelName) => {
        set((state) => {
          const newSettings = {
            ...state.settings,
            selectedModel: modelName,
          };
          
          // Persist to localStorage
          try {
            localStorage.setItem('persona-chat-settings', JSON.stringify(newSettings));
          } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
          }
          
          return {
            settings: newSettings,
          };
        });
      },
      
      updateGenerationParams: (params) => {
        set((state) => {
          const newSettings = {
            ...state.settings,
            ...params,
          };
          
          // Persist to localStorage
          try {
            localStorage.setItem('persona-chat-settings', JSON.stringify(newSettings));
          } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
          }
          
          return {
            settings: newSettings,
          };
        });
      },
      
      // Theme and accessibility actions
      setTheme: (theme) => {
        set((state) => ({
          settings: {
            ...state.settings,
            theme,
          },
        }));
        get().applyTheme();
      },
      
      setFontSize: (fontSize) => {
        set((state) => ({
          settings: {
            ...state.settings,
            fontSize,
          },
        }));
        get().applyTheme();
      },
      
      setLanguage: (language) => {
        set((state) => ({
          settings: {
            ...state.settings,
            language,
          },
        }));
        i18n.setLanguage(language);
      },
      
      toggleAnimations: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            enableAnimations: !state.settings.enableAnimations,
          },
        }));
      },
      
      toggleSounds: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            enableSounds: !state.settings.enableSounds,
          },
        }));
      },
      
      // Accessibility actions
      toggleScreenReader: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            enableScreenReader: !state.settings.enableScreenReader,
          },
        }));
      },
      
      toggleKeyboardNavigation: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            enableKeyboardNavigation: !state.settings.enableKeyboardNavigation,
          },
        }));
      },
      
      toggleHighContrast: () => {
        set((state) => {
          const newHighContrast = !state.settings.enableHighContrast;
          const newSettings = {
            ...state.settings,
            enableHighContrast: newHighContrast,
            // Auto-switch to high contrast theme if enabling
            theme: newHighContrast ? 'high-contrast' as const : state.settings.theme,
          };
          
          return { settings: newSettings };
        });
        get().applyTheme();
      },
      
      toggleReducedMotion: () => {
        set((state) => {
          const newReducedMotion = !state.settings.enableReducedMotion;
          const newSettings = {
            ...state.settings,
            enableReducedMotion: newReducedMotion,
            // Disable animations if reduced motion is enabled
            enableAnimations: newReducedMotion ? false : state.settings.enableAnimations,
          };
          
          return { settings: newSettings };
        });
      },
      
      // Utility actions
      applyTheme: () => {
        const { settings } = get();
        const root = document.documentElement;
        
        // Apply theme class
        root.classList.remove('light', 'dark', 'high-contrast');
        root.classList.add(settings.theme);
        
        // Apply font size
        root.classList.remove('text-small', 'text-medium', 'text-large');
        root.classList.add(`text-${settings.fontSize}`);
        
        // Apply accessibility classes
        if (settings.enableHighContrast) {
          root.classList.add('high-contrast-mode');
        } else {
          root.classList.remove('high-contrast-mode');
        }
        
        if (settings.enableReducedMotion) {
          root.classList.add('reduced-motion');
        } else {
          root.classList.remove('reduced-motion');
        }
        
        // Set CSS custom properties for dynamic theming
        root.style.setProperty('--enable-animations', settings.enableAnimations ? '1' : '0');
        root.style.setProperty('--font-size-multiplier', 
          settings.fontSize === 'small' ? '0.875' : 
          settings.fontSize === 'large' ? '1.125' : '1'
        );
      },
      
      validateSettings: () => {
        const { settings } = get();
        
        // Validate temperature
        if (settings.temperature < 0.1 || settings.temperature > 2.0) {
          return false;
        }
        
        // Validate topP
        if (settings.topP < 0.1 || settings.topP > 1.0) {
          return false;
        }
        
        // Validate maxTokens
        if (settings.maxTokens < 100 || settings.maxTokens > 4096) {
          return false;
        }
        
        return true;
      },
    }));

// Selectors for better performance
export const useSettings = () => useSettingsStore((state) => state.settings);
export const useModels = () => useSettingsStore((state) => ({
  availableModels: state.availableModels,
  isLoadingModels: state.isLoadingModels,
  modelsError: state.modelsError,
  lastModelsUpdate: state.lastModelsUpdate,
}));

// Initialize settings from localStorage and apply theme on module load
if (typeof window !== 'undefined') {
  // Load settings from localStorage
  const loadStoredSettings = () => {
    try {
      const storedSettings = localStorage.getItem('persona-chat-settings');
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        
        // Update the store with loaded settings
        useSettingsStore.setState({ settings });
        
        // Apply theme immediately
        const root = document.documentElement;
        root.classList.add(settings.theme || 'light');
        root.classList.add(`text-${settings.fontSize || 'medium'}`);
        
        if (settings.enableHighContrast) {
          root.classList.add('high-contrast-mode');
        }
        
        if (settings.enableReducedMotion) {
          root.classList.add('reduced-motion');
        }
        
        i18n.setLanguage(settings.language || 'en');
        
        return settings;
      }
    } catch (error) {
      console.warn('Failed to load stored settings:', error);
    }
    
    return DEFAULT_SETTINGS;
  };
  
  // Load settings on module initialization
  loadStoredSettings();
}