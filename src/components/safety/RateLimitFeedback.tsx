import React, { useState, useEffect } from 'react';

export interface RateLimitInfo {
  isLimited: boolean;
  retryAfter?: number; // seconds until retry allowed
  requestsRemaining?: number;
  maxRequests?: number;
  windowMs?: number; // rate limit window in milliseconds
  concurrentRequests?: number;
  maxConcurrent?: number;
}

export interface RateLimitFeedbackProps {
  rateLimitInfo: RateLimitInfo;
  onRetry?: () => void;
  className?: string;
}

const RateLimitFeedback: React.FC<RateLimitFeedbackProps> = ({
  rateLimitInfo,
  onRetry,
  className = ''
}) => {
  const [countdown, setCountdown] = useState(rateLimitInfo.retryAfter || 0);

  useEffect(() => {
    if (rateLimitInfo.retryAfter && rateLimitInfo.retryAfter > 0) {
      setCountdown(rateLimitInfo.retryAfter);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [rateLimitInfo.retryAfter]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getRateLimitMessage = (): string => {
    if (rateLimitInfo.concurrentRequests && rateLimitInfo.maxConcurrent) {
      return `Too many concurrent requests (${rateLimitInfo.concurrentRequests}/${rateLimitInfo.maxConcurrent}). Please wait for current requests to complete.`;
    }
    
    if (rateLimitInfo.requestsRemaining !== undefined && rateLimitInfo.maxRequests) {
      if (rateLimitInfo.requestsRemaining === 0) {
        return `Rate limit reached (${rateLimitInfo.maxRequests} requests per ${rateLimitInfo.windowMs ? Math.floor(rateLimitInfo.windowMs / 60000) : 1} minute). Please wait before sending another message.`;
      } else {
        return `${rateLimitInfo.requestsRemaining} of ${rateLimitInfo.maxRequests} requests remaining this minute.`;
      }
    }
    
    return 'Rate limit exceeded. Please wait before sending another message.';
  };

  if (!rateLimitInfo.isLimited && (rateLimitInfo.requestsRemaining === undefined || rateLimitInfo.requestsRemaining > 2)) {
    return null; // Don't show anything if not rate limited and plenty of requests remaining
  }

  return (
    <div className={`${className}`}>
      {rateLimitInfo.isLimited ? (
        // Rate limited - show error state
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4" role="alert">
          <div className="flex items-start">
            <div className="bg-red-100 rounded-full p-1 mr-3 flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-1">
                Rate Limit Exceeded
              </h4>
              
              <p className="text-sm text-red-700 mb-2">
                {getRateLimitMessage()}
              </p>
              
              {countdown > 0 && (
                <div className="flex items-center space-x-2 mb-3">
                  <div className="bg-red-200 rounded-full h-2 flex-1">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.max(0, 100 - (countdown / (rateLimitInfo.retryAfter || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-red-700 font-mono">
                    {formatTime(countdown)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                {countdown === 0 && onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-sm font-medium text-red-700 hover:text-red-900 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                )}
                
                <span className="text-xs text-red-600">
                  Tip: Wait a moment between messages for better performance
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Warning state - low requests remaining
        rateLimitInfo.requestsRemaining !== undefined && rateLimitInfo.requestsRemaining <= 2 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-full p-1 mr-2 flex-shrink-0">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <p className="text-sm text-yellow-800">
                {getRateLimitMessage()}
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default RateLimitFeedback;