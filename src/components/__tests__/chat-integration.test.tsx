import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInterface } from '../chat/ChatInterface';
import { Persona, Message } from '../../../../shared';

// Simple integration test to verify chat components work
describe('Chat Integration', () => {
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
    politeness_directness: 60,
    expertise: ['Machine Learning'],
    tools: ['Python'],
    knowledge_cutoff: '2024-01',
    response_style: 'practical',
    tone: 'casual',
    language_preference: 'english',
    detail_depth: 'moderate',
    conversation_goal: 'Help with technical questions',
    banned_topics: []
  };

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date('2024-01-01T12:00:00Z')
    }
  ];

  it('renders ChatInterface without crashing', () => {
    const props = {
      persona: mockPersona,
      messages: mockMessages,
      onSendMessage: jest.fn(),
      isStreaming: false,
      isConnected: true,
      onRegenerateMessage: jest.fn(),
      onCopyMessage: jest.fn(),
      onExportSession: jest.fn()
    };

    render(<ChatInterface {...props} />);
    
    // Should render without throwing
    expect(screen.getByText('Software Engineer Chat')).toBeInTheDocument();
  });
});