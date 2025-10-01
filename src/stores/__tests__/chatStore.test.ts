/**
 * Tests for chat store
 */

import { renderHook, act } from '@testing-library/react';
import { useChatStore } from '../chatStore';
import { Persona } from '../../types/persona';
import { Message } from '../../../../../shared';

// Mock fetch
global.fetch = jest.fn();

const mockPersona: Persona = {
  schema_version: '1.0',
  age: 30,
  gender: 'Female',
  pronouns: 'she/her',
  nationality: 'Canadian',
  region: 'North America',
  education: 'Master\'s Degree',
  occupation: 'Data Scientist',
  industry: 'Healthcare',
  seniority: 'Senior',
  politeness_directness: 70,
  expertise: ['Python', 'Machine Learning'],
  tools: ['Jupyter', 'TensorFlow'],
  knowledge_cutoff: '2024-01',
  response_style: 'academic',
  tone: 'formal',
  language_preference: 'english',
  detail_depth: 'detailed',
  conversation_goal: 'Provide data analysis insights',
  banned_topics: ['personal medical advice'],
};

const mockMessage: Message = {
  id: 'msg-1',
  role: 'user',
  content: 'Hello, how are you?',
  timestamp: new Date('2024-01-01T10:00:00Z'),
};

const mockSession = {
  id: 'session-1',
  name: 'Test Session',
  persona_id: 'persona-1',
  persona_snapshot: mockPersona,
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
  message_count: 2,
};

