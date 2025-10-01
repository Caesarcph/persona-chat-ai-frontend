/**
 * Settings Component Tests
 * Tests for accessibility, keyboard navigation, and functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Settings } from '../Settings';
import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_SETTINGS } from '../../types/settings';

// Mock the settings store
jest.mock('../../stores/settingsStore');
const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock i18n
jest.mock('../../utils/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: jest.fn(),
    getErrorMessage: (code: string) => code,
    getDisclaimer: (context: string) => context,
  }),
  i18n: {
    setLanguage: jest.fn(),
  },
}));

describe('Settings Component', () => {
  const mockStore = {
    settings: DEFAULT_SETTINGS,
    availableModels: [
      { name: 'llama2:7b', size: 3800000000, modified_at: '2023-01-01' },
      { name: 'codellama:13b', size: 7300000000, modified_at: '2023-01-02' },
    ],
    isLoadingModels: false,
    modelsError: null,
    setLoadingModels: jest.fn(),
    setModels: jest.fn(),
    setModelsError: jest.fn(),
    updateSettings: jest.fn(),
    resetSettings: jest.fn(),
    validateSettings: jest.fn(() => true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSettingsStore.mockReturnValue(mockStore);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ollama_available: true,
        models: mockStore.availableModels,
      }),
    });
  });

  describe('Rendering', () => {
    it('renders settings title and sections', () => {
      render(<Settings />);
      
      expect(screen.getByText('settings.title')).toBeInTheDocument();
      expect(screen.getByText('settings.modelConfiguration')).toBeInTheDocument();
      expect(screen.getByText('settings.languageSettings')).toBeInTheDocument();
      expect(screen.getByText('settings.themeSettings')).toBeInTheDocument();
      expect(screen.getByText('settings.accessibilitySettings')).toBeInTheDocument();
    });

    it('renders with proper ARIA labels', () => {
      render(<Settings />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'settings.title');
      
      const modelSection = screen.getByLabelledBy('model-config-heading');
      expect(modelSection).toBeInTheDocument();
    });

    it('renders close button when onClose is provided', () => {
      const onClose = jest.fn();
      render(<Settings onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('common.close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Model Configuration', () => {
    it('fetches models on mount', async () => {
      render(<Settings />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/models');
      });
    });

    it('displays available models in dropdown', () => {
      render(<Settings />);
      
      const modelSelect = screen.getByLabelText('settings.selectModel');
      expect(modelSelect).toBeInTheDocument();
      
      // Check if models are in the dropdown
      expect(screen.getByText(/llama2:7b/)).toBeInTheDocument();
      expect(screen.getByText(/codellama:13b/)).toBeInTheDocument();
    });

    it('handles model selection', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const modelSelect = screen.getByLabelText('settings.selectModel');
      await user.selectOptions(modelSelect, 'llama2:7b');
      
      expect(mockStore.updateSettings).toHaveBeenCalledWith({
        selectedModel: 'llama2:7b',
      });
    });

    it('handles model refresh', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const refreshButton = screen.getByLabelText('settings.refreshModels');
      await user.click(refreshButton);
      
      expect(mockStore.setLoadingModels).toHaveBeenCalledWith(true);
    });
  });

  describe('Generation Parameters', () => {
    it('renders parameter sliders', () => {
      render(<Settings />);
      
      expect(screen.getByLabelText('settings.temperature value')).toBeInTheDocument();
      expect(screen.getByLabelText('settings.topP value')).toBeInTheDocument();
      expect(screen.getByLabelText('settings.maxTokens value')).toBeInTheDocument();
    });

    it('updates temperature parameter', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const temperatureSlider = screen.getByDisplayValue('0.7');
      await user.clear(temperatureSlider);
      await user.type(temperatureSlider, '1.2');
      
      expect(mockStore.updateSettings).toHaveBeenCalledWith({
        temperature: 1.2,
      });
    });

    it('validates parameter ranges', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const temperatureInput = screen.getByLabelText('settings.temperature value');
      
      // Try to set invalid value
      await user.clear(temperatureInput);
      await user.type(temperatureInput, '3.0');
      
      // Should not call updateSettings with invalid value
      expect(mockStore.updateSettings).not.toHaveBeenCalledWith({
        temperature: 3.0,
      });
    });
  });

  describe('Language Settings', () => {
    it('renders language options', () => {
      render(<Settings />);
      
      expect(screen.getByLabelText('English language')).toBeInTheDocument();
      expect(screen.getByLabelText('Chinese language')).toBeInTheDocument();
    });

    it('handles language change', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const chineseOption = screen.getByLabelText('Chinese language');
      await user.click(chineseOption);
      
      expect(mockStore.updateSettings).toHaveBeenCalledWith({
        language: 'zh',
      });
    });
  });

  describe('Theme Settings', () => {
    it('renders theme options', () => {
      render(<Settings />);
      
      expect(screen.getByLabelText('settings.light theme')).toBeInTheDocument();
      expect(screen.getByLabelText('settings.dark theme')).toBeInTheDocument();
      expect(screen.getByLabelText('settings.highContrast theme')).toBeInTheDocument();
    });

    it('renders font size options', () => {
      render(<Settings />);
      
      expect(screen.getByLabelText('settings.small font size')).toBeInTheDocument();
      expect(screen.getByLabelText('settings.medium font size')).toBeInTheDocument();
      expect(screen.getByLabelText('settings.large font size')).toBeInTheDocument();
    });

    it('handles theme change', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const darkTheme = screen.getByLabelText('settings.dark theme');
      await user.click(darkTheme);
      
      expect(mockStore.updateSettings).toHaveBeenCalledWith({
        theme: 'dark',
      });
    });
  });

  describe('Accessibility Settings', () => {
    it('renders accessibility toggles', () => {
      render(<Settings />);
      
      expect(screen.getByRole('switch', { name: 'settings.enableScreenReader' })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: 'settings.enableKeyboardNavigation' })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: 'settings.enableHighContrast' })).toBeInTheDocument();
      expect(screen.getAllByRole('switch', { name: 'settings.enableReducedMotion' })[0]).toBeInTheDocument();
    });

    it('handles accessibility toggle changes', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const screenReaderToggle = screen.getByRole('switch', { name: 'settings.enableScreenReader' });
      await user.click(screenReaderToggle);
      
      expect(mockStore.updateSettings).toHaveBeenCalledWith({
        enableScreenReader: true,
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles Escape key to close', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      render(<Settings onClose={onClose} />);
      
      const settingsContainer = screen.getByRole('main');
      await user.type(settingsContainer, '{Escape}');
      
      expect(onClose).toHaveBeenCalled();
    });

    it('handles Ctrl+R to reset settings', async () => {
      const user = userEvent.setup();
      // Mock window.confirm
      window.confirm = jest.fn(() => true);
      
      render(<Settings />);
      
      const settingsContainer = screen.getByRole('main');
      await user.type(settingsContainer, '{Control>}r{/Control}');
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockStore.resetSettings).toHaveBeenCalled();
    });

    it('supports tab navigation', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      // Tab through focusable elements
      await user.tab();
      expect(document.activeElement).toBeDefined();
      
      await user.tab();
      // Should move to next focusable element
      expect(document.activeElement).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('displays model loading error', () => {
      mockUseSettingsStore.mockReturnValue({
        ...mockStore,
        modelsError: 'Connection failed',
        availableModels: [],
      });
      
      render(<Settings />);
      
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      expect(screen.getByText('common.error')).toBeInTheDocument();
    });

    it('handles API fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<Settings />);
      
      await waitFor(() => {
        expect(mockStore.setModelsError).toHaveBeenCalled();
      });
    });
  });

  describe('Settings Persistence', () => {
    it('validates settings after update', async () => {
      const user = userEvent.setup();
      render(<Settings />);
      
      const temperatureInput = screen.getByLabelText('settings.temperature value');
      await user.type(temperatureInput, '{selectall}1.5');
      
      // Wait for validation
      await waitFor(() => {
        expect(mockStore.validateSettings).toHaveBeenCalled();
      });
    });

    it('handles reset confirmation', async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => false);
      
      render(<Settings />);
      
      const resetButton = screen.getByText('common.reset');
      await user.click(resetButton);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockStore.resetSettings).not.toHaveBeenCalled();
    });
  });

  describe('Screen Reader Support', () => {
    it('provides proper ARIA labels and descriptions', () => {
      render(<Settings />);
      
      const temperatureSlider = screen.getByLabelText('settings.temperature');
      expect(temperatureSlider).toHaveAttribute('aria-describedby');
      
      const modelSelect = screen.getByLabelText('settings.selectModel');
      expect(modelSelect).toHaveAttribute('aria-describedby');
    });

    it('announces status changes with aria-live', () => {
      mockUseSettingsStore.mockReturnValue({
        ...mockStore,
        modelsError: 'Connection failed',
      });
      
      render(<Settings />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('High Contrast Mode', () => {
    it('applies high contrast styles when enabled', () => {
      mockUseSettingsStore.mockReturnValue({
        ...mockStore,
        settings: {
          ...DEFAULT_SETTINGS,
          enableHighContrast: true,
          theme: 'high-contrast',
        },
      });
      
      render(<Settings />);
      
      // Check if high contrast notice is displayed
      expect(screen.getByText(/high contrast mode is enabled/i)).toBeInTheDocument();
    });
  });
});