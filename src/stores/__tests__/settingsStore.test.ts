/**
 * Tests for settings store
 */

import { renderHook, act } from '@testing-library/react';
import { useSettingsStore } from '../settingsStore';
import { DEFAULT_SETTINGS } from '../../types/settings';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock i18n
jest.mock('../../utils/i18n', () => ({
  i18n: {
    setLanguage: jest.fn(),
  },
}));

describe('settingsStore', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset store to initial state
    useSettingsStore.setState({
      settings: DEFAULT_SETTINGS,
      availableModels: [],
      isLoadingModels: false,
      modelsError: null,
      lastModelsUpdate: null,
    });
  });

  describe('initial state', () => {
    it('should have default settings', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
      expect(result.current.availableModels).toEqual([]);
      expect(result.current.isLoadingModels).toBe(false);
      expect(result.current.modelsError).toBeNull();
    });
  });

  describe('updateSettings', () => {
    it('should update settings and persist to localStorage', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.updateSettings({ theme: 'dark', fontSize: 'large' });
      });
      
      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.fontSize).toBe('large');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'persona-chat-settings',
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          theme: 'dark',
          fontSize: 'large',
        })
      );
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.updateSettings({ theme: 'dark' });
      });
      
      expect(result.current.settings.theme).toBe('dark');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save settings to localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('resetSettings', () => {
    it('should reset to default settings and clear localStorage', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // First update settings
      act(() => {
        result.current.updateSettings({ theme: 'dark', fontSize: 'large' });
      });
      
      // Then reset
      act(() => {
        result.current.resetSettings();
      });
      
      expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('persona-chat-settings');
    });
  });

  describe('model management', () => {
    it('should set models and auto-select first model', () => {
      const { result } = renderHook(() => useSettingsStore());
      const mockModels = [
        { name: 'model1', size: 1000, modified_at: '2023-01-01' },
        { name: 'model2', size: 2000, modified_at: '2023-01-02' },
      ];
      
      act(() => {
        result.current.setModels(mockModels);
      });
      
      expect(result.current.availableModels).toEqual(mockModels);
      expect(result.current.settings.selectedModel).toBe('model1');
      expect(result.current.modelsError).toBeNull();
      expect(result.current.lastModelsUpdate).toBeGreaterThan(0);
    });

    it('should not auto-select if model already selected', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      // First set a selected model
      act(() => {
        result.current.updateSettings({ selectedModel: 'existing-model' });
      });
      
      const mockModels = [
        { name: 'model1', size: 1000, modified_at: '2023-01-01' },
      ];
      
      act(() => {
        result.current.setModels(mockModels);
      });
      
      expect(result.current.settings.selectedModel).toBe('existing-model');
    });

    it('should handle loading states', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.setLoadingModels(true);
      });
      
      expect(result.current.isLoadingModels).toBe(true);
      expect(result.current.modelsError).toBeNull();
      
      act(() => {
        result.current.setLoadingModels(false);
      });
      
      expect(result.current.isLoadingModels).toBe(false);
    });

    it('should handle model errors', () => {
      const { result } = renderHook(() => useSettingsStore());
      const errorMessage = 'Failed to load models';
      
      act(() => {
        result.current.setModelsError(errorMessage);
      });
      
      expect(result.current.modelsError).toBe(errorMessage);
      expect(result.current.isLoadingModels).toBe(false);
    });
  });

  describe('theme and accessibility', () => {
    it('should toggle animations', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.settings.enableAnimations).toBe(true);
      
      act(() => {
        result.current.toggleAnimations();
      });
      
      expect(result.current.settings.enableAnimations).toBe(false);
    });

    it('should toggle high contrast and update theme', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.settings.enableHighContrast).toBe(false);
      expect(result.current.settings.theme).toBe('light');
      
      act(() => {
        result.current.toggleHighContrast();
      });
      
      expect(result.current.settings.enableHighContrast).toBe(true);
      expect(result.current.settings.theme).toBe('high-contrast');
    });

    it('should toggle reduced motion and disable animations', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.settings.enableReducedMotion).toBe(false);
      expect(result.current.settings.enableAnimations).toBe(true);
      
      act(() => {
        result.current.toggleReducedMotion();
      });
      
      expect(result.current.settings.enableReducedMotion).toBe(true);
      expect(result.current.settings.enableAnimations).toBe(false);
    });
  });

  describe('validation', () => {
    it('should validate valid settings', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      expect(result.current.validateSettings()).toBe(true);
    });

    it('should invalidate settings with out-of-range values', () => {
      const { result } = renderHook(() => useSettingsStore());
      
      act(() => {
        result.current.updateSettings({ temperature: 3.0 }); // Out of range
      });
      
      expect(result.current.validateSettings()).toBe(false);
    });
  });

  describe('selectors', () => {
    it('should provide settings selector', () => {
      const { result } = renderHook(() => useSettingsStore((state) => state.settings));
      
      expect(result.current).toEqual(DEFAULT_SETTINGS);
    });

    it('should provide models selector', () => {
      const { result } = renderHook(() => useSettingsStore((state) => ({
        availableModels: state.availableModels,
        isLoadingModels: state.isLoadingModels,
        modelsError: state.modelsError,
        lastModelsUpdate: state.lastModelsUpdate,
      })));
      
      expect(result.current.availableModels).toEqual([]);
      expect(result.current.isLoadingModels).toBe(false);
      expect(result.current.modelsError).toBeNull();
      expect(result.current.lastModelsUpdate).toBeNull();
    });
  });
});