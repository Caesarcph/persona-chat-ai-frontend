/**
 * Internationalization utilities for PersonaChatAI
 * Supports English and Chinese languages
 */

export type Language = 'en' | 'zh';

export interface I18nMessages {
  // Settings Page
  settings: {
    title: string;
    modelConfiguration: string;
    generationParameters: string;
    languageSettings: string;
    themeSettings: string;
    accessibilitySettings: string;
    
    // Model Configuration
    selectModel: string;
    refreshModels: string;
    modelNotAvailable: string;
    ollamaOffline: string;
    loadingModels: string;
    
    // Generation Parameters
    temperature: string;
    temperatureDescription: string;
    topP: string;
    topPDescription: string;
    maxTokens: string;
    maxTokensDescription: string;
    
    // Language Settings
    language: string;
    english: string;
    chinese: string;
    
    // Theme Settings
    theme: string;
    light: string;
    dark: string;
    highContrast: string;
    fontSize: string;
    small: string;
    medium: string;
    large: string;
    enableAnimations: string;
    enableSounds: string;
    
    // Accessibility Settings
    accessibility: string;
    enableScreenReader: string;
    enableKeyboardNavigation: string;
    enableHighContrast: string;
    enableReducedMotion: string;
    screenReaderDescription: string;
    keyboardNavigationDescription: string;
    highContrastDescription: string;
    reducedMotionDescription: string;
  };
  
  // Error Messages
  errors: {
    modelLoadFailed: string;
    settingsSaveFailed: string;
    invalidValue: string;
    networkError: string;
    ollamaConnectionError: string;
  };
  
  // Disclaimers
  disclaimers: {
    medical: string;
    legal: string;
    financial: string;
    safety: string;
    general: string;
  };
  
