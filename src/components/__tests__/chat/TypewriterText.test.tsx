import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TypewriterText } from '../../chat/TypewriterText';

// Mock timers for testing
jest.useFakeTimers();

describe('TypewriterText', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders empty initially', () => {
    render(<TypewriterText text="Hello World" speed={100} />);
    
    // Should start empty
    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
  });

  it('displays text character by character', async () => {
    render(<TypewriterText text="Hi" speed={100} />);
    
    // Initially empty
    expect(screen.queryByText('Hi')).not.toBeInTheDocument();
    
    // After first character
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      expect(screen.getByText(/H/)).toBeInTheDocument();
    });
    
    // After second character
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      expect(screen.getByText('Hi')).toBeInTheDocument();
    });
  });

  it('calls onComplete when text is fully displayed', async () => {
    const mockOnComplete = jest.fn();
    render(<TypewriterText text="Hi" speed={50} onComplete={mockOnComplete} />);
    
    // Advance through all characters
    jest.advanceTimersByTime(100); // 2 characters * 50ms
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('shows cursor animation while typing', async () => {
    render(<TypewriterText text="Hello" speed={50} />);
    
    // Should show cursor initially
    expect(screen.getByText('|')).toBeInTheDocument();
    expect(screen.getByText('|')).toHaveClass('animate-pulse');
  });

  it('resets when text changes', async () => {
    const { rerender } = render(<TypewriterText text="Hello" speed={50} />);
    
    // Let some text display
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      expect(screen.getByText(/He/)).toBeInTheDocument();
    });
    
    // Change text
    rerender(<TypewriterText text="World" speed={50} />);
    
    // Should reset and start over
    jest.advanceTimersByTime(50);
    await waitFor(() => {
      expect(screen.getByText(/W/)).toBeInTheDocument();
      expect(screen.queryByText(/He/)).not.toBeInTheDocument();
    });
  });
});