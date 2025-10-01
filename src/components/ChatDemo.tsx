import React, { useState, useEffect } from 'react';
import { ChatInterface } from './chat/ChatInterface';
import { Persona, Message } from '../../../shared';
import { usePersonaStore } from '../stores/personaStore';

export const ChatDemo: React.FC = () => {
  const { currentPersona } = usePersonaStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          const data = await response.json();
          setIsConnected(data.status === 'healthy');
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Connection check failed:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize with welcome message if no messages
  useEffect(() => {
    if (messages.length === 0 && currentPersona) {
      const welcomeMessage: Message = {
        id: 'welcome-msg',
        role: 'assistant',
        content: `Hello! I'm ${currentPersona.occupation} with expertise in ${currentPersona.expertise?.join(', ') || 'various areas'}. ${currentPersona.conversation_goal || 'How can I help you today?'}`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [currentPersona, messages.length]);

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    if (!isConnected) {
      // Show offline message
      const offlineResponse: Message = {
        id: `msg-${Date.now()}-offline`,
        role: 'assistant',
        content: 'I\'m currently offline. Please check your connection and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, offlineResponse]);
      return;
    }
    
    // Send real request to backend
    setIsStreaming(true);
    try {
      // Prepare messages array including the new user message
      const allMessages = [...messages, newMessage];
      
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: allMessages.slice(-10), // Send last 10 messages for context
          persona: currentPersona,
          model: 'qwen3:8b', // Default model, could be configurable
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 0.9,
          stream: false
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse: Message = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: data.content || data.response || 'I apologize, but I couldn\'t generate a response.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Chat request failed:', error);
      const errorResponse: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleRegenerateMessage = (messageId: string) => {
    console.log('Regenerate message:', messageId);
  };

  const handleCopyMessage = (messageId: string) => {
    console.log('Copy message:', messageId);
  };

  const handleExportSession = () => {
    console.log('Export session');
  };

  if (!currentPersona) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Persona Available</h3>
          <p className="text-gray-600 text-sm">
            Please configure a persona first to start chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <ChatInterface
          persona={currentPersona}
          messages={messages}
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          isConnected={isConnected}
          onRegenerateMessage={handleRegenerateMessage}
          onCopyMessage={handleCopyMessage}
          onExportSession={handleExportSession}
        />
      </div>
    </div>
  );
};