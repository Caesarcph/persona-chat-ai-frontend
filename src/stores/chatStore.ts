/**
 * Chat store using Zustand for state management
 * Handles chat sessions, messages, and streaming
 */

import { create } from 'zustand';
import { Message } from '../../../shared';
import { Persona } from '../types/persona';
import { memoryCleanupManager } from '../utils/memoryCleanup';

interface ChatSession {
  id: string;
  name?: string;
  persona_id?: string;
  persona_snapshot?: Persona;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface StreamingState {
  isStreaming: boolean;
  streamingMessageId: string | null;
  currentStreamContent: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  reconnectAttempts: number;
  lastError: string | null;
}

interface ChatState {
  // Current session
  currentSession: ChatSession | null;
  messages: Message[];
  
  // Session management
  sessions: ChatSession[];
  
  // Streaming state
  streaming: StreamingState;
  
  // Loading states
  isLoading: boolean;
  isSendingMessage: boolean;
  error: string | null;
  
  // Actions - Session Management
  createSession: (persona: Persona, name?: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newName: string) => Promise<void>;
  clearCurrentSession: () => void;
  
  // Actions - Message Management
  sendMessage: (content: string, persona: Persona) => Promise<void>;
  regenerateMessage: (messageId: string, persona: Persona) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  copyMessage: (messageId: string) => void;
  clearMessages: () => void;
  
  // Actions - Session Export/Import
  exportSession: (sessionId: string, format: 'json' | 'markdown') => Promise<string>;
  importSession: (data: string, format: 'json' | 'markdown') => Promise<void>;
  
  // Actions - Streaming
  startStreaming: (messageId: string) => void;
  updateStreamContent: (content: string) => void;
  finishStreaming: () => void;
  setConnectionStatus: (status: StreamingState['connectionStatus']) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  
  // Actions - Session List
  loadSessions: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
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
  
  // Session Management
  createSession: async (persona, name) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona_id: persona.schema_version, // Use as temp ID
          name: name || `Chat with ${persona.occupation || 'AI'}`,
          persona_snapshot: persona,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }
      
      const session = await response.json();
      
      set({ 
        currentSession: session,
        messages: [],
        isLoading: false,
      });
      
