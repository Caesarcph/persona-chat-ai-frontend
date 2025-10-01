import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { VirtualizedMessageList } from '../VirtualizedMessageList';
import { Message } from '../../../../../shared';
import { performanceMonitor } from '../../../utils/performanceMonitor';

// Mock react-window
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: Math.min(itemCount, 10) }).map((_, index) => 
        children({ index, style: {}, data: itemData })
      )}
    </div>
  )
}));

// Helper function to generate test messages
const generateMessages = (count: number): Message[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `msg-${index}`,
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `Test message ${index}. This is a longer message to simulate real conversation content that might contain multiple sentences and various formatting.`,
    timestamp: new Date(Date.now() - (count - index) * 1000)
  }));
};

describe('VirtualizedMessageList Performance Tests', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    performanceMonitor.clear();
  });

  describe('Large Conversation Handling', () => {
    test('should handle 100 messages efficiently', async () => {
      const messages = generateMessages(100);
      const mockOnCopy = jest.fn();
      const mockOnRegenerate = jest.fn();

      const startTime = performance.now();

      await act(async () => {
        render(
          <VirtualizedMessageList
            messages={messages}
            onCopyMessage={mockOnCopy}
            onRegenerateMessage={mockOnRegenerate}
            height={600}
          />
        );
      });

      const renderTime = performance.now() - startTime;

      // Should render within reasonable time (less than 100ms for 100 messages)
      expect(renderTime).toBeLessThan(100);

      // Should use virtualization for large lists
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });

    test('should handle 1000 messages efficiently', async () => {
      const messages = generateMessages(1000);
      const mockOnCopy = jest.fn();
      const mockOnRegenerate = jest.fn();

      const startTime = performance.now();

      await act(async () => {
        render(
          <VirtualizedMessageList
            messages={messages}
            onCopyMessage={mockOnCopy}
            onRegenerateMessage={mockOnRegenerate}
            height={600}
          />
        );
      });

      const renderTime = performance.now() - startTime;

      // Should still render efficiently even with 1000 messages
      expect(renderTime).toBeLessThan(200);

      // Verify virtualization is being used
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });

    test('should not use virtualization for small lists', async () => {
      const messages = generateMessages(10);
      const mockOnCopy = jest.fn();
      const mockOnRegenerate = jest.fn();

      await act(async () => {
        render(
          <VirtualizedMessageList
            messages={messages}
            onCopyMessage={mockOnCopy}
            onRegenerateMessage={mockOnRegenerate}
            height={600}
          />
        );
      });

      // Should not use virtualization for small lists
      expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    test('should track performance metrics', async () => {
      const messages = generateMessages(50);
      const mockOnCopy = jest.fn();
      const mockOnRegenerate = jest.fn();

      await act(async () => {
        render(
          <VirtualizedMessageList
            messages={messages}
            onCopyMessage={mockOnCopy}
            onRegenerateMessage={mockOnRegenerate}
            height={600}
          />
        );
      });

      // Check that performance metrics were recorded
      const metrics = performanceMonitor.getMetrics('render');
      expect(metrics.length).toBeGreaterThan(0);

      const messageCountMetrics = metrics.filter(m => m.name.includes('message_count'));
      expect(messageCountMetrics.length).toBeGreaterThan(0);
    });

    test('should handle rapid message updates without memory leaks', async () => {
      const mockOnCopy = jest.fn();
      const mockOnRegenerate = jest.fn();

      let messages = generateMessages(10);
      const { rerender } = render(
        <VirtualizedMessageList
          messages={messages}
          onCopyMessage={mockOnCopy}
          onRegenerateMessage={mockOnRegenerate}
          height={600}
        />
      );

      // Simulate rapid message updates
      for (let i = 0; i < 10; i++) {
        messages = [...messages, ...generateMessages(5)];
        
        await act(async () => {
          rerender(
            <VirtualizedMessageList
              messages={messages}
              onCopyMessage={mockOnCopy}
              onRegenerateMessage={mockOnRegenerate}
              height={600}
            />
          );
        });
      }

      // Should handle rapid updates without crashing
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });
  });

  describe('Streaming Performance', () => {
    test('should handle streaming messages efficiently', async () => {
      const messages = generateMessages(50);
      const streamingMessageId = messages[messages.length - 1].id;
      const mockOnCopy = jest.fn();
      const mockOnRegenerate = jest.fn();

      const startTime = performance.now();

      await act(async () => {
        render(
          <VirtualizedMessageList
            messages={messages}
            onCopyMessage={mockOnCopy}
            onRegenerateMessage={mockOnRegenerate}
            streamingMessageId={streamingMessageId}
            height={600}
          />
        );
      });

      const renderTime = performance.now() - startTime;

      // Should render streaming messages efficiently
      expect(renderTime).toBeLessThan(50);
    });

    test('should update streaming message without full re-render', async () => {
      const messages = generateMessages(20);
      const streamingMessageId = messages[messages.length - 1].id;
      const mockOnCopy = jest.fn();
      const mockOnRegenerate = jest.fn();

      const { rerender } = render(
        <VirtualizedMessageList
          messages={messages}
          onCopyMessage={mockOnCopy}
          onRegenerateMessage={mockOnRegenerate}
          streamingMessageId={streamingMessageId}
          height={600}
        />
      );

      const initialMetrics = performanceMonitor.getMetrics('render').length;

      // Update streaming message content
      const updatedMessages = [...messages];
      updatedMessages[updatedMessages.length - 1] = {
        ...updatedMessages[updatedMessages.length - 1],
        content: 'Updated streaming content...'
      };

      await act(async () => {
        rerender(
          <VirtualizedMessageList
            messages={updatedMessages}
            onCopyMessage={mockOnCopy}
            onRegenerateMessage={mockOnRegenerate}
            streamingMessageId={streamingMessageId}
            height={600}
          />
        );
      });

      // Should not cause excessive re-renders
      const finalMetrics = performanceMonitor.getMetrics('render').length;
      expect(finalMetrics - initialMetrics).toBeLessThan(5);
    });
  });

  describe('Callback Optimization', () => {
    test('should memoize callbacks to prevent unnecessary re-renders', async () => {
      const messages = generateMessages(30);
      const mockOnCopy = jest.fn();
      const mockOnRegenerate = jest.fn();

      const { rerender } = render(
        <VirtualizedMessageList
          messages={messages}
          onCopyMessage={mockOnCopy}
          onRegenerateMessage={mockOnRegenerate}
          height={600}
        />
      );

      const initialRenderCount = performanceMonitor.getComponentData('VirtualizedMessageList')[0]?.renderCount || 0;

      // Re-render with same props
      await act(async () => {
        rerender(
          <VirtualizedMessageList
            messages={messages}
            onCopyMessage={mockOnCopy}
            onRegenerateMessage={mockOnRegenerate}
            height={600}
          />
        );
      });

      const finalRenderCount = performanceMonitor.getComponentData('VirtualizedMessageList')[0]?.renderCount || 0;

      // Should not cause unnecessary re-renders when props haven't changed
      expect(finalRenderCount - initialRenderCount).toBeLessThanOrEqual(1);
    });
  });
});