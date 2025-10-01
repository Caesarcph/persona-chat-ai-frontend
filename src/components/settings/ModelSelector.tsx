/**
 * ModelSelector Component - Dropdown for selecting AI models
 */

import React, { useCallback } from 'react';
import { ModelInfo } from '../../types/settings';
import { useI18n } from '../../utils/i18n';

interface ModelSelectorProps {
  selectedModel: string;
  availableModels: ModelInfo[];
  isLoading: boolean;
  onModelChange: (model: string) => void;
  onRefresh: () => void;
  error?: string | null;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  availableModels,
  isLoading,
  onModelChange,
  onRefresh,
  error,
  disabled = false,
}) => {
  const { t } = useI18n();
  
  const handleModelChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    onModelChange(event.target.value);
  }, [onModelChange]);
  
  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'F5' || (event.key === 'r' && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      handleRefresh();
    }
  }, [handleRefresh]);
  
  // Format model size for display
  const formatModelSize = (size: number): string => {
    if (size < 1024 * 1024 * 1024) {
      return `${Math.round(size / (1024 * 1024))} MB`;
    }
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };
  
  return (
    <div className="model-selector space-y-3">
      <div className="flex items-center justify-between">
        <label 
          htmlFor="model-select"
          className="block text-sm font-medium text-gray-700"
        >
          {t('settings.selectModel')}
        </label>
        
        <button
          onClick={handleRefresh}
          disabled={isLoading || disabled}
          className="btn-secondary text-xs px-2 py-1 disabled:opacity-50"
          aria-label={t('settings.refreshModels')}
          title={`${t('settings.refreshModels')} (F5)`}
        >
          <svg 
            className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {isLoading ? t('common.loading') : t('settings.refreshModels')}
        </button>
      </div>
      
      <div className="relative">
        <select
          id="model-select"
          value={selectedModel}
          onChange={handleModelChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled || availableModels.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-describedby="model-select-description model-select-error"
        >
          {availableModels.length === 0 ? (
            <option value="">
              {isLoading ? t('settings.loadingModels') : t('settings.modelNotAvailable')}
            </option>
          ) : (
            <>
              {!selectedModel && (
                <option value="" disabled>
                  {t('settings.selectModel')}
                </option>
              )}
              {availableModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({formatModelSize(model.size)})
                </option>
              ))}
            </>
          )}
        </select>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>
      
      {/* Description */}
      <p 
        id="model-select-description"
        className="text-xs text-gray-500"
      >
        Select an AI model from your local Ollama installation. Larger models may provide better responses but require more resources.
      </p>
      
      {/* Error message */}
      {error && (
        <div 
          id="model-select-error"
          className="flex items-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
          role="alert"
          aria-live="polite"
        >
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Success message */}
      {!error && !isLoading && availableModels.length > 0 && (
        <div className="flex items-center text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>
            {availableModels.length} model{availableModels.length !== 1 ? 's' : ''} available
            {selectedModel && ` • ${selectedModel} selected`}
          </span>
        </div>
      )}
      
      {/* Offline message */}
      {!error && !isLoading && availableModels.length === 0 && (
        <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md p-2">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('settings.ollamaOffline')}</span>
        </div>
      )}
    </div>
  );
};