      // Reload sessions list
      await get().loadSessions();
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create session',
        isLoading: false,
      });
    }
  },
  
  loadSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Load session details
      const sessionResponse = await fetch(`/api/sessions/${sessionId}`);
      if (!sessionResponse.ok) {
        throw new Error(`Failed to load session: ${sessionResponse.statusText}`);
      }
      const session = await sessionResponse.json();
      
      // Load session messages
      const messagesResponse = await fetch(`/api/sessions/${sessionId}/messages`);
      if (!messagesResponse.ok) {
        throw new Error(`Failed to load messages: ${messagesResponse.statusText}`);
      }
      const messagesData = await messagesResponse.json();
      
      // Register session with memory cleanup manager
      memoryCleanupManager.registerSession(sessionId, messagesData.messages || []);
      
      set({ 
        currentSession: session,
        messages: messagesData.messages || [],
        isLoading: false,
      });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load session',
        isLoading: false,
      });
    }
  },
  
  deleteSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }
      
      set((state) => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        messages: state.currentSession?.id === sessionId ? [] : state.messages,
        isLoading: false,
      }));
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete session',
        isLoading: false,
      });
    }
  },
  
  renameSession: async (sessionId, newName) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to rename session: ${response.statusText}`);
      }
      
      const updatedSession = await response.json();
      
      set((state) => ({
        sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s),
        currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession,
        isLoading: false,
      }));
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to rename session',
        isLoading: false,
      });
    }
  },
  
  clearCurrentSession: () => {
    const { currentSession } = get();
    
    // Unregister from memory cleanup if we have a current session
    if (currentSession) {
      memoryCleanupManager.unregisterSession(currentSession.id);
    }
    
    set({ 
      currentSession: null,
      messages: [],
      streaming: {
        isStreaming: false,
        streamingMessageId: null,
        currentStreamContent: '',
        connectionStatus: 'disconnected',
        reconnectAttempts: 0,
        lastError: null,
      },
    });
  },
  
  // Message Management
  sendMessage: async (content, persona) => {
    const { currentSession } = get();
    if (!currentSession) {
      set({ error: 'No active session' });
      return;
    }
    
    set({ isSendingMessage: true, error: null });
    
    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    set((state) => ({
      messages: [...state.messages, userMessage],
    }));
    
    try {
      // Create assistant message placeholder
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        persona_snapshot: persona,
      };
      
      set((state) => ({
        messages: [...state.messages, assistantMessage],
      }));
      
      // Start streaming
      get().startStreaming(assistantMessageId);
      
      // Send to API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...get().messages.slice(0, -1), userMessage], // Exclude the placeholder
          persona,
          stream: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }
      
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }
      
      get().setConnectionStatus('connected');
      let fullContent = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                get().finishStreaming();
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'done' && parsed.content) {
                  // Use the filtered content from the done message
                  fullContent = parsed.content;
                  get().updateStreamContent(fullContent);
                  get().finishStreaming();
                  break;
                } else if (parsed.content && parsed.type !== 'done') {
                  fullContent += parsed.content;
                  get().updateStreamContent(fullContent);
                }
                
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (parseError) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      // Update final message
      set((state) => {
        const updatedMessages = state.messages.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: fullContent }
            : msg
        );
        
        // Update memory cleanup manager with new messages
        if (state.currentSession) {
          memoryCleanupManager.updateSession(state.currentSession.id, [userMessage, { ...updatedMessages.find(m => m.id === assistantMessageId)! }]);
        }
        
        return {
          messages: updatedMessages,
          isSendingMessage: false,
        };
      });
      
    } catch (error) {
      get().finishStreaming();
      set((state) => ({ 
        error: error instanceof Error ? error.message : 'Failed to send message',
        isSendingMessage: false,
        streaming: {
          ...state.streaming,
          connectionStatus: 'error',
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    }
  },
  
  regenerateMessage: async (messageId, persona) => {
    const { messages } = get();
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') {
      set({ error: 'Invalid message for regeneration' });
      return;
    }
    
    // Find the previous user message
    const userMessages = messages.slice(0, messageIndex).filter(m => m.role === 'user');
    if (userMessages.length === 0) {
      set({ error: 'No user message found for regeneration' });
      return;
    }
    
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    // Remove the assistant message and regenerate
    set((state) => ({
      messages: state.messages.filter(m => m.id !== messageId),
    }));
    
    await get().sendMessage(lastUserMessage.content, persona);
  },
  
  deleteMessage: async (messageId) => {
    set((state) => ({
      messages: state.messages.filter(m => m.id !== messageId),
    }));
  },
  
  copyMessage: (messageId) => {
    const { messages } = get();
    const message = messages.find(m => m.id === messageId);
    
    if (message && navigator.clipboard) {
      navigator.clipboard.writeText(message.content).catch(error => {
        console.warn('Failed to copy message:', error);
      });
    }
  },
  
  clearMessages: () => {
    set({ messages: [] });
  },
  
  // Export/Import
  exportSession: async (sessionId, format) => {
    const { sessions, messages } = get();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (format === 'json') {
      const exportData = {
        version: '1.0',
        session,
        messages,
        exported_at: new Date().toISOString(),
      };
      return JSON.stringify(exportData, null, 2);
    } else {
      // Markdown format
      const lines = [
        `# Chat Session: ${session.name || 'Untitled'}`,
        ``,
        `**Created:** ${session.created_at}`,
        `**Messages:** ${messages.length}`,
        ``,
        `---`,
        ``,
      ];
      
      for (const message of messages) {
        lines.push(`## ${message.role === 'user' ? 'User' : 'Assistant'}`);
        lines.push('');
        lines.push(message.content);
        lines.push('');
        lines.push(`*${message.timestamp}*`);
        lines.push('');
        lines.push('---');
        lines.push('');
      }
      
      return lines.join('\n');
    }
  },
  
  importSession: async (data, format) => {
    set({ isLoading: true, error: null });
    
    try {
      let sessionData;
      
      if (format === 'json') {
        sessionData = JSON.parse(data);
        
        if (!sessionData.session || !sessionData.messages) {
          throw new Error('Invalid session data format');
        }
        
        set({
          currentSession: sessionData.session,
          messages: sessionData.messages,
          isLoading: false,
        });
      } else {
        throw new Error('Markdown import not yet implemented');
      }
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import session',
        isLoading: false,
      });
    }
  },
  
  // Streaming
  startStreaming: (messageId) => {
    set((state) => ({
      streaming: {
        ...state.streaming,
        isStreaming: true,
        streamingMessageId: messageId,
        currentStreamContent: '',
        connectionStatus: 'connecting',
      },
    }));
  },
  
  updateStreamContent: (content) => {
    const { streaming } = get();
    if (!streaming.streamingMessageId) return;
    
    set((state) => ({
      streaming: {
        ...state.streaming,
        currentStreamContent: content,
        connectionStatus: 'connected',
      },
      messages: state.messages.map(msg => 
        msg.id === streaming.streamingMessageId 
          ? { ...msg, content }
          : msg
      ),
    }));
  },
  
  finishStreaming: () => {
    set((state) => ({
      streaming: {
        ...state.streaming,
        isStreaming: false,
        streamingMessageId: null,
        currentStreamContent: '',
      },
    }));
  },
  
  setConnectionStatus: (status) => {
    set((state) => ({
      streaming: {
        ...state.streaming,
        connectionStatus: status,
      },
    }));
  },
  
  incrementReconnectAttempts: () => {
    set((state) => ({
      streaming: {
        ...state.streaming,
        reconnectAttempts: state.streaming.reconnectAttempts + 1,
      },
    }));
  },
  
  resetReconnectAttempts: () => {
    set((state) => ({
      streaming: {
        ...state.streaming,
        reconnectAttempts: 0,
      },
    }));
  },
  
  // Session List
  loadSessions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/sessions');
      
      if (!response.ok) {
        throw new Error(`Failed to load sessions: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      set({ 
        sessions: data.sessions || [],
        isLoading: false,
      });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load sessions',
        isLoading: false,
      });
    }
  },
  
  // Utility
  clearError: () => {
    set({ error: null });
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));

// Selectors for better performance
export const useCurrentSession = () => useChatStore((state) => state.currentSession);
export const useMessages = () => useChatStore((state) => state.messages);
export const useStreamingState = () => useChatStore((state) => state.streaming);
export const useChatSessions = () => useChatStore((state) => state.sessions);
export const useChatLoading = () => useChatStore((state) => ({
  isLoading: state.isLoading,
  isSendingMessage: state.isSendingMessage,
  error: state.error,
}));