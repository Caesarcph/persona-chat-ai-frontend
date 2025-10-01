import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { VirtualizedMessageListProps } from '../../types/chat';
import { MessageItem } from './MessageItem';
import { Message } from '../../../../shared';
import { useMemoryCleanup } from '../../utils/memoryCleanup';
import { usePerformanceMonitor } from '../../utils/performanceMonitor';

interface MessageRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: Message[];
    onCopyMessage: (messageId: string) => void;
    onRegenerateMessage: (messageId: string) => void;
    streamingMessageId?: string;
  };
}

const MessageRow: React.FC<MessageRowProps> = React.memo(({ index, style, data }) => {
  const { messages, onCopyMessage, onRegenerateMessage, streamingMessageId } = data;
  const message = messages[index];
  
  if (!message) return null;

  const isStreaming = streamingMessageId === message.id;

  return (
    <div style={style}>
      <div className="px-4 py-2">
        <MessageItem
          message={message}
          isStreaming={isStreaming}
          onCopy={() => onCopyMessage(message.id)}
          onRegenerate={() => onRegenerateMessage(message.id)}
          showActions={true}
        />
      </div>
    </div>
  );
});

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  onCopyMessage,
  onRegenerateMessage,
  streamingMessageId,
  height
}) => {
  const listRef = useRef<List>(null);
  const { recordMetric } = usePerformanceMonitor('VirtualizedMessageList');
  const { updateSession } = useMemoryCleanup();

  // Track performance metrics
  useEffect(() => {
    recordMetric('message_count', messages.length);
  }, [messages.length, recordMetric]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  // Scroll to bottom when streaming starts
  useEffect(() => {
    if (listRef.current && streamingMessageId) {
      const streamingIndex = messages.findIndex(m => m.id === streamingMessageId);
      if (streamingIndex !== -1) {
        listRef.current.scrollToItem(streamingIndex, 'end');
      }
    }
  }, [streamingMessageId, messages]);

  // Memoized callbacks to prevent unnecessary re-renders
  const memoizedOnCopyMessage = useCallback((messageId: string) => {
    onCopyMessage(messageId);
  }, [onCopyMessage]);

  const memoizedOnRegenerateMessage = useCallback((messageId: string) => {
    onRegenerateMessage(messageId);
  }, [onRegenerateMessage]);

  const itemData = useMemo(() => ({
    messages,
    onCopyMessage: memoizedOnCopyMessage,
    onRegenerateMessage: memoizedOnRegenerateMessage,
    streamingMessageId
  }), [messages, memoizedOnCopyMessage, memoizedOnRegenerateMessage, streamingMessageId]);

  // Update memory cleanup with current messages
  useEffect(() => {
    if (messages.length > 0) {
      const sessionId = 'current-chat'; // This would come from props in real implementation
      updateSession(sessionId, messages.slice(-10)); // Keep only last 10 messages in memory
    }
  }, [messages, updateSession]);

  // Fixed item height for simplicity (react-window requires a number, not a function)
  const itemHeight = 120;

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <p>No messages yet. Start a conversation!</p>
        </div>
      </div>
    );
  }

  // For small number of messages, don't use virtualization
  if (messages.length < 50) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              isStreaming={streamingMessageId === message.id}
              onCopy={() => onCopyMessage(message.id)}
              onRegenerate={() => onRegenerateMessage(message.id)}
              showActions={true}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <List
        ref={listRef}
        height={height}
        width="100%"
        itemCount={messages.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5}
      >
        {MessageRow}
      </List>
    </div>
  );
};