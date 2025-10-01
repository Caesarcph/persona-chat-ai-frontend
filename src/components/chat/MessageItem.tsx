import React from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageItemProps } from '../../types/chat';
import { MessageActions } from './MessageActions';
import { TypewriterText } from './TypewriterText';

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming = false,
  onCopy,
  onRegenerate,
  showActions = true
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    onCopy();
  };

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isUser ? 'bg-blue-500' : 'bg-gray-500'
          }`}>
            {isUser ? 'U' : 'A'}
          </div>
          
          {/* Message Content */}
          <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-4 py-2 rounded-lg ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              {isUser ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  {isStreaming ? (
                    <TypewriterText text={message.content} speed={20} />
                  ) : (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  )}
                </div>
              )}
            </div>
            
            {/* Timestamp */}
            <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
            
            {/* Actions */}
            {showActions && !isStreaming && (
              <div className={`mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
                <MessageActions
                  messageId={message.id}
                  onCopy={handleCopy}
                  onRegenerate={onRegenerate}
                  canRegenerate={isAssistant}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};