import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConnectionStatus } from '../../chat/ConnectionStatus';

describe('ConnectionStatus', () => {
  it('shows connected status when connected and not streaming', () => {
    render(<ConnectionStatus isConnected={true} isStreaming={false} />);
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toHaveClass('text-green-600');
  });

  it('shows streaming status when connected and streaming', () => {
    render(<ConnectionStatus isConnected={true} isStreaming={true} />);
    
    expect(screen.getByText('Streaming...')).toBeInTheDocument();
    expect(screen.getByText('Streaming...')).toHaveClass('text-blue-600');
  });

  it('shows disconnected status when not connected', () => {
    render(<ConnectionStatus isConnected={false} isStreaming={false} />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toHaveClass('text-red-600');
  });

  it('shows reconnect button when disconnected and onReconnect is provided', () => {
    const mockReconnect = jest.fn();
    render(
      <ConnectionStatus 
        isConnected={false} 
        isStreaming={false} 
        onReconnect={mockReconnect}
      />
    );
    
    const reconnectButton = screen.getByText('Reconnect');
    expect(reconnectButton).toBeInTheDocument();
    
    fireEvent.click(reconnectButton);
    expect(mockReconnect).toHaveBeenCalledTimes(1);
  });

  it('does not show reconnect button when onReconnect is not provided', () => {
    render(<ConnectionStatus isConnected={false} isStreaming={false} />);
    
    expect(screen.queryByText('Reconnect')).not.toBeInTheDocument();
  });
});