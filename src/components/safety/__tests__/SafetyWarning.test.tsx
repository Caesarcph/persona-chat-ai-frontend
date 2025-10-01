import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SafetyWarning from '../SafetyWarning';

describe('SafetyWarning Component', () => {
  const defaultProps = {
    type: 'sensitive_fields' as const,
    title: 'Test Warning',
    message: 'This is a test warning message'
  };

  test('renders warning with title and message', () => {
    render(<SafetyWarning {...defaultProps} />);
    
    expect(screen.getByText('Test Warning')).toBeInTheDocument();
    expect(screen.getByText('This is a test warning message')).toBeInTheDocument();
  });

  test('renders details list when provided', () => {
    const details = ['Detail 1', 'Detail 2', 'Detail 3'];
    render(<SafetyWarning {...defaultProps} details={details} />);
    
    details.forEach(detail => {
      expect(screen.getByText(detail)).toBeInTheDocument();
    });
  });

  test('renders action button when provided', () => {
    const onAction = jest.fn();
    render(
      <SafetyWarning 
        {...defaultProps} 
        onAction={onAction}
        actionLabel="Take Action"
      />
    );
    
    const actionButton = screen.getByText('Take Action');
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test('renders dismiss button when onDismiss provided', () => {
    const onDismiss = jest.fn();
    render(<SafetyWarning {...defaultProps} onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByText('Dismiss');
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('renders close button when onDismiss provided', () => {
    const onDismiss = jest.fn();
    render(<SafetyWarning {...defaultProps} onDismiss={onDismiss} />);
    
    const closeButton = screen.getByLabelText('Dismiss warning');
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('applies correct styling for error severity', () => {
    const { container } = render(
      <SafetyWarning {...defaultProps} severity="error" />
    );
    
    const warningDiv = container.firstChild as HTMLElement;
    expect(warningDiv).toHaveClass('bg-red-50', 'border-red-200');
  });

  test('applies correct styling for info severity', () => {
    const { container } = render(
      <SafetyWarning {...defaultProps} severity="info" />
    );
    
    const warningDiv = container.firstChild as HTMLElement;
    expect(warningDiv).toHaveClass('bg-blue-50', 'border-blue-200');
  });

  test('applies correct styling for warning severity (default)', () => {
    const { container } = render(<SafetyWarning {...defaultProps} />);
    
    const warningDiv = container.firstChild as HTMLElement;
    expect(warningDiv).toHaveClass('bg-yellow-50', 'border-yellow-200');
  });

  test('has proper accessibility attributes', () => {
    render(<SafetyWarning {...defaultProps} />);
    
    const warningDiv = screen.getByRole('alert');
    expect(warningDiv).toBeInTheDocument();
  });

  test('handles different warning types', () => {
    const types = ['sensitive_fields', 'professional_context', 'rate_limit', 'content_blocked'] as const;
    
    types.forEach(type => {
      const { unmount } = render(
        <SafetyWarning {...defaultProps} type={type} />
      );
      
      expect(screen.getByText('Test Warning')).toBeInTheDocument();
      unmount();
    });
  });
});