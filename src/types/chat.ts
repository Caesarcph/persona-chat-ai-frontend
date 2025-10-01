/**
 * Chat interface specific types
 */

import { Message, Persona } from '../../../shared';

export interface ChatInterfaceProps {
  persona: Persona;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isStreaming: boolean;
  isConnected: boolean;
  onRegenerateMessage: (messageId: string) => void;
  onCopyMessage: (messageId: string) => void;
  onExportSession: () => void;
  className?: string;
}

export interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  showActions?: boolean;
}

export interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export interface ConnectionStatusProps {
  isConnected: boolean;
  isStreaming: boolean;
  onReconnect?: () => void;
}

export interface VirtualizedMessageListProps {
  messages: Message[];
  onCopyMessage: (messageId: string) => void;
  onRegenerateMessage: (messageId: string) => void;
  streamingMessageId?: string;
  height: number;
}

export interface MessageActionsProps {
  messageId: string;
  onCopy: () => void;
  onRegenerate: () => void;
  canRegenerate: boolean;
}

export interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}