/**
 * GenerationParameters Component - Controls for AI generation parameters
 */

import React, { useCallback } from 'react';
import { useI18n } from '../../utils/i18n';
import { SETTINGS_CONSTRAINTS } from '../../types/settings';

interface GenerationParametersProps {
  temperature: number;
  topP: number;
  maxTokens: number;
  onTemperatureChange: (value: number) => void;
  onTopPChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
  disabled?: boolean;
}

export const GenerationParameters: React.FC<GenerationParametersProps> = ({
  temperature,
  topP,
  maxTokens,
  onTemperatureChange,
  onTopPChange,
  onMaxTokensChange,
  disabled = false,
}) => {
  const { t } = useI18n();
  
  // Temperature handlers
  const handleTemperatureChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) {
      onTemperatureChange(value);
    }
  }, [onTemperatureChange]);
  
  const handleTemperatureInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= SETTINGS_CONSTRAINTS.temperature.min && value <= SETTINGS_CONSTRAINTS.temperature.max) {
      onTemperatureChange(value);
    }
  }, [onTemperatureChange]);
  
  // Top P handlers
  const handleTopPChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) {
      onTopPChange(value);
    }
  }, [onTopPChange]);
  
  const handleTopPInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= SETTINGS_CONSTRAINTS.topP.min && value <= SETTINGS_CONSTRAINTS.topP.max) {
      onTopPChange(value);
    }
  }, [onTopPChange]);
  
  // Max Tokens handlers
  const handleMaxTokensChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value)) {
      onMaxTokensChange(value);
    }
  }, [onMaxTokensChange]);
  
  const handleMaxTokensInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= SETTINGS_CONSTRAINTS.maxTokens.min && value <= SETTINGS_CONSTRAINTS.maxTokens.max) {
      onMaxTokensChange(value);
    }
  }, [onMaxTokensChange]);
  
  return (
    <div className="generation-parameters space-y-6">
      <h3 className="text-sm font-medium text-gray-900 mb-4">
        {t('settings.generationParameters')}
      </h3>
      
      {/* Temperature Control */}
      <div className="parameter-control">
        <div className="flex items-center justify-between mb-2">
          <label 
            htmlFor="temperature-slider"
            className="text-sm font-medium text-gray-700"
          >
            {t('settings.temperature')}
          </label>
          <input
            type="number"
            value={temperature}
            onChange={handleTemperatureInputChange}
            min={SETTINGS_CONSTRAINTS.temperature.min}
            max={SETTINGS_CONSTRAINTS.temperature.max}
            step={SETTINGS_CONSTRAINTS.temperature.step}
            disabled={disabled}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            aria-label={`${t('settings.temperature')} value`}
          />
        </div>
        
        <input
          id="temperature-slider"
          type="range"
          min={SETTINGS_CONSTRAINTS.temperature.min}
          max={SETTINGS_CONSTRAINTS.temperature.max}
          step={SETTINGS_CONSTRAINTS.temperature.step}
          value={temperature}
          onChange={handleTemperatureChange}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="temperature-description"
        />
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.1 (Focused)</span>
          <span>2.0 (Creative)</span>
        </div>
        
        <p 
          id="temperature-description"
          className="text-xs text-gray-500 mt-2"
        >
          {t('settings.temperatureDescription')}
        </p>
      </div>
      
      {/* Top P Control */}
      <div className="parameter-control">
        <div className="flex items-center justify-between mb-2">
          <label 
            htmlFor="top-p-slider"
            className="text-sm font-medium text-gray-700"
          >
            {t('settings.topP')}
          </label>
          <input
            type="number"
            value={topP}
            onChange={handleTopPInputChange}
            min={SETTINGS_CONSTRAINTS.topP.min}
            max={SETTINGS_CONSTRAINTS.topP.max}
            step={SETTINGS_CONSTRAINTS.topP.step}
            disabled={disabled}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            aria-label={`${t('settings.topP')} value`}
          />
        </div>
        
        <input
          id="top-p-slider"
          type="range"
          min={SETTINGS_CONSTRAINTS.topP.min}
          max={SETTINGS_CONSTRAINTS.topP.max}
          step={SETTINGS_CONSTRAINTS.topP.step}
          value={topP}
          onChange={handleTopPChange}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="top-p-description"
        />
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.1 (Narrow)</span>
          <span>1.0 (Diverse)</span>
        </div>
        
        <p 
          id="top-p-description"
          className="text-xs text-gray-500 mt-2"
        >
          {t('settings.topPDescription')}
        </p>
      </div>
      
      {/* Max Tokens Control */}
      <div className="parameter-control">
        <div className="flex items-center justify-between mb-2">
          <label 
            htmlFor="max-tokens-slider"
            className="text-sm font-medium text-gray-700"
          >
            {t('settings.maxTokens')}
          </label>
          <input
            type="number"
            value={maxTokens}
            onChange={handleMaxTokensInputChange}
            min={SETTINGS_CONSTRAINTS.maxTokens.min}
            max={SETTINGS_CONSTRAINTS.maxTokens.max}
            step={SETTINGS_CONSTRAINTS.maxTokens.step}
            disabled={disabled}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            aria-label={`${t('settings.maxTokens')} value`}
          />
        </div>
        
        <input
          id="max-tokens-slider"
          type="range"
          min={SETTINGS_CONSTRAINTS.maxTokens.min}
          max={SETTINGS_CONSTRAINTS.maxTokens.max}
          step={SETTINGS_CONSTRAINTS.maxTokens.step}
          value={maxTokens}
          onChange={handleMaxTokensChange}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="max-tokens-description"
        />
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>100 (Short)</span>
          <span>4096 (Long)</span>
        </div>
        
        <p 
          id="max-tokens-description"
          className="text-xs text-gray-500 mt-2"
        >
          {t('settings.maxTokensDescription')}
        </p>
      </div>
      
      {/* Disabled state message */}
      {disabled && (
        <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md p-2">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Select a model to configure generation parameters</span>
        </div>
      )}
    </div>
  );
};