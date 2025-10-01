import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageItem } from '../../chat/MessageItem';
import { Message } from '../../../../../shared';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock ReactMarkdown
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

describe('MessageItem', () => {
  const mockUserMessage: Message = {
    id: 'user-msg-1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: new Date('2024-01-01T12:00:00Z')
  };

  const mockAssistantMessage: Message = {
    id: 'assistant-msg-1',
    role: 'assistant',
    content: 'I am doing well, thank you for asking!',
    timestamp: new Date('2024-01-01T12:01:00Z')
  };

  const defaultProps = {
    onCopy: jest.fn(),
    onRegenerate: jest.fn(),
    showActions: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user message with correct styling', () => {
    render(<MessageItem message={mockUserMessage} {...defaultProps} />);
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument(); // User avatar
    
    // Check for user message styling
    const messageContent = screen.getByText('Hello, how are you?').closest('div');
    expect(messageContent).toHaveClass('bg-blue-500', 'text-white');
  });

  it('renders assistant message with correct styling', () => {
    render(<MessageItem message={mockAssistantMessage} {...defaultProps} />);
    
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('I am doing well, thank you for asking!');
    expect(screen.getByText('A')).toBeInTheDocument(); // Assistant avatar
    
    // Check for assistant message styling
    const messageContent = screen.getByTestId('markdown-content').closest('div');
    expect(messageContent).toHaveClass('bg-gray-100', 'text-gray-900');
  });

  it('displays timestamp correctly', () => {
    render(<MessageItem message={mockUserMessage} {...defaultProps} />);
    
    // Should display time in local format
    expect(screen.getByText(/12:00/)).toBeInTheDocument();
  });

  it('shows message actions when showActions is true', () => {
    render(<MessageItem message={mockAssistantMessage} {...defaultProps} showActions={true} />);
    
    expect(screen.getByLabelText('Copy message')).toBeInTheDocument();
    expect(screen.getByLabelText('Regenerate response')).toBeInTheDocument();
  });

  it('hides message actions when showActions is false', () => {
    render(<MessageItem message={mockAssistantMessage} {...defaultProps} showActions={false} />);
    
    expect(screen.queryByLabelText('Copy message')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Regenerate response')).not.toBeInTheDocument();
  });

  it('hides actions when streaming', () => {
    render(<MessageItem message={mockAssistantMessage} {...defaultProps} isStreaming={true} />);
    
    expect(screen.queryByLabelText('Copy message')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Regenerate response')).not.toBeInTheDocument();
  });

  it('copies message content to clipboard when copy is clicked', () => {
    render(<MessageItem message={mockUserMessage} {...defaultProps} />);
    
    const copyButton = screen.getByLabelText('Copy message');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello, how are you?');
    expect(defaultProps.onCopy).toHaveBeenCalledTimes(1);
  });

  it('calls onRegenerate when regenerate button is clicked', () => {
    render(<MessageItem message={mockAssistantMessage} {...defaultProps} />);
    
    const regenerateButton = screen.getByLabelText('Regenerate response');
    fireEvent.click(regenerateButton);
    
    expect(defaultProps.onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('shows regenerate button only for assistant messages', () => {
    // User message should not have regenerate button
    const { rerender } = render(<MessageItem message={mockUserMessage} {...defaultProps} />);
    expect(screen.queryByLabelText('Regenerate response')).not.toBeInTheDocument();
    
    // Assistant message should have regenerate button
    rerender(<MessageItem message={mockAssistantMessage} {...defaultProps} />);
    expect(screen.getByLabelText('Regenerate response')).toBeInTheDocument();
  });

  it('renders streaming message with typewriter effect', () => {
    render(<MessageItem message={mockAssistantMessage} {...defaultProps} isStreaming={true} />);
    
    // Should not render markdown when streaming
    expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument();
    
    // Should render TypewriterText component (we can't easily test the actual typewriter effect in unit tests)
    expect(screen.getByText(/I am doing well/)).toBeInTheDocument();
  });

  it('preserves whitespace in user messages', () => {
    const messageWithWhitespace: Message = {
      ...mockUserMessage,
      content: 'Line 1\nLine 2\n  Indented line'
    };
    
    render(<MessageItem message={messageWithWhitespace} {...defaultProps} />);
    
    const messageContent = screen.getByText('Line 1\nLine 2\n  Indented line');
    expect(messageContent).toHaveClass('whitespace-pre-wrap');
  });
});