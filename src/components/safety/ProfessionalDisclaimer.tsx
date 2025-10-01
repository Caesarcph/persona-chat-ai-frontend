import React, { useState } from 'react';

export interface ProfessionalDisclaimerProps {
  type: 'medical' | 'legal' | 'financial' | 'safety';
  context?: string; // Additional context about why disclaimer is shown
  onAcknowledge?: () => void;
  dismissible?: boolean;
  className?: string;
}

const ProfessionalDisclaimer: React.FC<ProfessionalDisclaimerProps> = ({
  type,
  context,
  onAcknowledge,
  dismissible = true,
  className = ''
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const getDisclaimerContent = () => {
    switch (type) {
      case 'medical':
        return {
          icon: '⚕️',
          title: 'Medical Information Disclaimer',
          message: 'I am not a licensed medical professional. This information is for educational purposes only and should not replace professional medical advice.',
          action: 'Please consult with a qualified healthcare provider for medical concerns.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconBg: 'bg-blue-100'
        };
      
      case 'legal':
        return {
          icon: '⚖️',
          title: 'Legal Information Disclaimer',
          message: 'I am not a licensed attorney. This information is for general educational purposes only and should not be considered legal advice.',
          action: 'Please consult with a qualified legal professional for specific legal matters.',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800',
          iconBg: 'bg-purple-100'
        };
      
      case 'financial':
        return {
          icon: '💰',
          title: 'Financial Information Disclaimer',
          message: 'I am not a licensed financial advisor. This information is for educational purposes only and should not be considered investment or financial advice.',
          action: 'Please consult with a qualified financial professional before making financial decisions.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconBg: 'bg-green-100'
        };
      
      case 'safety':
        return {
          icon: '🛡️',
          title: 'Safety Notice',
          message: 'I cannot and will not provide guidance on potentially harmful activities.',
          action: 'If you\'re experiencing thoughts of self-harm, please contact a mental health professional or crisis helpline immediately.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconBg: 'bg-red-100'
        };
      
      default:
        return {
          icon: 'ℹ️',
          title: 'Professional Disclaimer',
          message: 'This information is provided for educational purposes only.',
          action: 'Please consult with a qualified professional for specific advice.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconBg: 'bg-gray-100'
        };
    }
  };

  const disclaimer = getDisclaimerContent();

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onAcknowledge) {
      onAcknowledge();
    }
  };

  return (
    <div className={`${disclaimer.bgColor} ${disclaimer.borderColor} border rounded-lg p-4 mb-4 ${className}`} role="alert">
      <div className="flex items-start">
        <div className={`${disclaimer.iconBg} rounded-full p-2 mr-3 flex-shrink-0`}>
          <span className="text-lg" role="img" aria-label={`${type} disclaimer`}>
            {disclaimer.icon}
          </span>
        </div>
        
        <div className="flex-1">
          <h4 className={`font-medium ${disclaimer.textColor} mb-2`}>
            {disclaimer.title}
          </h4>
          
          <p className={`text-sm ${disclaimer.textColor} mb-2`}>
            {disclaimer.message}
          </p>
          
          <p className={`text-sm ${disclaimer.textColor} font-medium mb-3`}>
            {disclaimer.action}
          </p>
          
          {context && (
            <div className={`${disclaimer.iconBg} rounded-lg p-3 mb-3`}>
              <p className={`text-sm ${disclaimer.textColor}`}>
                <strong>Context:</strong> {context}
              </p>
            </div>
          )}
          
          {type === 'safety' && (
            <div className="mb-3">
              <p className={`text-sm ${disclaimer.textColor} font-medium mb-2`}>
                Crisis Resources:
              </p>
              <ul className={`text-sm ${disclaimer.textColor} space-y-1`}>
                <li>• National Suicide Prevention Lifeline: 988</li>
                <li>• Crisis Text Line: Text HOME to 741741</li>
                <li>• International Association for Suicide Prevention: <a href="https://www.iasp.info/resources/Crisis_Centres/" className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">Crisis Centers</a></li>
              </ul>
            </div>
          )}
          
          {dismissible && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDismiss}
                className={`text-sm font-medium ${disclaimer.textColor} hover:opacity-80 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                I Understand
              </button>
              
              <span className={`text-xs ${disclaimer.textColor} opacity-75`}>
                This disclaimer will appear for relevant topics
              </span>
            </div>
          )}
        </div>
        
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`ml-2 ${disclaimer.textColor} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded`}
            aria-label="Dismiss disclaimer"
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

export default ProfessionalDisclaimer;