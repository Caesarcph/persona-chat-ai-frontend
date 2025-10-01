import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VirtualizedMessageList } from '../../chat/VirtualizedMessageList';
import { Message } from '../../../../../shared';

// Mock react-window
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => {
    // Render first few items for testing
    const items = [];
    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      items.push(
        <div key={i}>
          {children({
            index: i,
            style: {},
            data: itemData
          })}
        </div>
      );
    }
    return <div data-testid="virtualized-list">{items}</div>;
  }
}));

describe('VirtualizedMessageList', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date('2024-01-01T12:00:00Z')
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Hi there!',
      timestamp: new Date('2024-01-01T12:01:00Z')
    },
    {
      id: 'msg-3',
      role: 'user',
      content: 'How are you?',
      timestamp: new Date('2024-01-01T12:02:00Z')
    }
  ];

  const defaultProps = {
    messages: mockMessages,
    onCopyMessage: jest.fn(),
    onRegenerateMessage: jest.fn(),
    height: 400
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no messages', () => {
    render(<VirtualizedMessageList {...defaultProps} messages={[]} />);
    
    expect(screen.getByText('No messages yet. Start a conversation!')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  it('renders messages without virtualization for small lists', () => {
    const fewMessages = mockMessages.slice(0, 2);
    render(<VirtualizedMessageList {...defaultProps} messages={fewMessages} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    
    // Should not use virtualized list for small number of messages
    expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
  });

  it('uses virtualization for large message lists', () => {
    // Create a large list of messages (>50)
    const manyMessages: Message[] = Array.from({ length: 60 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
      timestamp: new Date(`2024-01-01T${12 + Math.floor(i / 60)}:${i % 60}:00Z`)
    }));

    render(<VirtualizedMessageList {...defaultProps} messages={manyMessages} />);
    
    // Should use virtualized list for large number of messages
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('highlights streaming message', () => {
    render(
      <VirtualizedMessageList 
        {...defaultProps} 
        streamingMessageId="msg-2"
      />
    );
    
    // The streaming message should be rendered (we can't easily test the streaming effect in unit tests)
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('passes correct props to message items', () => {
    render(<VirtualizedMessageList {...defaultProps} />);
    
    // Should render message content
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('handles empty message list gracefully', () => {
    render(<VirtualizedMessageList {...defaultProps} messages={[]} />);
    
    expect(screen.getByText('No messages yet. Start a conversation!')).toBeInTheDocument();
  });

  it('calculates item height based on content length', () => {
    const longMessage: Message = {
      id: 'long-msg',
      role: 'assistant',
      content: 'This is a very long message that should result in a taller item height because it contains much more content than a typical short message and will likely wrap to multiple lines when displayed in the chat interface.',
      timestamp: new Date()
    };

    render(<VirtualizedMessageList {...defaultProps} messages={[longMessage]} />);
    
    // Should render the long message
    expect(screen.getByText(/This is a very long message/)).toBeInTheDocument();
  });

  it('handles messages with different roles correctly', () => {
    render(<VirtualizedMessageList {...defaultProps} />);
    
    // Should render both user and assistant messages
    expect(screen.getByText('Hello')).toBeInTheDocument(); // user message
    expect(screen.getByText('Hi there!')).toBeInTheDocument(); // assistant message
    expect(screen.getByText('How are you?')).toBeInTheDocument(); // user message
  });
});