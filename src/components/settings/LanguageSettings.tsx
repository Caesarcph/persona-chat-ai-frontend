/**
 * LanguageSettings Component - Language selection interface
 */

import React, { useCallback } from 'react';
import { useI18n } from '../../utils/i18n';
import { AppSettings } from '../../types/settings';

interface LanguageSettingsProps {
  language: AppSettings['language'];
  onLanguageChange: (language: AppSettings['language']) => void;
}

export const LanguageSettings: React.FC<LanguageSettingsProps> = ({
  language,
  onLanguageChange,
}) => {
  const { t } = useI18n();
  
  const handleLanguageChange = useCallback((newLanguage: AppSettings['language']) => {
    onLanguageChange(newLanguage);
  }, [onLanguageChange]);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent, lang: AppSettings['language']) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLanguageChange(lang);
    }
  }, [handleLanguageChange]);
  
  return (
    <div className="language-settings">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {t('settings.language')}
        </label>
        
        <div 
          className="flex space-x-4"
          role="radiogroup"
          aria-labelledby="language-label"
        >
          {/* English Option */}
          <div
            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              language === 'en'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => handleLanguageChange('en')}
            onKeyDown={(e) => handleKeyDown(e, 'en')}
            role="radio"
            aria-checked={language === 'en'}
            tabIndex={0}
          >
            <input
              type="radio"
              name="language"
              value="en"
              checked={language === 'en'}
              onChange={() => handleLanguageChange('en')}
              className="sr-only"
              aria-label="English language"
            />
            
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                language === 'en'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {language === 'en' && (
                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                )}
              </div>
              
              <div>
                <div className="font-medium">
                  {t('settings.english')}
                </div>
                <div className="text-sm text-gray-500">
                  English
                </div>
              </div>
            </div>
          </div>
          
          {/* Chinese Option */}
          <div
            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              language === 'zh'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => handleLanguageChange('zh')}
            onKeyDown={(e) => handleKeyDown(e, 'zh')}
            role="radio"
            aria-checked={language === 'zh'}
            tabIndex={0}
          >
            <input
              type="radio"
              name="language"
              value="zh"
              checked={language === 'zh'}
              onChange={() => handleLanguageChange('zh')}
              className="sr-only"
              aria-label="Chinese language"
            />
            
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                language === 'zh'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {language === 'zh' && (
                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                )}
              </div>
              
              <div>
                <div className="font-medium">
                  {t('settings.chinese')}
                </div>
                <div className="text-sm text-gray-500">
                  中文
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500">
          Language changes will apply to interface text, error messages, and AI disclaimers.
        </p>
        
        {/* Language change confirmation */}
        {language && (
          <div className="flex items-center text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>
              {language === 'en' ? 'Interface language set to English' : '界面语言已设置为中文'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};