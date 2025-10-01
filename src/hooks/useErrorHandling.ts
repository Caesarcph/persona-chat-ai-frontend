/**
 * Comprehensive error handling hook with retry mechanisms
 */

import { useState, useCallback, useRef } from 'react';

export interface ErrorState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  canRetry: boolean;
}

export interface ErrorHandlingOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  onError?: (error: Error) => void;
  onRetry?: (retryCount: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export interface UseErrorHandlingReturn {
  errorState: ErrorState;
  handleError: (error: Error) => void;
  retry: () => Promise<void>;
  reset: () => void;
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => (...args: T) => Promise<R | undefined>;
}

export const useErrorHandling = (
  options: ErrorHandlingOptions = {}
): UseErrorHandlingReturn => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    onError,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const lastFailedOperation = useRef<(() => Promise<void>) | null>(null);

  const errorState: ErrorState = {
    error,
    isRetrying,
    retryCount,
    maxRetries,
    canRetry: retryCount < maxRetries && lastFailedOperation.current !== null
  };

  const handleError = useCallback((err: Error) => {
    setError(err);
    onError?.(err);
  }, [onError]);

  const retry = useCallback(async () => {
    if (!lastFailedOperation.current || retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setError(null);

    // Calculate delay with exponential backoff
    const delay = retryDelay * Math.pow(backoffMultiplier, retryCount);
    
    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      await lastFailedOperation.current();
      
      // Success - reset retry count
      setRetryCount(0);
      lastFailedOperation.current = null;
      onRetry?.(retryCount + 1);
    } catch (err) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      if (newRetryCount >= maxRetries) {
        onMaxRetriesReached?.(err as Error);
        lastFailedOperation.current = null;
      }
      
      handleError(err as Error);
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries, retryDelay, backoffMultiplier, handleError, onRetry, onMaxRetriesReached]);

  const reset = useCallback(() => {
    setError(null);
    setIsRetrying(false);
    setRetryCount(0);
    lastFailedOperation.current = null;
  }, []);

  const withErrorHandling = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R>) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          const result = await fn(...args);
          reset(); // Clear any previous errors on success
          return result;
        } catch (err) {
          // Store the failed operation for retry
          lastFailedOperation.current = () => fn(...args).then(() => {});
          handleError(err as Error);
          return undefined;
        }
      };
    },
    [handleError, reset]
  );

  return {
    errorState,
    handleError,
    retry,
    reset,
    withErrorHandling
  };
};

// Specialized error handling hooks for common scenarios

export const useApiErrorHandling = (baseUrl: string = '/api') => {
  const errorHandling = useErrorHandling({
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    onError: (error) => {
      console.error('API Error:', error);
    }
  });

  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const url = `${baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return response.json();
    },
    [baseUrl]
  );

  const wrappedApiCall = errorHandling.withErrorHandling(apiCall);

  return {
    ...errorHandling,
    apiCall: wrappedApiCall
  };
};

export const useStreamingErrorHandling = () => {
  return useErrorHandling({
    maxRetries: 5,
    retryDelay: 2000,
    backoffMultiplier: 1.5,
    onError: (error) => {
      console.error('Streaming Error:', error);
    },
    onRetry: (retryCount) => {
      console.log(`Streaming retry attempt ${retryCount}`);
    }
  });
};

export const useFileOperationErrorHandling = () => {
  return useErrorHandling({
    maxRetries: 2,
    retryDelay: 500,
    backoffMultiplier: 2,
    onError: (error) => {
      console.error('File Operation Error:', error);
    }
  });
};

// Error classification utilities
export const classifyError = (error: Error): 'network' | 'validation' | 'server' | 'client' | 'unknown' => {
  const message = error.message.toLowerCase();
  
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return 'network';
  }
  
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return 'validation';
  }
  
  if (message.includes('500') || message.includes('internal server')) {
    return 'server';
  }
  
  if (message.includes('400') || message.includes('401') || message.includes('403') || message.includes('404')) {
    return 'client';
  }
  
  return 'unknown';
};

export const getErrorMessage = (error: Error): string => {
  const errorType = classifyError(error);
  
  switch (errorType) {
    case 'network':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'validation':
      return 'Please check your input and try again.';
    case 'server':
      return 'Server error occurred. Please try again in a moment.';
    case 'client':
      return 'Request failed. Please check your input and try again.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

export const getRetryRecommendation = (error: Error): string => {
  const errorType = classifyError(error);
  
  switch (errorType) {
    case 'network':
      return 'Check your connection and retry';
    case 'validation':
      return 'Fix the input and try again';
    case 'server':
      return 'Wait a moment and retry';
    case 'client':
      return 'Check your request and retry';
    default:
      return 'Try again or reload the page';
  }
};

export default useErrorHandling;