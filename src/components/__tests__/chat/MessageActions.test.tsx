import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageActions } from '../../chat/MessageActions';

describe('MessageActions', () => {
  const defaultProps = {
    messageId: 'test-message-id',
    onCopy: jest.fn(),
    onRegenerate: jest.fn(),
    canRegenerate: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders copy button', () => {
    render(<MessageActions {...defaultProps} />);
    
    const copyButton = screen.getByLabelText('Copy message');
    expect(copyButton).toBeInTheDocument();
  });

  it('renders regenerate button when canRegenerate is true', () => {
    render(<MessageActions {...defaultProps} canRegenerate={true} />);
    
    const regenerateButton = screen.getByLabelText('Regenerate response');
    expect(regenerateButton).toBeInTheDocument();
  });

  it('does not render regenerate button when canRegenerate is false', () => {
    render(<MessageActions {...defaultProps} canRegenerate={false} />);
    
    const regenerateButton = screen.queryByLabelText('Regenerate response');
    expect(regenerateButton).not.toBeInTheDocument();
  });

  it('calls onCopy when copy button is clicked', () => {
    render(<MessageActions {...defaultProps} />);
    
    const copyButton = screen.getByLabelText('Copy message');
    fireEvent.click(copyButton);
    
    expect(defaultProps.onCopy).toHaveBeenCalledTimes(1);
  });

  it('calls onRegenerate when regenerate button is clicked', () => {
    render(<MessageActions {...defaultProps} />);
    
    const regenerateButton = screen.getByLabelText('Regenerate response');
    fireEvent.click(regenerateButton);
    
    expect(defaultProps.onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<MessageActions {...defaultProps} />);
    
    const copyButton = screen.getByLabelText('Copy message');
    const regenerateButton = screen.getByLabelText('Regenerate response');
    
    expect(copyButton).toHaveAttribute('title', 'Copy message');
    expect(regenerateButton).toHaveAttribute('title', 'Regenerate response');
  });
});