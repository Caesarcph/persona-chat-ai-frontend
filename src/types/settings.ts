/**
 * Settings interface types
 */

export interface AppSettings {
  // Model Configuration
  selectedModel: string;
  temperature: number; // 0.1-2.0
  topP: number; // 0.1-1.0
  maxTokens: number; // 100-4096
  
  // Internationalization
  language: 'en' | 'zh';
  
  // Theme & Accessibility
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large';
  enableAnimations: boolean;
  enableSounds: boolean;
  
  // Accessibility Features
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
}

export interface ModelInfo {
  name: string;
  size: number;
  modified_at: string;
  digest?: string;
  details?: any;
}

export interface ModelsResponse {
  models: ModelInfo[];
  ollama_available: boolean;
  ollama_url?: string;
  response_time_ms?: number;
  timestamp?: string;
  error?: string;
}

export interface SettingsComponentProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  availableModels: ModelInfo[];
  isLoadingModels: boolean;
  onRefreshModels: () => void;
  className?: string;
}

export interface ModelSelectorProps {
  selectedModel: string;
  availableModels: ModelInfo[];
  isLoading: boolean;
  onModelChange: (model: string) => void;
  onRefresh: () => void;
  disabled?: boolean;
}

export interface GenerationParametersProps {
  temperature: number;
  topP: number;
  maxTokens: number;
  onTemperatureChange: (value: number) => void;
  onTopPChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
  disabled?: boolean;
}

export interface ThemeSettingsProps {
  theme: AppSettings['theme'];
  fontSize: AppSettings['fontSize'];
  enableAnimations: boolean;
  enableReducedMotion: boolean;
  onThemeChange: (theme: AppSettings['theme']) => void;
  onFontSizeChange: (fontSize: AppSettings['fontSize']) => void;
  onAnimationsChange: (enabled: boolean) => void;
  onReducedMotionChange: (enabled: boolean) => void;
}

export interface LanguageSettingsProps {
  language: AppSettings['language'];
  onLanguageChange: (language: AppSettings['language']) => void;
}

export interface AccessibilitySettingsProps {
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  onScreenReaderChange: (enabled: boolean) => void;
  onKeyboardNavigationChange: (enabled: boolean) => void;
  onHighContrastChange: (enabled: boolean) => void;
  onReducedMotionChange: (enabled: boolean) => void;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  selectedModel: '',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  language: 'en',
  theme: 'light',
  fontSize: 'medium',
  enableAnimations: true,
  enableSounds: false,
  enableScreenReader: false,
  enableKeyboardNavigation: true,
  enableHighContrast: false,
  enableReducedMotion: false,
};

// Validation constraints
export const SETTINGS_CONSTRAINTS = {
  temperature: { min: 0.1, max: 2.0, step: 0.1 },
  topP: { min: 0.1, max: 1.0, step: 0.1 },
  maxTokens: { min: 100, max: 4096, step: 100 },
} as const;