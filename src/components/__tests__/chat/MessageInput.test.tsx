import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MessageInput } from '../../chat/MessageInput';

describe('MessageInput', () => {
  const defaultProps = {
    onSendMessage: jest.fn(),
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders textarea and send button', () => {
    render(<MessageInput {...defaultProps} />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('uses custom placeholder when provided', () => {
    render(<MessageInput {...defaultProps} placeholder="Custom placeholder" />);
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('uses default placeholder when not provided', () => {
    render(<MessageInput {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
  });

  it('calls onSendMessage when form is submitted with text', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button');
    
    await user.type(textarea, 'Hello world');
    await user.click(sendButton);
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello world');
  });

  it('clears input after sending message', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    
    await user.type(textarea, 'Hello world');
    fireEvent.submit(textarea.closest('form')!);
    
    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  it('sends message on Enter key press', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    
    await user.type(textarea, 'Hello world');
    await user.keyboard('{Enter}');
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello world');
  });

  it('does not send message on Shift+Enter', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    
    await user.type(textarea, 'Hello world');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled();
  });

  it('disables input and button when disabled prop is true', () => {
    render(<MessageInput {...defaultProps} disabled={true} />);
    
    const textarea = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button');
    
    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('shows disabled message when disabled', () => {
    render(<MessageInput {...defaultProps} disabled={true} />);
    
    expect(screen.getByText('Please wait for the response...')).toBeInTheDocument();
  });

  it('does not send empty or whitespace-only messages', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    
    // Try sending empty message
    await user.click(screen.getByRole('button'));
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled();
    
    // Try sending whitespace-only message
    await user.type(textarea, '   ');
    await user.click(screen.getByRole('button'));
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled();
  });

  it('trims whitespace from messages', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    
    await user.type(textarea, '  Hello world  ');
    await user.click(screen.getByRole('button'));
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello world');
  });

  it('disables send button when input is empty', () => {
    render(<MessageInput {...defaultProps} />);
    
    const sendButton = screen.getByRole('button');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has text', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button');
    
    await user.type(textarea, 'Hello');
    
    expect(sendButton).not.toBeDisabled();
  });
});