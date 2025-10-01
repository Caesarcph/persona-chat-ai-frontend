import React from 'react';
import { ConnectionStatusProps } from '../../types/chat';

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isStreaming,
  onReconnect
}) => {
  if (isConnected && !isStreaming) {
    return (
      <div className="flex items-center space-x-2 text-green-600 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Connected</span>
      </div>
    );
  }

  if (isConnected && isStreaming) {
    return (
      <div className="flex items-center space-x-2 text-blue-600 text-sm">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span>Streaming...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-red-600 text-sm">
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      <span>Disconnected</span>
      {onReconnect && (
        <button
          onClick={onReconnect}
          className="ml-2 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};