describe('chatStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store to initial state
    useChatStore.setState({
      currentSession: null,
      messages: [],
      sessions: [],
      streaming: {
        isStreaming: false,
        streamingMessageId: null,
        currentStreamContent: '',
        connectionStatus: 'disconnected',
        reconnectAttempts: 0,
        lastError: null,
      },
      isLoading: false,
      isSendingMessage: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useChatStore());
      
      expect(result.current.currentSession).toBeNull();
      expect(result.current.messages).toEqual([]);
      expect(result.current.sessions).toEqual([]);
      expect(result.current.streaming.isStreaming).toBe(false);
      expect(result.current.streaming.connectionStatus).toBe('disconnected');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSendingMessage).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('session management', () => {
    it('should create session successfully', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sessions: [mockSession] }),
        });
      
      const { result } = renderHook(() => useChatStore());
      
      await act(async () => {
        await result.current.createSession(mockPersona, 'Test Session');
      });
      
      expect(fetch).toHaveBeenCalledWith('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona_id: mockPersona.schema_version,
          name: 'Test Session',
          persona_snapshot: mockPersona,
        }),
      });
      
      expect(result.current.currentSession).toEqual(mockSession);
      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle session creation errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });
      
      const { result } = renderHook(() => useChatStore());
      
      await act(async () => {
        await result.current.createSession(mockPersona);
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to create session: Internal Server Error');
    });

    it('should load session successfully', async () => {
      const mockMessages = [mockMessage];
      
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messages: mockMessages }),
        });
      
      const { result } = renderHook(() => useChatStore());
      
      await act(async () => {
        await result.current.loadSession('session-1');
      });
      
      expect(fetch).toHaveBeenCalledWith('/api/sessions/session-1');
      expect(fetch).toHaveBeenCalledWith('/api/sessions/session-1/messages');
      expect(result.current.currentSession).toEqual(mockSession);
      expect(result.current.messages).toEqual(mockMessages);
      expect(result.current.isLoading).toBe(false);
    });

    it('should delete session successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });
      
      const { result } = renderHook(() => useChatStore());
      
      // Set initial state with session
      act(() => {
        useChatStore.setState({
          sessions: [mockSession],
          currentSession: mockSession,
          messages: [mockMessage],
        });
      });
      
      await act(async () => {
        await result.current.deleteSession('session-1');
      });
      
      expect(fetch).toHaveBeenCalledWith('/api/sessions/session-1', {
        method: 'DELETE',
      });
      
      expect(result.current.sessions).toEqual([]);
      expect(result.current.currentSession).toBeNull();
      expect(result.current.messages).toEqual([]);
    });

    it('should clear current session', () => {
      const { result } = renderHook(() => useChatStore());
      
      // Set initial state
      act(() => {
        useChatStore.setState({
          currentSession: mockSession,
          messages: [mockMessage],
          streaming: {
            isStreaming: true,
            streamingMessageId: 'msg-1',
            currentStreamContent: 'test',
            connectionStatus: 'connected',
            reconnectAttempts: 2,
            lastError: 'test error',
          },
        });
      });
      
      act(() => {
        result.current.clearCurrentSession();
      });
      
      expect(result.current.currentSession).toBeNull();
      expect(result.current.messages).toEqual([]);
      expect(result.current.streaming.isStreaming).toBe(false);
      expect(result.current.streaming.streamingMessageId).toBeNull();
      expect(result.current.streaming.connectionStatus).toBe('disconnected');
    });
  });

  describe('message management', () => {
    it('should copy message to clipboard', () => {
      const mockClipboard = {
        writeText: jest.fn().mockResolvedValue(undefined),
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        configurable: true,
      });
      
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        useChatStore.setState({ messages: [mockMessage] });
      });
      
      act(() => {
        result.current.copyMessage('msg-1');
      });
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('Hello, how are you?');
    });

    it('should delete message', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        useChatStore.setState({ messages: [mockMessage] });
      });
      
      act(() => {
        result.current.deleteMessage('msg-1');
      });
      
      expect(result.current.messages).toEqual([]);
    });

    it('should clear all messages', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        useChatStore.setState({ messages: [mockMessage] });
      });
      
      act(() => {
        result.current.clearMessages();
      });
      
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('streaming', () => {
    it('should start streaming', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.startStreaming('msg-1');
      });
      
      expect(result.current.streaming.isStreaming).toBe(true);
      expect(result.current.streaming.streamingMessageId).toBe('msg-1');
      expect(result.current.streaming.currentStreamContent).toBe('');
      expect(result.current.streaming.connectionStatus).toBe('connecting');
    });

    it('should update stream content', () => {
      const { result } = renderHook(() => useChatStore());
      
      // Start streaming first
      act(() => {
        result.current.startStreaming('msg-1');
      });
      
      // Add a message to update
      act(() => {
        useChatStore.setState({
          messages: [{
            id: 'msg-1',
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          }],
        });
      });
      
      act(() => {
        result.current.updateStreamContent('Hello world');
      });
      
      expect(result.current.streaming.currentStreamContent).toBe('Hello world');
      expect(result.current.streaming.connectionStatus).toBe('connected');
      expect(result.current.messages[0].content).toBe('Hello world');
    });

    it('should finish streaming', () => {
      const { result } = renderHook(() => useChatStore());
      
      // Start streaming first
      act(() => {
        result.current.startStreaming('msg-1');
      });
      
      act(() => {
        result.current.finishStreaming();
      });
      
      expect(result.current.streaming.isStreaming).toBe(false);
      expect(result.current.streaming.streamingMessageId).toBeNull();
      expect(result.current.streaming.currentStreamContent).toBe('');
    });

    it('should set connection status', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.setConnectionStatus('error');
      });
      
      expect(result.current.streaming.connectionStatus).toBe('error');
    });

    it('should handle reconnect attempts', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.incrementReconnectAttempts();
      });
      
      expect(result.current.streaming.reconnectAttempts).toBe(1);
      
      act(() => {
        result.current.incrementReconnectAttempts();
      });
      
      expect(result.current.streaming.reconnectAttempts).toBe(2);
      
      act(() => {
        result.current.resetReconnectAttempts();
      });
      
      expect(result.current.streaming.reconnectAttempts).toBe(0);
    });
  });

  describe('export/import', () => {
    it('should export session as JSON', async () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        useChatStore.setState({
          sessions: [mockSession],
          messages: [mockMessage],
        });
      });
      
      const exported = await result.current.exportSession('session-1', 'json');
      const parsed = JSON.parse(exported);
      
      expect(parsed.version).toBe('1.0');
      expect(parsed.session).toEqual(mockSession);
      expect(parsed.messages).toEqual([mockMessage]);
      expect(parsed.exported_at).toBeDefined();
    });

    it('should export session as markdown', async () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        useChatStore.setState({
          sessions: [mockSession],
          messages: [mockMessage],
        });
      });
      
      const exported = await result.current.exportSession('session-1', 'markdown');
      
      expect(exported).toContain('# Chat Session: Test Session');
      expect(exported).toContain('## User');
      expect(exported).toContain('Hello, how are you?');
    });

    it('should import session from JSON', async () => {
      const { result } = renderHook(() => useChatStore());
      
      const importData = {
        session: mockSession,
        messages: [mockMessage],
      };
      
      await act(async () => {
        await result.current.importSession(JSON.stringify(importData), 'json');
      });
      
      expect(result.current.currentSession).toEqual(mockSession);
      expect(result.current.messages).toEqual([mockMessage]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle import errors', async () => {
      const { result } = renderHook(() => useChatStore());
      
      await act(async () => {
        await result.current.importSession('invalid json', 'json');
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toContain('Failed to import session');
    });
  });

  describe('utility functions', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        useChatStore.setState({ error: 'Test error' });
      });
      
      expect(result.current.error).toBe('Test error');
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });
  });
});