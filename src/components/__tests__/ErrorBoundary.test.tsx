/**
 * Tests for ErrorBoundary component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary, PersonaBuilderErrorBoundary, ChatInterfaceErrorBoundary, SettingsErrorBoundary } from '../ErrorBoundary';

// Mock component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when no error occurs', () => {
    it('should render children normally', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('when error occurs', () => {
    it('should render default error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument();
    });

    it('should render custom fallback UI when provided', () => {
      const customFallback = <div>Custom error message</div>;
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should call onError callback when provided', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Error Details (Development Mode)')).toBeInTheDocument();
      expect(screen.getByText(/Test error/)).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.queryByText('Error Details (Development Mode)')).not.toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('error recovery', () => {
    it('should reset error state when Try Again is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
      
      // Re-render with non-throwing component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should reload page when Reload Page is clicked', () => {
      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      fireEvent.click(screen.getByRole('button', { name: 'Reload Page' }));
      
      expect(mockReload).toHaveBeenCalled();
    });
  });
});

describe('Specialized Error Boundaries', () => {
  describe('PersonaBuilderErrorBoundary', () => {
    it('should render persona-specific error message', () => {
      render(
        <PersonaBuilderErrorBoundary>
          <ThrowError />
        </PersonaBuilderErrorBoundary>
      );
      
      expect(screen.getByText('Persona Builder Error')).toBeInTheDocument();
      expect(screen.getByText(/The persona builder encountered an error/)).toBeInTheDocument();
    });
  });

  describe('ChatInterfaceErrorBoundary', () => {
    it('should render chat-specific error message', () => {
      render(
        <ChatInterfaceErrorBoundary>
          <ThrowError />
        </ChatInterfaceErrorBoundary>
      );
      
      expect(screen.getByText('Chat Interface Error')).toBeInTheDocument();
      expect(screen.getByText(/The chat interface encountered an error/)).toBeInTheDocument();
    });
  });

  describe('SettingsErrorBoundary', () => {
    it('should render settings-specific error message', () => {
      render(
        <SettingsErrorBoundary>
          <ThrowError />
        </SettingsErrorBoundary>
      );
      
      expect(screen.getByText('Settings Error')).toBeInTheDocument();
      expect(screen.getByText(/The settings panel encountered an error/)).toBeInTheDocument();
    });
  });

  describe('error logging', () => {
    it('should log errors to console for specialized boundaries', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(
        <PersonaBuilderErrorBoundary>
          <ThrowError />
        </PersonaBuilderErrorBoundary>
      );
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Persona Builder Error:',
        expect.any(Error),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });
  });
});