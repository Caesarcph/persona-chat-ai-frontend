import React from 'react';
import ContentFilteredMessage from '../safety/ContentFilteredMessage';
import RateLimitFeedback, { RateLimitInfo } from '../safety/RateLimitFeedback';
import ProfessionalDisclaimer from '../safety/ProfessionalDisclaimer';

export interface ChatError {
  error: string;
  message: string;
  reason?: string;
  suggested_response?: string;
  filter_type?: string;
  rateLimitInfo?: RateLimitInfo;
  timestamp?: string;
}

export interface ChatErrorHandlerProps {
  error: ChatError | null;
  onRetry?: () => void;
  onEditMessage?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ChatErrorHandler: React.FC<ChatErrorHandlerProps> = ({
  error,
  onRetry,
  onEditMessage,
  onDismiss,
  className = ''
}) => {
  if (!error) return null;

  const renderErrorContent = () => {
    switch (error.error) {
      case 'CONTENT_FILTERED':
        return (
          <ContentFilteredMessage
            reason={error.reason || 'unknown'}
            suggestedResponse={error.suggested_response}
            onTryAgain={onRetry}
            onEditMessage={onEditMessage}
            className="mb-4"
          />
        );

      case 'RATE_LIMIT_EXCEEDED':
      case 'TOO_MANY_CONCURRENT_REQUESTS':
        return (
          <RateLimitFeedback
            rateLimitInfo={error.rateLimitInfo || { isLimited: true }}
            onRetry={onRetry}
            className="mb-4"
          />
        );

      case 'OLLAMA_UNAVAILABLE':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4" role="alert">
            <div className="flex items-start">
              <div className="bg-red-100 rounded-full p-1 mr-3 flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-red-800 mb-1">
                  AI Service Unavailable
                </h4>
                
                <p className="text-sm text-red-700 mb-3">
                  The AI service is currently offline or unreachable. Please check your Ollama installation.
                </p>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-red-800 mb-2">Troubleshooting steps:</p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    <li>Ensure Ollama is running on your system</li>
                    <li>Check that Ollama is accessible at localhost:11434</li>
                    <li>Verify you have at least one model installed</li>
                    <li>Try restarting the Ollama service</li>
                  </ul>
                </div>
                
                <div className="flex items-center space-x-3">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="text-sm font-medium text-red-700 hover:text-red-900 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Check Connection
                    </button>
                  )}
                  
                  <a
                    href="https://ollama.ai/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-red-700 hover:text-red-900 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Download Ollama
                  </a>
                </div>
              </div>
            </div>
          </div>
        );

      case 'NO_MODELS_AVAILABLE':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4" role="alert">
            <div className="flex items-start">
              <div className="bg-yellow-100 rounded-full p-1 mr-3 flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800 mb-1">
                  No AI Models Available
                </h4>
                
                <p className="text-sm text-yellow-700 mb-3">
                  No AI models are currently available. You need to install at least one model to start chatting.
                </p>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Install a model:</p>
                  <div className="bg-yellow-100 rounded-lg p-3">
                    <code className="text-sm text-yellow-800">
                      ollama pull llama2
                    </code>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="text-sm font-medium text-yellow-700 hover:text-yellow-900 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Refresh Models
                    </button>
                  )}
                  
                  <a
                    href="https://ollama.ai/library"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-yellow-700 hover:text-yellow-900 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Browse Models
                  </a>
                </div>
              </div>
            </div>
          </div>
        );

      case 'VALIDATION_ERROR':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4" role="alert">
            <div className="flex items-start">
              <div className="bg-red-100 rounded-full p-1 mr-3 flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-red-800 mb-1">
                  Invalid Request
                </h4>
                
                <p className="text-sm text-red-700 mb-3">
                  {error.message || 'The request could not be processed due to validation errors.'}
                </p>
                
                <div className="flex items-center space-x-3">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="text-sm font-medium text-red-700 hover:text-red-900 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'STREAMING_ERROR':
      case 'GENERATION_ERROR':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4" role="alert">
            <div className="flex items-start">
              <div className="bg-red-100 rounded-full p-1 mr-3 flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-red-800 mb-1">
                  Generation Error
                </h4>
                
                <p className="text-sm text-red-700 mb-3">
                  An error occurred while generating the response. This might be a temporary issue.
                </p>
                
                <div className="flex items-center space-x-3">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="text-sm font-medium text-red-700 hover:text-red-900 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Retry Message
                    </button>
                  )}
                  
                  <span className="text-xs text-red-600">
                    If this persists, try a different model or restart Ollama
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4" role="alert">
            <div className="flex items-start">
              <div className="bg-gray-100 rounded-full p-1 mr-3 flex-shrink-0">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 mb-1">
                  Unexpected Error
                </h4>
                
                <p className="text-sm text-gray-700 mb-3">
                  {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
                
                <div className="flex items-center space-x-3">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="text-sm font-medium text-gray-700 hover:text-gray-900 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Try Again
                    </button>
                  )}
                  
                  {onDismiss && (
                    <button
                      onClick={onDismiss}
                      className="text-sm text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {renderErrorContent()}
    </div>
  );
};

export default ChatErrorHandler;