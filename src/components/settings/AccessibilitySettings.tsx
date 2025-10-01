/**
 * AccessibilitySettings Component - Accessibility features and controls
 */

import React, { useCallback } from 'react';
import { useI18n } from '../../utils/i18n';

interface AccessibilitySettingsProps {
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  onScreenReaderChange: (enabled: boolean) => void;
  onKeyboardNavigationChange: (enabled: boolean) => void;
  onHighContrastChange: (enabled: boolean) => void;
  onReducedMotionChange: (enabled: boolean) => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  enableScreenReader,
  enableKeyboardNavigation,
  enableHighContrast,
  enableReducedMotion,
  onScreenReaderChange,
  onKeyboardNavigationChange,
  onHighContrastChange,
  onReducedMotionChange,
}) => {
  const { t } = useI18n();
  
  const handleScreenReaderToggle = useCallback(() => {
    onScreenReaderChange(!enableScreenReader);
  }, [enableScreenReader, onScreenReaderChange]);
  
  const handleKeyboardNavigationToggle = useCallback(() => {
    onKeyboardNavigationChange(!enableKeyboardNavigation);
  }, [enableKeyboardNavigation, onKeyboardNavigationChange]);
  
  const handleHighContrastToggle = useCallback(() => {
    onHighContrastChange(!enableHighContrast);
  }, [enableHighContrast, onHighContrastChange]);
  
  const handleReducedMotionToggle = useCallback(() => {
    onReducedMotionChange(!enableReducedMotion);
  }, [enableReducedMotion, onReducedMotionChange]);
  
  const accessibilityFeatures = [
    {
      id: 'screen-reader',
      label: t('settings.enableScreenReader'),
      description: t('settings.screenReaderDescription'),
      enabled: enableScreenReader,
      onToggle: handleScreenReaderToggle,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ),
    },
    {
      id: 'keyboard-navigation',
      label: t('settings.enableKeyboardNavigation'),
      description: t('settings.keyboardNavigationDescription'),
      enabled: enableKeyboardNavigation,
      onToggle: handleKeyboardNavigationToggle,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      ),
    },
    {
      id: 'high-contrast',
      label: t('settings.enableHighContrast'),
      description: t('settings.highContrastDescription'),
      enabled: enableHighContrast,
      onToggle: handleHighContrastToggle,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: 'reduced-motion',
      label: t('settings.enableReducedMotion'),
      description: t('settings.reducedMotionDescription'),
      enabled: enableReducedMotion,
      onToggle: handleReducedMotionToggle,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      ),
    },
  ];
  
  return (
    <div className="accessibility-settings">
      <div className="space-y-6">
        <div className="accessibility-intro">
          <p className="text-sm text-gray-600">
            Configure accessibility features to improve your experience with PersonaChatAI.
            These settings help ensure the application works well with assistive technologies.
          </p>
        </div>
        
        {/* Accessibility Features List */}
        <div className="space-y-4">
          {accessibilityFeatures.map((feature) => (
            <div
              key={feature.id}
              className="accessibility-feature flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start flex-1">
                <div className="flex-shrink-0 mt-1 text-gray-400">
                  {feature.icon}
                </div>
                
                <div className="ml-3 flex-1">
                  <label 
                    htmlFor={feature.id}
                    className="text-sm font-medium text-gray-700 cursor-pointer block"
                  >
                    {feature.label}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
              
              <button
                id={feature.id}
                type="button"
                onClick={feature.onToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ml-4 ${
                  feature.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={feature.enabled}
                aria-describedby={`${feature.id}-description`}
                aria-labelledby={`${feature.id}-label`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    feature.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        
        {/* Accessibility Status Summary */}
        <div className="accessibility-status bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Accessibility Status
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                enableScreenReader ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className={enableScreenReader ? 'text-green-700' : 'text-gray-500'}>
                Screen Reader Support
              </span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                enableKeyboardNavigation ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className={enableKeyboardNavigation ? 'text-green-700' : 'text-gray-500'}>
                Keyboard Navigation
              </span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                enableHighContrast ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className={enableHighContrast ? 'text-green-700' : 'text-gray-500'}>
                High Contrast
              </span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                enableReducedMotion ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className={enableReducedMotion ? 'text-green-700' : 'text-gray-500'}>
                Reduced Motion
              </span>
            </div>
          </div>
        </div>
        
        {/* Keyboard Shortcuts Help */}
        {enableKeyboardNavigation && (
          <div className="keyboard-shortcuts bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Keyboard Shortcuts
            </h4>
            
            <div className="text-xs text-blue-600 space-y-1">
              <div className="flex justify-between">
                <span>Close Settings:</span>
                <kbd className="px-1 py-0.5 bg-blue-100 rounded">Esc</kbd>
              </div>
              <div className="flex justify-between">
                <span>Reset Settings:</span>
                <kbd className="px-1 py-0.5 bg-blue-100 rounded">Ctrl+R</kbd>
              </div>
              <div className="flex justify-between">
                <span>Navigate:</span>
                <kbd className="px-1 py-0.5 bg-blue-100 rounded">Tab</kbd>
              </div>
              <div className="flex justify-between">
                <span>Activate:</span>
                <kbd className="px-1 py-0.5 bg-blue-100 rounded">Enter</kbd> / <kbd className="px-1 py-0.5 bg-blue-100 rounded">Space</kbd>
              </div>
            </div>
          </div>
        )}
        
        {/* High Contrast Notice */}
        {enableHighContrast && (
          <div className="high-contrast-notice bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center text-sm text-yellow-700">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                High contrast mode is enabled. The theme has been automatically switched to high contrast for better visibility.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};