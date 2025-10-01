/**
 * ThemeSettings Component - Theme and display preferences
 */

import React, { useCallback } from 'react';
import { useI18n } from '../../utils/i18n';
import { AppSettings } from '../../types/settings';

interface ThemeSettingsProps {
  theme: AppSettings['theme'];
  fontSize: AppSettings['fontSize'];
  enableAnimations: boolean;
  enableReducedMotion: boolean;
  onThemeChange: (theme: AppSettings['theme']) => void;
  onFontSizeChange: (fontSize: AppSettings['fontSize']) => void;
  onAnimationsChange: (enabled: boolean) => void;
  onReducedMotionChange: (enabled: boolean) => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  theme,
  fontSize,
  enableAnimations,
  enableReducedMotion,
  onThemeChange,
  onFontSizeChange,
  onAnimationsChange,
  onReducedMotionChange,
}) => {
  const { t } = useI18n();
  
  const handleThemeChange = useCallback((newTheme: AppSettings['theme']) => {
    onThemeChange(newTheme);
  }, [onThemeChange]);
  
  const handleFontSizeChange = useCallback((newFontSize: AppSettings['fontSize']) => {
    onFontSizeChange(newFontSize);
  }, [onFontSizeChange]);
  
  const handleAnimationsToggle = useCallback(() => {
    onAnimationsChange(!enableAnimations);
  }, [enableAnimations, onAnimationsChange]);
  
  const handleReducedMotionToggle = useCallback(() => {
    onReducedMotionChange(!enableReducedMotion);
  }, [enableReducedMotion, onReducedMotionChange]);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }, []);
  
  const themes: Array<{ value: AppSettings['theme']; label: string; description: string }> = [
    { value: 'light', label: t('settings.light'), description: 'Light theme with bright colors' },
    { value: 'dark', label: t('settings.dark'), description: 'Dark theme for low-light environments' },
    { value: 'high-contrast', label: t('settings.highContrast'), description: 'High contrast for better visibility' },
  ];
  
  const fontSizes: Array<{ value: AppSettings['fontSize']; label: string; description: string }> = [
    { value: 'small', label: t('settings.small'), description: 'Compact text size' },
    { value: 'medium', label: t('settings.medium'), description: 'Standard text size' },
    { value: 'large', label: t('settings.large'), description: 'Large text for better readability' },
  ];
  
  return (
    <div className="theme-settings space-y-6">
      {/* Theme Selection */}
      <div className="theme-selector">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('settings.theme')}
        </label>
        
        <div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          role="radiogroup"
          aria-labelledby="theme-label"
        >
          {themes.map((themeOption) => (
            <div
              key={themeOption.value}
              className={`relative p-3 border rounded-lg cursor-pointer transition-colors ${
                theme === themeOption.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onClick={() => handleThemeChange(themeOption.value)}
              onKeyDown={(e) => handleKeyDown(e, () => handleThemeChange(themeOption.value))}
              role="radio"
              aria-checked={theme === themeOption.value}
              tabIndex={0}
            >
              <input
                type="radio"
                name="theme"
                value={themeOption.value}
                checked={theme === themeOption.value}
                onChange={() => handleThemeChange(themeOption.value)}
                className="sr-only"
                aria-label={`${themeOption.label} theme`}
              />
              
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  theme === themeOption.value
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {theme === themeOption.value && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="font-medium">
                    {themeOption.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {themeOption.description}
                  </div>
                </div>
              </div>
              
              {/* Theme preview */}
              <div className="mt-2 flex space-x-1">
                <div className={`w-3 h-3 rounded ${
                  themeOption.value === 'light' ? 'bg-white border border-gray-300' :
                  themeOption.value === 'dark' ? 'bg-gray-800' :
                  'bg-black'
                }`} />
                <div className={`w-3 h-3 rounded ${
                  themeOption.value === 'light' ? 'bg-gray-100' :
                  themeOption.value === 'dark' ? 'bg-gray-600' :
                  'bg-yellow-400'
                }`} />
                <div className={`w-3 h-3 rounded ${
                  themeOption.value === 'light' ? 'bg-blue-500' :
                  themeOption.value === 'dark' ? 'bg-blue-400' :
                  'bg-blue-600'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Font Size Selection */}
      <div className="font-size-selector">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('settings.fontSize')}
        </label>
        
        <div 
          className="flex space-x-3"
          role="radiogroup"
          aria-labelledby="font-size-label"
        >
          {fontSizes.map((sizeOption) => (
            <div
              key={sizeOption.value}
              className={`flex-1 p-3 border rounded-lg cursor-pointer transition-colors ${
                fontSize === sizeOption.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onClick={() => handleFontSizeChange(sizeOption.value)}
              onKeyDown={(e) => handleKeyDown(e, () => handleFontSizeChange(sizeOption.value))}
              role="radio"
              aria-checked={fontSize === sizeOption.value}
              tabIndex={0}
            >
              <input
                type="radio"
                name="fontSize"
                value={sizeOption.value}
                checked={fontSize === sizeOption.value}
                onChange={() => handleFontSizeChange(sizeOption.value)}
                className="sr-only"
                aria-label={`${sizeOption.label} font size`}
              />
              
              <div className="text-center">
                <div className={`font-medium mb-1 ${
                  sizeOption.value === 'small' ? 'text-sm' :
                  sizeOption.value === 'large' ? 'text-lg' :
                  'text-base'
                }`}>
                  Aa
                </div>
                <div className="text-xs">
                  {sizeOption.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Animation Settings */}
      <div className="animation-settings space-y-4">
        <h4 className="text-sm font-medium text-gray-700">
          Motion & Animation
        </h4>
        
        {/* Enable Animations Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label 
              htmlFor="enable-animations"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {t('settings.enableAnimations')}
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Enable smooth transitions and animations throughout the interface
            </p>
          </div>
          
          <button
            id="enable-animations"
            type="button"
            onClick={handleAnimationsToggle}
            disabled={enableReducedMotion}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              enableAnimations && !enableReducedMotion ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={enableAnimations && !enableReducedMotion}
            aria-describedby="enable-animations-description"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enableAnimations && !enableReducedMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label 
              htmlFor="reduced-motion"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {t('settings.enableReducedMotion')}
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Reduce animations and motion effects for better accessibility
            </p>
          </div>
          
          <button
            id="reduced-motion"
            type="button"
            onClick={handleReducedMotionToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              enableReducedMotion ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={enableReducedMotion}
            aria-describedby="reduced-motion-description"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enableReducedMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        {/* Reduced motion warning */}
        {enableReducedMotion && (
          <div className="flex items-center text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-2">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Reduced motion is enabled. Animations are automatically disabled.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};