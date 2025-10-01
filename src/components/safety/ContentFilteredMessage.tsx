import React from 'react';

export interface ContentFilteredMessageProps {
  reason: string;
  suggestedResponse?: string;
  onTryAgain?: () => void;
  onEditMessage?: () => void;
  className?: string;
}

const ContentFilteredMessage: React.FC<ContentFilteredMessageProps> = ({
  reason,
  suggestedResponse,
  onTryAgain,
  onEditMessage,
  className = ''
}) => {
  const getReasonDisplay = (reason: string): { title: string; description: string; suggestions: string[] } => {
    switch (reason) {
      case 'prompt_injection':
        return {
          title: 'Message Format Issue',
          description: 'Your message contains formatting that could interfere with the conversation.',
          suggestions: [
            'Try rephrasing your message in plain language',
            'Avoid using special formatting or system-like commands',
            'Ask your question directly and naturally'
          ]
        };
      
      case 'sensitive_topic':
        return {
          title: 'Content Policy Restriction',
          description: 'Your message touches on topics that require special handling for safety.',
          suggestions: [
            'Try asking about the topic in a more general, educational context',
            'Consider rephrasing to focus on factual information',
            'If you need professional advice, consult with a qualified expert'
          ]
        };
      
      case 'safety_violation':
        return {
          title: 'Safety Guidelines',
          description: 'Your message was flagged by our safety systems.',
          suggestions: [
            'Ensure your message is constructive and appropriate',
            'Try rephrasing your question in a different way',
            'Focus on educational or informational aspects of your topic'
          ]
        };
      
      default:
        return {
          title: 'Message Blocked',
          description: 'Your message couldn\'t be processed due to content guidelines.',
          suggestions: [
            'Try rephrasing your message',
            'Ensure your message is appropriate and constructive',
            'Contact support if you believe this was an error'
          ]
        };
    }
  };

  const { title, description, suggestions } = getReasonDisplay(reason);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`} role="alert">
      <div className="flex items-start">
        <div className="bg-red-100 rounded-full p-1 mr-3 flex-shrink-0">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-red-800 mb-1">
            {title}
          </h4>
          
          <p className="text-sm text-red-700 mb-3">
            {description}
          </p>
          
          {suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-red-800 mb-2">Suggestions:</p>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {suggestedResponse && (
            <div className="bg-red-100 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-red-800 mb-1">Alternative response:</p>
              <p className="text-sm text-red-700 italic">"{suggestedResponse}"</p>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            {onEditMessage && (
              <button
                onClick={onEditMessage}
                className="text-sm font-medium text-red-700 hover:text-red-900 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Edit Message
              </button>
            )}
            
            {onTryAgain && (
              <button
                onClick={onTryAgain}
                className="text-sm font-medium text-red-700 hover:text-red-900 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Different Message
              </button>
            )}
            
            <span className="text-xs text-red-600">
              These guidelines help ensure safe and constructive conversations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentFilteredMessage;