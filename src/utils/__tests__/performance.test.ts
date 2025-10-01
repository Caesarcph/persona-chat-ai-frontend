/**
 * Performance tests for large conversation handling and optimization features
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { performanceMonitor } from '../performanceMonitor';
import { memoryCleanupManager } from '../memoryCleanup';
import { Message } from '../../../../shared';

// Mock data generators
const generateMessage = (id: string, role: 'user' | 'assistant', content: string): Message => ({
  id,
  role,
  content,
  timestamp: new Date(),
});

const generateLargeConversation = (messageCount: number): Message[] => {
  const messages: Message[] = [];
  for (let i = 0; i < messageCount; i++) {
    const isUser = i % 2 === 0;
    messages.push(generateMessage(
      `msg-${i}`,
      isUser ? 'user' : 'assistant',
      `This is message ${i + 1} with some content that simulates a real conversation. `.repeat(5)
    ));
  }
  return messages;
};

describe('Performance Optimizations', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    memoryCleanupManager.clearAll();
  });

  describe('Memory Cleanup Manager', () => {
    it('should limit the number of sessions', () => {
      const maxSessions = 5;
      memoryCleanupManager.updateConfig({ maxSessions });

      // Register more sessions than the limit
      for (let i = 0; i < 10; i++) {
        memoryCleanupManager.registerSession(`session-${i}`, generateLargeConversation(10));
      }

      // Force cleanup
      const cleanedCount = memoryCleanupManager.cleanupOldSessions();
      const stats = memoryCleanupManager.getMemoryStats();

      expect(stats.totalSessions).toBeLessThanOrEqual(maxSessions);
      expect(cleanedCount).toBeGreaterThan(0);
    });

    it('should limit messages per session', () => {
      const maxMessages = 100;
      memoryCleanupManager.updateConfig({ maxMessagesPerSession: maxMessages });

      const sessionId = 'test-session';
      const largeConversation = generateLargeConversation(200);
      
      memoryCleanupManager.registerSession(sessionId, largeConversation);
      
      const stats = memoryCleanupManager.getSessionStats(sessionId);
      expect(stats?.messageCount).toBeLessThanOrEqual(maxMessages);
    });

    it('should cleanup old sessions based on age', async () => {
      const maxAge = 100; // 100ms for testing
      memoryCleanupManager.updateConfig({ maxAge });

      memoryCleanupManager.registerSession('old-session', generateLargeConversation(10));
      
      // Wait for session to age
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const cleanedCount = memoryCleanupManager.cleanupOldSessions();
      expect(cleanedCount).toBe(1);
      
      const stats = memoryCleanupManager.getMemoryStats();
      expect(stats.totalSessions).toBe(0);
    });

    it('should provide accurate memory statistics', () => {
      const sessions = ['session-1', 'session-2', 'session-3'];
      const messagesPerSession = [10, 20, 30];

      sessions.forEach((sessionId, index) => {
        memoryCleanupManager.registerSession(
          sessionId, 
          generateLargeConversation(messagesPerSession[index])
        );
      });

      const stats = memoryCleanupManager.getMemoryStats();
      expect(stats.totalSessions).toBe(3);
      expect(stats.totalMessages).toBe(60); // 10 + 20 + 30
    });
  });

  describe('Performance Monitor', () => {
    it('should track component render times', () => {
      const componentName = 'TestComponent';
      
      performanceMonitor.startRenderTimer(componentName);
      
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Busy wait for 10ms
      }
      
      const renderTime = performanceMonitor.endRenderTimer(componentName);
      
      expect(renderTime).toBeGreaterThan(0);
      
      const componentData = performanceMonitor.getComponentData(componentName);
      expect(componentData).toHaveLength(1);
      expect(componentData[0].renderCount).toBe(1);
      expect(componentData[0].averageRenderTime).toBeGreaterThan(0);
    });

    it('should calculate average render times correctly', () => {
      const componentName = 'TestComponent';
      const renderTimes: number[] = [];

      // Simulate multiple renders
      for (let i = 0; i < 5; i++) {
        performanceMonitor.startRenderTimer(componentName);
        
        // Simulate different render times
        const start = performance.now();
        while (performance.now() - start < (i + 1) * 2) {
          // Busy wait
        }
        
        const renderTime = performanceMonitor.endRenderTimer(componentName);
        renderTimes.push(renderTime);
      }

      const componentData = performanceMonitor.getComponentData(componentName);
      expect(componentData[0].renderCount).toBe(5);
      
      const expectedAverage = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      expect(Math.abs(componentData[0].averageRenderTime - expectedAverage)).toBeLessThan(1);
    });

    it('should track props changes', () => {
      const componentName = 'TestComponent';
      
      performanceMonitor.recordPropsChange(componentName);
      performanceMonitor.recordPropsChange(componentName);
      performanceMonitor.recordPropsChange(componentName);

      const componentData = performanceMonitor.getComponentData(componentName);
      expect(componentData[0].propsChanges).toBe(3);
    });

    it('should limit stored metrics to prevent memory leaks', () => {
      const maxMetrics = 100;
      
      // Record more metrics than the limit
      for (let i = 0; i < 150; i++) {
        performanceMonitor.recordMetric(`test-metric-${i}`, i, 'render');
      }

      const allMetrics = performanceMonitor.getMetrics();
      expect(allMetrics.length).toBeLessThanOrEqual(maxMetrics);
    });

    it('should provide performance summary', () => {
      // Record some test metrics
      performanceMonitor.recordMetric('component1_render', 10, 'render');
      performanceMonitor.recordMetric('component2_render', 20, 'render');
      performanceMonitor.recordMetric('component3_render', 30, 'render');

      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary.totalMetrics).toBe(3);
      expect(summary.averageRenderTime).toBe(20); // (10 + 20 + 30) / 3
      expect(summary.recentMetrics).toHaveLength(3);
    });
  });

  describe('Large Conversation Handling', () => {
    // Mock VirtualizedMessageList component for testing
    const MockVirtualizedMessageList = ({ messages }: { messages: Message[] }) => {
      const { renderCount } = require('../performanceMonitor').usePerformanceMonitor('VirtualizedMessageList');
      
      return (
        <div data-testid="message-list" data-render-count={renderCount}>
          {messages.length < 50 ? (
            // Non-virtualized for small lists
            messages.map(msg => (
              <div key={msg.id} data-testid="message-item">
                {msg.content}
              </div>
            ))
          ) : (
            // Virtualized for large lists
            <div data-testid="virtualized-list">
              Virtualized list with {messages.length} messages
            </div>
          )}
        </div>
      );
    };

    it('should use non-virtualized list for small conversations', () => {
      const smallConversation = generateLargeConversation(10);
      
      render(<MockVirtualizedMessageList messages={smallConversation} />);
      
      expect(screen.getAllByTestId('message-item')).toHaveLength(10);
      expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
    });

    it('should use virtualized list for large conversations', () => {
      const largeConversation = generateLargeConversation(100);
      
      render(<MockVirtualizedMessageList messages={largeConversation} />);
      
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      expect(screen.queryByTestId('message-item')).not.toBeInTheDocument();
    });

    it('should handle rapid message updates without excessive re-renders', async () => {
      const initialMessages = generateLargeConversation(5);
      const { rerender } = render(<MockVirtualizedMessageList messages={initialMessages} />);

      // Simulate rapid message updates
      for (let i = 6; i <= 15; i++) {
        const updatedMessages = generateLargeConversation(i);
        rerender(<MockVirtualizedMessageList messages={updatedMessages} />);
      }

      // Check that the component rendered efficiently
      const messageList = screen.getByTestId('message-list');
      const renderCount = parseInt(messageList.getAttribute('data-render-count') || '0');
      
      // Should have rendered for each update, but not excessively
      expect(renderCount).toBeGreaterThan(0);
      expect(renderCount).toBeLessThan(20); // Reasonable upper bound
    });
  });

  describe('Debounced Form Updates', () => {
    // Mock debounced form component
    const MockDebouncedForm = ({ onUpdate }: { onUpdate: (value: string) => void }) => {
      const [value, setValue] = React.useState('');
      const { useDebounce } = require('../performanceMonitor');
      const debouncedValue = useDebounce(value, 300);

      React.useEffect(() => {
        if (debouncedValue) {
          onUpdate(debouncedValue);
        }
      }, [debouncedValue, onUpdate]);

      return (
        <input
          data-testid="debounced-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    };

    it('should debounce form updates to prevent excessive calls', async () => {
      const mockUpdate = jest.fn();
      render(<MockDebouncedForm onUpdate={mockUpdate} />);

      const input = screen.getByTestId('debounced-input');

      // Type rapidly
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.change(input, { target: { value: 'abcd' } });

      // Should not have called update yet
      expect(mockUpdate).not.toHaveBeenCalled();

      // Wait for debounce
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith('abcd');
      }, { timeout: 500 });

      // Should have been called only once with the final value
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Lazy Loading', () => {
    it('should load components only when needed', async () => {
      // Mock lazy component
      const LazyComponent = React.lazy(() => 
        Promise.resolve({
          default: () => <div data-testid="lazy-content">Lazy loaded content</div>
        })
      );

      const TestWrapper = ({ shouldLoad }: { shouldLoad: boolean }) => (
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          {shouldLoad && <LazyComponent />}
        </React.Suspense>
      );

      const { rerender } = render(<TestWrapper shouldLoad={false} />);

      // Should not show loading or content initially
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.queryByTestId('lazy-content')).not.toBeInTheDocument();

      // Trigger lazy loading
      rerender(<TestWrapper shouldLoad={true} />);

      // Should show loading first
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });
});

// Add React import
import React from 'react';