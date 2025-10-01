/**
 * Settings Component - Main settings interface with model controls and accessibility
 */

import React, { useEffect, useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useI18n } from '../utils/i18n';
import { ModelSelector } from './settings/ModelSelector';
import { GenerationParameters } from './settings/GenerationParameters';
import { LanguageSettings } from './settings/LanguageSettings';
import { ThemeSettings } from './settings/ThemeSettings';
import { AccessibilitySettings } from './settings/AccessibilitySettings';

interface SettingsProps {
  className?: string;
  onClose?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ className = '', onClose }) => {
  const {
    settings,
    availableModels,
    isLoadingModels,
    modelsError,
    setLoadingModels,
    setModels,
    setModelsError,
    updateSettings,
    resetSettings,
    validateSettings,
  } = useSettingsStore();
  
  const { t, language } = useI18n(settings.language);
  
  // Fetch available models on component mount
  const fetchModels = useCallback(async () => {
    const store = useSettingsStore.getState();
    
    store.setLoadingModels(true);
    store.setModelsError(null);
    
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load models');
      }
      
      if (data.ollama_available && data.models) {
        store.setModels(data.models);
      } else {
        store.setModelsError('Ollama connection error');
        store.setModels([]);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      store.setModelsError(
        error instanceof Error ? error.message : 'Network error'
      );
      store.setModels([]);
    } finally {
      store.setLoadingModels(false);
    }
  }, []); // No dependencies to avoid recreation
  
  // Fetch models on mount
  useEffect(() => {
    fetchModels();
  }, []); // Empty dependency array - only run on mount
  
  // Handle settings validation
  const handleSettingsChange = useCallback((updates: Partial<typeof settings>) => {
    updateSettings(updates);
    
    // Validate after update
    setTimeout(() => {
      if (!validateSettings()) {
        console.warn('Settings validation failed');
      }
    }, 0);
  }, [updateSettings, validateSettings]);
  
  // Handle reset with confirmation
  const handleReset = useCallback(() => {
    if (window.confirm(t('common.reset') + '?')) {
      resetSettings();
    }
  }, [resetSettings, t]);
  
  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!settings.enableKeyboardNavigation) return;
    
    switch (event.key) {
      case 'Escape':
        if (onClose) {
          event.preventDefault();
          onClose();
        }
        break;
      case 'r':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleReset();
        }
        break;
    }
  }, [settings.enableKeyboardNavigation, onClose, handleReset]);
  
  return (
    <div
      className={`settings-container bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      onKeyDown={handleKeyDown}
      role="main"
      aria-label={t('settings.title')}
      tabIndex={-1}
    >
      {/* Header */}
      <div className="settings-header flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h1 
            className="text-xl font-semibold text-gray-900"
            id="settings-title"
          >
            {t('settings.title')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure model parameters, language, theme, and accessibility options
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="btn-secondary text-sm"
            aria-label={`${t('common.reset')} ${t('settings.title')}`}
            title={`${t('common.reset')} (Ctrl+R)`}
          >
            {t('common.reset')}
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              aria-label={t('common.close')}
              title={`${t('common.close')} (Esc)`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Settings Content */}
      <div className="settings-content p-6 space-y-8 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {/* Model Configuration Section */}
        <section 
          className="settings-section"
          aria-labelledby="model-config-heading"
        >
          <h2 
            id="model-config-heading"
            className="text-lg font-medium text-gray-900 mb-4"
          >
            {t('settings.modelConfiguration')}
          </h2>
          
          <div className="space-y-6">
            <ModelSelector
              selectedModel={settings.selectedModel}
              availableModels={availableModels}
              isLoading={isLoadingModels}
              onModelChange={(model) => handleSettingsChange({ selectedModel: model })}
              onRefresh={fetchModels}
              error={modelsError}
            />
            
            <GenerationParameters
              temperature={settings.temperature}
              topP={settings.topP}
              maxTokens={settings.maxTokens}
              onTemperatureChange={(temperature) => handleSettingsChange({ temperature })}
              onTopPChange={(topP) => handleSettingsChange({ topP })}
              onMaxTokensChange={(maxTokens) => handleSettingsChange({ maxTokens })}
              disabled={!settings.selectedModel}
            />
          </div>
        </section>
        
        {/* Language Settings Section */}
        <section 
          className="settings-section"
          aria-labelledby="language-heading"
        >
          <h2 
            id="language-heading"
            className="text-lg font-medium text-gray-900 mb-4"
          >
            {t('settings.languageSettings')}
          </h2>
          
          <LanguageSettings
            language={settings.language}
            onLanguageChange={(language) => handleSettingsChange({ language })}
          />
        </section>
        
        {/* Theme Settings Section */}
        <section 
          className="settings-section"
          aria-labelledby="theme-heading"
        >
          <h2 
            id="theme-heading"
            className="text-lg font-medium text-gray-900 mb-4"
          >
            {t('settings.themeSettings')}
          </h2>
          
          <ThemeSettings
            theme={settings.theme}
            fontSize={settings.fontSize}
            enableAnimations={settings.enableAnimations}
            enableReducedMotion={settings.enableReducedMotion}
            onThemeChange={(theme) => handleSettingsChange({ theme })}
            onFontSizeChange={(fontSize) => handleSettingsChange({ fontSize })}
            onAnimationsChange={(enableAnimations) => handleSettingsChange({ enableAnimations })}
            onReducedMotionChange={(enableReducedMotion) => handleSettingsChange({ enableReducedMotion })}
          />
        </section>
        
        {/* Accessibility Settings Section */}
        <section 
          className="settings-section"
          aria-labelledby="accessibility-heading"
        >
          <h2 
            id="accessibility-heading"
            className="text-lg font-medium text-gray-900 mb-4"
          >
            {t('settings.accessibilitySettings')}
          </h2>
          
          <AccessibilitySettings
            enableScreenReader={settings.enableScreenReader}
            enableKeyboardNavigation={settings.enableKeyboardNavigation}
            enableHighContrast={settings.enableHighContrast}
            enableReducedMotion={settings.enableReducedMotion}
            onScreenReaderChange={(enableScreenReader) => handleSettingsChange({ enableScreenReader })}
            onKeyboardNavigationChange={(enableKeyboardNavigation) => handleSettingsChange({ enableKeyboardNavigation })}
            onHighContrastChange={(enableHighContrast) => handleSettingsChange({ enableHighContrast })}
            onReducedMotionChange={(enableReducedMotion) => handleSettingsChange({ enableReducedMotion })}
          />
        </section>
      </div>
      
      {/* Status Bar */}
      <div className="settings-footer border-t border-gray-200 px-6 py-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>
              {t('settings.language')}: {language === 'en' ? t('settings.english') : t('settings.chinese')}
            </span>
            <span>
              {t('settings.theme')}: {t(`settings.${settings.theme}`)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {modelsError && (
              <span className="text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('common.error')}
              </span>
            )}
            
            {availableModels.length > 0 && (
              <span className="text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {availableModels.length} {availableModels.length === 1 ? 'model' : 'models'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;