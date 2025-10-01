import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RateLimitFeedback from '../RateLimitFeedback';

// Mock timers for countdown testing
jest.useFakeTimers();

describe('RateLimitFeedback Component', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test('renders nothing when not rate limited and plenty of requests remaining', () => {
    const rateLimitInfo = {
      isLimited: false,
      requestsRemaining: 5,
      maxRequests: 5
    };

    const { container } = render(<RateLimitFeedback rateLimitInfo={rateLimitInfo} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders warning when few requests remaining', () => {
    const rateLimitInfo = {
      isLimited: false,
      requestsRemaining: 2,
      maxRequests: 5,
      windowMs: 60000
    };

    render(<RateLimitFeedback rateLimitInfo={rateLimitInfo} />);
    expect(screen.getByText(/2 of 5 requests remaining/)).toBeInTheDocument();
  });

  test('renders error state when rate limited', () => {
    const rateLimitInfo = {
      isLimited: true,
      retryAfter: 30,
      requestsRemaining: 0,
      maxRequests: 5,
      windowMs: 60000
    };

    render(<RateLimitFeedback rateLimitInfo={rateLimitInfo} />);
    
    expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
    expect(screen.getByText(/Rate limit reached/)).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument();
  });

  test('renders concurrent request limit message', () => {
    const rateLimitInfo = {
      isLimited: true,
      concurrentRequests: 3,
      maxConcurrent: 2
    };

    render(<RateLimitFeedback rateLimitInfo={rateLimitInfo} />);
    
    expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
    expect(screen.getByText(/Too many concurrent requests \(3\/2\)/)).toBeInTheDocument();
  });

  test('shows countdown timer and progress bar', () => {
    const rateLimitInfo = {
      isLimited: true,
      retryAfter: 60,
      requestsRemaining: 0,
      maxRequests: 5
    };

    render(<RateLimitFeedback rateLimitInfo={rateLimitInfo} />);
    
    expect(screen.getByText('1m 0s')).toBeInTheDocument();
    
    // Check for progress bar
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toBeInTheDocument();
  });

  test('countdown timer decreases over time', async () => {
    const rateLimitInfo = {
      isLimited: true,
      retryAfter: 5,
      requestsRemaining: 0,
      maxRequests: 5
    };

    render(<RateLimitFeedback rateLimitInfo={rateLimitInfo} />);
    
    expect(screen.getByText('5s')).toBeInTheDocument();
    
    // Advance timer by 1 second
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('4s')).toBeInTheDocument();
    });
    
    // Advance timer by 3 more seconds
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(screen.getByText('1s')).toBeInTheDocument();
    });
  });

  test('shows retry button when countdown reaches zero', async () => {
    const onRetry = jest.fn();
    const rateLimitInfo = {
      isLimited: true,
      retryAfter: 2,
      requestsRemaining: 0,
      maxRequests: 5
    };

    render(<RateLimitFeedback rateLimitInfo={rateLimitInfo} onRetry={onRetry} />);
    
    // Initially no retry button
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    
    // Advance timer to completion
    jest.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
    
    // Click retry button
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('formats time correctly for different durations', () => {
    const testCases = [
      { seconds: 30, expected: '30s' },
      { seconds: 60, expected: '1m 0s' },
      { seconds: 90, expected: '1m 30s' },
      { seconds: 125, expected: '2m 5s' }
    ];

    testCases.forEach(({ seconds, expected }) => {
      const rateLimitInfo = {
        isLimited: true,
        retryAfter: seconds,
        requestsRemaining: 0,
        maxRequests: 5
      };

      const { unmount } = render(<RateLimitFeedback rateLimitInfo={rateLimitInfo} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  test('applies custom className', () => {
    const rateLimitInfo = {
      isLimited: true,
      retryAfter: 30,
      requestsRemaining: 0,
      maxRequests: 5
    };

    const { container } = render(
      <RateLimitFeedback rateLimitInfo={rateLimitInfo} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  test('has proper accessibility attributes', () => {
    const rateLimitInfo = {
      isLimited: true,
      retryAfter: 30,
      requestsRemaining: 0,
      maxRequests: 5
    };

    render(<RateLimitFeedback rateLimitInfo={rateLimitInfo} />);
    
    const alertDiv = screen.getByRole('alert');
    expect(alertDiv).toBeInTheDocument();
  });

  test('handles edge case of zero retry time', () => {
    const onRetry = jest.fn();
    const rateLimitInfo = {
      isLimited: true,
      retryAfter: 0,
      requestsRemaining: 0,
      maxRequests: 5
    };

    render(<RateLimitFeedback rateLimitInfo={rateLimitInfo} onRetry={onRetry} />);
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});