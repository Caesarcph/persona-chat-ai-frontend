/**
 * Offline detection and retry mechanisms
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LoadingButton, ConnectionStatus } from './LoadingStates';

interface OfflineDetectionProps {
  onConnectionChange?: (isOnline: boolean) => void;
  className?: string;
}

export const OfflineDetection: React.FC<OfflineDetectionProps> = ({
  onConnectionChange,
  className = ''
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastChecked(new Date());
      onConnectionChange?.(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastChecked(new Date());
      onConnectionChange?.(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onConnectionChange]);

  if (isOnline) return null;

  return (
    <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            You're currently offline. Some features may not be available.
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

interface ServiceHealthProps {
  healthCheckUrl?: string;
  checkInterval?: number; // milliseconds
  onHealthChange?: (isHealthy: boolean, details?: any) => void;
  className?: string;
}

export const ServiceHealth: React.FC<ServiceHealthProps> = ({
  healthCheckUrl = '/api/health',
  checkInterval = 30000, // 30 seconds
  onHealthChange,
  className = ''
}) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [healthDetails, setHealthDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const healthy = data.status === 'healthy';
        
        setIsHealthy(healthy);
        setHealthDetails(data);
        setLastCheck(new Date());
        onHealthChange?.(healthy, data);
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setIsHealthy(false);
      setError(errorMessage);
      setLastCheck(new Date());
      onHealthChange?.(false, { error: errorMessage });
    } finally {
      setIsChecking(false);
    }
  }, [healthCheckUrl, onHealthChange]);

  useEffect(() => {
    // Initial health check
    checkHealth();

    // Set up periodic health checks
    const interval = setInterval(checkHealth, checkInterval);

    return () => clearInterval(interval);
  }, [checkHealth, checkInterval]);

  const getStatusColor = () => {
    if (isHealthy === null) return 'gray';
    return isHealthy ? 'green' : 'red';
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (isHealthy === null) return 'Unknown';
    if (isHealthy) return 'All services healthy';
    return error || 'Service issues detected';
  };

  const getServiceStatus = (serviceName: string) => {
    if (!healthDetails?.services) return 'unknown';
    return healthDetails.services[serviceName] || 'unknown';
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">System Status</h3>
        <ConnectionStatus 
          isConnected={isHealthy === true}
          isReconnecting={isChecking}
          onRetry={checkHealth}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Overall Status:</span>
          <span className={`font-medium ${
            isHealthy === true ? 'text-green-600' : 
            isHealthy === false ? 'text-red-600' : 'text-gray-600'
          }`}>
            {getStatusText()}
          </span>
        </div>

        {healthDetails?.services && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Ollama:</span>
              <span className={`${
                getServiceStatus('ollama') === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {getServiceStatus('ollama')}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Database:</span>
              <span className={`${
                getServiceStatus('database') === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {getServiceStatus('database')}
              </span>
            </div>
          </div>
        )}

        {healthDetails?.ollama && !healthDetails.ollama.connected && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <p className="text-red-700 font-medium">Ollama Offline</p>
            <p className="text-red-600">
              {healthDetails.ollama.error || 'Cannot connect to Ollama service'}
            </p>
            <p className="text-red-500 mt-1">
              Make sure Ollama is running on {healthDetails.ollama.url}
            </p>
          </div>
        )}

        {lastCheck && (
          <div className="text-xs text-gray-500 mt-2">
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

interface RetryMechanismProps {
  onRetry: () => Promise<void>;
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  backoffMultiplier?: number;
  children: (retryState: RetryState) => React.ReactNode;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  retry: () => void;
  reset: () => void;
}

export const RetryMechanism: React.FC<RetryMechanismProps> = ({
  onRetry,
  maxRetries = 3,
  retryDelay = 1000,
  backoffMultiplier = 2,
  children
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const retry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setLastError(null);

    // Calculate delay with exponential backoff
    const delay = retryDelay * Math.pow(backoffMultiplier, retryCount);
    
    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      await onRetry();
      setRetryCount(0); // Reset on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed';
      setLastError(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, retryCount, maxRetries, retryDelay, backoffMultiplier]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setLastError(null);
    setIsRetrying(false);
  }, []);

  const retryState: RetryState = {
    isRetrying,
    retryCount,
    maxRetries,
    lastError,
    retry,
    reset
  };

  return <>{children(retryState)}</>;
};

interface ErrorBoundaryWithRetryProps {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
  onError?: (error: Error) => void;
  maxRetries?: number;
}

export const ErrorBoundaryWithRetry: React.FC<ErrorBoundaryWithRetryProps> = ({
  children,
  fallback,
  onError,
  maxRetries = 3
}) => {
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    if (retryCount < maxRetries) {
      setError(null);
      setRetryCount(prev => prev + 1);
    }
  }, [retryCount, maxRetries]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(new Error(event.message));
      onError?.(new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason));
      onError?.(new Error(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  if (error) {
    if (fallback) {
      return <>{fallback(error, retry)}</>;
    }

    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-3">
          <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
        </div>
        
        <p className="text-sm text-red-700 mb-3">{error.message}</p>
        
        <div className="flex items-center space-x-3">
          <LoadingButton
            isLoading={false}
            onClick={retry}
            disabled={retryCount >= maxRetries}
            variant="danger"
            size="small"
          >
            {retryCount >= maxRetries ? 'Max retries reached' : `Retry (${retryCount}/${maxRetries})`}
          </LoadingButton>
          
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default {
  OfflineDetection,
  ServiceHealth,
  RetryMechanism,
  ErrorBoundaryWithRetry
};