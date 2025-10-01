import React from 'react';

export interface SafetyWarningProps {
  type: 'sensitive_fields' | 'professional_context' | 'rate_limit' | 'content_blocked' | 'banned_topics' | 'expertise_mismatch';
  title: string;
  message: string;
  details?: string[];
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  severity?: 'info' | 'warning' | 'error';
}

const SafetyWarning: React.FC<SafetyWarningProps> = ({
  type,
  title,
  message,
  details = [],
  onDismiss,
  onAction,
  actionLabel,
  severity = 'warning'
}) => {
  const getIconAndColors = () => {
    switch (severity) {
      case 'error':
        return {
          icon: (
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconBg: 'bg-red-100'
        };
      case 'info':
        return {
          icon: (
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconBg: 'bg-blue-100'
        };
      default: // warning
        return {
          icon: (
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconBg: 'bg-yellow-100'
        };
    }
  };

  const { icon, bgColor, borderColor, textColor, iconBg } = getIconAndColors();

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-4`} role="alert">
      <div className="flex items-start">
        <div className={`${iconBg} rounded-full p-1 mr-3 flex-shrink-0`}>
          {icon}
        </div>
        
        <div className="flex-1">
          <h4 className={`font-medium ${textColor} mb-1`}>
            {title}
          </h4>
          
          <p className={`text-sm ${textColor} mb-2`}>
            {message}
          </p>
          
          {details.length > 0 && (
            <ul className={`text-sm ${textColor} list-disc list-inside space-y-1 mb-3`}>
              {details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
          
          <div className="flex items-center space-x-3">
            {onAction && actionLabel && (
              <button
                onClick={onAction}
                className={`text-sm font-medium ${
                  severity === 'error' 
                    ? 'text-red-700 hover:text-red-900' 
                    : severity === 'info'
                    ? 'text-blue-700 hover:text-blue-900'
                    : 'text-yellow-700 hover:text-yellow-900'
                } underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  severity === 'error' 
                    ? 'focus:ring-red-500' 
                    : severity === 'info'
                    ? 'focus:ring-blue-500'
                    : 'focus:ring-yellow-500'
                }`}
              >
                {actionLabel}
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`text-sm ${textColor} hover:${
                  severity === 'error' 
                    ? 'text-red-900' 
                    : severity === 'info'
                    ? 'text-blue-900'
                    : 'text-yellow-900'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  severity === 'error' 
                    ? 'focus:ring-red-500' 
                    : severity === 'info'
                    ? 'focus:ring-blue-500'
                    : 'focus:ring-yellow-500'
                }`}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`ml-2 ${textColor} hover:${
              severity === 'error' 
                ? 'text-red-900' 
                : severity === 'info'
                ? 'text-blue-900'
                : 'text-yellow-900'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              severity === 'error' 
                ? 'focus:ring-red-500' 
                : severity === 'info'
                ? 'focus:ring-blue-500'
                : 'focus:ring-yellow-500'
            } rounded`}
            aria-label="Dismiss warning"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SafetyWarning;