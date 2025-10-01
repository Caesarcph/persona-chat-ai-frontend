import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatInterfaceProps } from '../../types/chat';
import { VirtualizedMessageList } from './VirtualizedMessageList';
import { MessageInput } from './MessageInput';
import { ConnectionStatus } from './ConnectionStatus';

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  persona,
  messages,
  onSendMessage,
  isStreaming,
  isConnected,
  onRegenerateMessage,
  onCopyMessage,
  onExportSession,
  className = ''
}) => {
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | undefined>();

  // Update streaming message ID when streaming status changes
  useEffect(() => {
    if (isStreaming && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setStreamingMessageId(lastMessage.id);
      }
    } else {
      setStreamingMessageId(undefined);
    }
  }, [isStreaming, messages]);

  // Handle container resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 200; // Reserve space for input
        setContainerHeight(Math.max(400, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleCopyMessage = useCallback((messageId: string) => {
    onCopyMessage(messageId);
    // Could add toast notification here
  }, [onCopyMessage]);

  const handleRegenerateMessage = useCallback((messageId: string) => {
    onRegenerateMessage(messageId);
  }, [onRegenerateMessage]);

  const handleReconnect = useCallback(() => {
    // This would trigger a reconnection attempt
    // Implementation depends on the parent component's connection logic
    window.location.reload();
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {persona.occupation?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {persona.occupation || 'Persona'} Chat
            </h3>
            <p className="text-sm text-gray-500">
              {persona.tone} • {persona.response_style}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <ConnectionStatus 
            isConnected={isConnected}
            isStreaming={isStreaming}
            onReconnect={handleReconnect}
          />
          
          <button
            onClick={onExportSession}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Export session"
            aria-label="Export session"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <VirtualizedMessageList
        messages={messages}
        onCopyMessage={handleCopyMessage}
        onRegenerateMessage={handleRegenerateMessage}
        streamingMessageId={streamingMessageId}
        height={containerHeight - 160} // Subtract header and input heights
      />

      {/* Input Area */}
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={isStreaming || !isConnected}
        placeholder={
          !isConnected 
            ? "Disconnected - check your connection"
            : isStreaming 
              ? "Please wait for response..."
              : `Chat with ${persona.occupation || 'persona'}...`
        }
      />
    </div>
  );
};