  // Common UI
  common: {
    save: string;
    cancel: string;
    reset: string;
    apply: string;
    close: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
}

const messages: Record<Language, I18nMessages> = {
  en: {
    settings: {
      title: 'Settings',
      modelConfiguration: 'Model Configuration',
      generationParameters: 'Generation Parameters',
      languageSettings: 'Language Settings',
      themeSettings: 'Theme & Display',
      accessibilitySettings: 'Accessibility',
      
      selectModel: 'Select Model',
      refreshModels: 'Refresh Models',
      modelNotAvailable: 'Model not available',
      ollamaOffline: 'Ollama is offline',
      loadingModels: 'Loading models...',
      
      temperature: 'Temperature',
      temperatureDescription: 'Controls randomness in responses (0.1 = focused, 2.0 = creative)',
      topP: 'Top P',
      topPDescription: 'Controls diversity of word selection (0.1 = narrow, 1.0 = diverse)',
      maxTokens: 'Max Tokens',
      maxTokensDescription: 'Maximum length of generated responses',
      
      language: 'Language',
      english: 'English',
      chinese: '中文',
      
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      highContrast: 'High Contrast',
      fontSize: 'Font Size',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      enableAnimations: 'Enable Animations',
      enableSounds: 'Enable Sounds',
      
      accessibility: 'Accessibility Features',
      enableScreenReader: 'Screen Reader Support',
      enableKeyboardNavigation: 'Keyboard Navigation',
      enableHighContrast: 'High Contrast Mode',
      enableReducedMotion: 'Reduced Motion',
      screenReaderDescription: 'Enhanced support for screen readers with ARIA labels',
      keyboardNavigationDescription: 'Full keyboard navigation support',
      highContrastDescription: 'High contrast colors for better visibility',
      reducedMotionDescription: 'Reduce animations and transitions',
    },
    
    errors: {
      modelLoadFailed: 'Failed to load available models',
      settingsSaveFailed: 'Failed to save settings',
      invalidValue: 'Invalid value provided',
      networkError: 'Network connection error',
      ollamaConnectionError: 'Cannot connect to Ollama service',
    },
    
    disclaimers: {
      medical: 'This AI is not a substitute for professional medical advice. Always consult healthcare professionals for medical concerns.',
      legal: 'This AI cannot provide legal advice. Consult qualified legal professionals for legal matters.',
      financial: 'This AI cannot provide financial advice. Consult certified financial advisors for investment decisions.',
      safety: 'This AI prioritizes safety and will refuse harmful requests. Use responsibly.',
      general: 'AI responses are generated and may contain errors. Verify important information independently.',
    },
    
    common: {
      save: 'Save',
      cancel: 'Cancel',
      reset: 'Reset',
      apply: 'Apply',
      close: 'Close',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info',
    },
  },
  
  zh: {
    settings: {
      title: '设置',
      modelConfiguration: '模型配置',
      generationParameters: '生成参数',
      languageSettings: '语言设置',
      themeSettings: '主题和显示',
      accessibilitySettings: '无障碍功能',
      
      selectModel: '选择模型',
      refreshModels: '刷新模型',
      modelNotAvailable: '模型不可用',
      ollamaOffline: 'Ollama 离线',
      loadingModels: '加载模型中...',
      
      temperature: '温度',
      temperatureDescription: '控制回答的随机性（0.1 = 专注，2.0 = 创意）',
      topP: 'Top P',
      topPDescription: '控制词汇选择的多样性（0.1 = 窄范围，1.0 = 多样化）',
      maxTokens: '最大令牌数',
      maxTokensDescription: '生成回答的最大长度',
      
      language: '语言',
      english: 'English',
      chinese: '中文',
      
      theme: '主题',
      light: '浅色',
      dark: '深色',
      highContrast: '高对比度',
      fontSize: '字体大小',
      small: '小',
      medium: '中',
      large: '大',
      enableAnimations: '启用动画',
      enableSounds: '启用声音',
      
      accessibility: '无障碍功能',
      enableScreenReader: '屏幕阅读器支持',
      enableKeyboardNavigation: '键盘导航',
      enableHighContrast: '高对比度模式',
      enableReducedMotion: '减少动效',
      screenReaderDescription: '通过 ARIA 标签增强屏幕阅读器支持',
      keyboardNavigationDescription: '完整的键盘导航支持',
      highContrastDescription: '高对比度颜色以提高可见性',
      reducedMotionDescription: '减少动画和过渡效果',
    },
    
    errors: {
      modelLoadFailed: '加载可用模型失败',
      settingsSaveFailed: '保存设置失败',
      invalidValue: '提供的值无效',
      networkError: '网络连接错误',
      ollamaConnectionError: '无法连接到 Ollama 服务',
    },
    
    disclaimers: {
      medical: '此 AI 不能替代专业医疗建议。医疗问题请咨询医疗专业人士。',
      legal: '此 AI 不能提供法律建议。法律事务请咨询合格的法律专业人士。',
      financial: '此 AI 不能提供财务建议。投资决策请咨询认证的财务顾问。',
      safety: '此 AI 优先考虑安全，会拒绝有害请求。请负责任地使用。',
      general: 'AI 回答是生成的，可能包含错误。请独立验证重要信息。',
    },
    
    common: {
      save: '保存',
      cancel: '取消',
      reset: '重置',
      apply: '应用',
      close: '关闭',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      warning: '警告',
      info: '信息',
    },
  },
};

export class I18n {
  private currentLanguage: Language = 'en';
  
  constructor(language: Language = 'en') {
    this.currentLanguage = language;
  }
  
  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }
  
  getLanguage(): Language {
    return this.currentLanguage;
  }
  
  t(key: string): string {
    const keys = key.split('.');
    let value: any = messages[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = messages.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found in fallback
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }
  
  // Helper method for getting error messages with fallback
  getErrorMessage(errorCode: string, fallback?: string): string {
    const message = this.t(`errors.${errorCode}`);
    return message !== `errors.${errorCode}` ? message : (fallback || errorCode);
  }
  
  // Helper method for getting disclaimer by context
  getDisclaimer(context: 'medical' | 'legal' | 'financial' | 'safety' | 'general'): string {
    return this.t(`disclaimers.${context}`);
  }
}

// Global i18n instance
export const i18n = new I18n();

// Hook for React components
export const useI18n = (language?: Language) => {
  if (language && language !== i18n.getLanguage()) {
    i18n.setLanguage(language);
  }
  
  return {
    t: i18n.t.bind(i18n),
    language: i18n.getLanguage(),
    setLanguage: i18n.setLanguage.bind(i18n),
    getErrorMessage: i18n.getErrorMessage.bind(i18n),
    getDisclaimer: i18n.getDisclaimer.bind(i18n),
  };
};