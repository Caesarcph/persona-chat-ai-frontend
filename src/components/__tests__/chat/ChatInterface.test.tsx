import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInterface } from '../../chat/ChatInterface';
import { Persona, Message } from '../../../../../shared';

// Mock child components
jest.mock('../../chat/VirtualizedMessageList', () => ({
  VirtualizedMessageList: ({ messages, onCopyMessage, onRegenerateMessage }: any) => (
    <div data-testid="message-list">
      {messages.map((msg: Message) => (
        <div key={msg.id} data-testid={`message-${msg.id}`}>
          {msg.content}
          <button onClick={() => onCopyMessage(msg.id)}>Copy</button>
          <button onClick={() => onRegenerateMessage(msg.id)}>Regenerate</button>
        </div>
      ))}
    </div>
  )
}));

jest.mock('../../chat/MessageInput', () => ({
  MessageInput: ({ onSendMessage, disabled, placeholder }: any) => (
    <div data-testid="message-input">
      <input
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value === 'test-send') {
            onSendMessage('test message');
          }
        }}
      />
    </div>
  )
}));

jest.mock('../../chat/ConnectionStatus', () => ({
  ConnectionStatus: ({ isConnected, isStreaming, onReconnect }: any) => (
    <div data-testid="connection-status">
      Status: {isConnected ? 'connected' : 'disconnected'} 
      {isStreaming && ' (streaming)'}
      {onReconnect && <button onClick={onReconnect}>Reconnect</button>}
    </div>
  )
}));

describe('ChatInterface', () => {
  const mockPersona: Persona = {
    schema_version: '1.0',
    age: 30,
    gender: 'non-binary',
    pronouns: 'they/them',
    nationality: 'American',
    region: 'West Coast',
    education: 'PhD Computer Science',
    occupation: 'Software Engineer',
    industry: 'Technology',
    seniority: 'Senior',
    income_range: '$100k-150k',
    mbti: 'INTJ',
    big5: {
      openness: 85,
      conscientiousness: 75,
      extraversion: 40,
      agreeableness: 70,
      neuroticism: 30
    },
    enneagram: '5w4',
    risk_preference: 'medium',
    decision_style: 'analytical',
    humor: 'dry',
    politeness_directness: 60,
    expertise: ['Machine Learning', 'Web Development'],
    tools: ['Python', 'JavaScript', 'React'],
    certifications: ['AWS Solutions Architect'],
    knowledge_cutoff: '2024-01',
    information_sources: ['Technical documentation', 'Research papers'],
    response_style: 'practical',
    tone: 'casual',
    language_preference: 'english',
    detail_depth: 'moderate',
    structure_preference: ['bullet_points', 'examples'],
    conversation_goal: 'Help with technical questions',
    time_pressure: 'medium',
    budget_constraints: 'moderate',
    compliance_requirements: ['GDPR'],
    cultural_considerations: ['inclusive language'],
    banned_topics: ['personal finances'],
    sensitive_handling: 'moderate',
    disclaimers: ['Not professional advice']
  };

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
    }
  ];

  const defaultProps = {
    persona: mockPersona,
    messages: mockMessages,
    onSendMessage: jest.fn(),
    isStreaming: false,
    isConnected: true,
    onRegenerateMessage: jest.fn(),
    onCopyMessage: jest.fn(),
    onExportSession: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 100,
      left: 0,
      bottom: 600,
      right: 800,
      width: 800,
      height: 600,
      x: 0,
      y: 100,
      toJSON: () => ({})
    }));
  });

  it('renders chat interface with all components', () => {
    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });

  it('displays persona information in header', () => {
    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByText('Software Engineer Chat')).toBeInTheDocument();
    expect(screen.getByText('casual • practical')).toBeInTheDocument();
  });

  it('shows connection status', () => {
    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByText(/Status: connected/)).toBeInTheDocument();
  });

  it('shows streaming status when streaming', () => {
    render(<ChatInterface {...defaultProps} isStreaming={true} />);
    
    expect(screen.getByText(/Status: connected \(streaming\)/)).toBeInTheDocument();
  });

  it('shows disconnected status when not connected', () => {
    render(<ChatInterface {...defaultProps} isConnected={false} />);
    
    expect(screen.getByText(/Status: disconnected/)).toBeInTheDocument();
  });

  it('calls onSendMessage when message is sent', () => {
    render(<ChatInterface {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test-send' } });
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('test message');
  });

  it('calls onCopyMessage when copy button is clicked', () => {
    render(<ChatInterface {...defaultProps} />);
    
    const copyButtons = screen.getAllByText('Copy');
    fireEvent.click(copyButtons[0]);
    
    expect(defaultProps.onCopyMessage).toHaveBeenCalledWith('msg-1');
  });

  it('calls onRegenerateMessage when regenerate button is clicked', () => {
    render(<ChatInterface {...defaultProps} />);
    
    const regenerateButtons = screen.getAllByText('Regenerate');
    fireEvent.click(regenerateButtons[0]);
    
    expect(defaultProps.onRegenerateMessage).toHaveBeenCalledWith('msg-1');
  });

  it('calls onExportSession when export button is clicked', () => {
    render(<ChatInterface {...defaultProps} />);
    
    const exportButton = screen.getByLabelText('Export session');
    fireEvent.click(exportButton);
    
    expect(defaultProps.onExportSession).toHaveBeenCalledTimes(1);
  });

  it('disables input when streaming', () => {
    render(<ChatInterface {...defaultProps} isStreaming={true} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('disables input when disconnected', () => {
    render(<ChatInterface {...defaultProps} isConnected={false} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('shows appropriate placeholder when disconnected', () => {
    render(<ChatInterface {...defaultProps} isConnected={false} />);
    
    expect(screen.getByPlaceholderText('Disconnected - check your connection')).toBeInTheDocument();
  });

  it('shows appropriate placeholder when streaming', () => {
    render(<ChatInterface {...defaultProps} isStreaming={true} />);
    
    expect(screen.getByPlaceholderText('Please wait for response...')).toBeInTheDocument();
  });

  it('shows normal placeholder when connected and not streaming', () => {
    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Chat with Software Engineer...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ChatInterface {...defaultProps} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles window resize for container height', async () => {
    render(<ChatInterface {...defaultProps} />);
    
    // Trigger resize event
    fireEvent(window, new Event('resize'));
    
    // Should not throw errors
    await waitFor(() => {
      expect(screen.getByTestId('message-list')).toBeInTheDocument();
    });
  });

  it('shows persona avatar initial in header', () => {
    render(<ChatInterface {...defaultProps} />);
    
    // Should show first letter of occupation
    expect(screen.getByText('S')).toBeInTheDocument(); // Software Engineer
  });

  it('falls back to P when no occupation', () => {
    const personaWithoutOccupation = { ...mockPersona, occupation: '' };
    render(<ChatInterface {...defaultProps} persona={personaWithoutOccupation} />);
    
    expect(screen.getByText('P')).toBeInTheDocument(); // Persona fallback
  });
});