import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { performanceMonitor, PerformanceDebugger } from '../utils/performanceMonitor';
import { memoryCleanupManager } from '../utils/memoryCleanup';
import OptimizedPersonaBuilder from '../components/OptimizedPersonaBuilder';
import { ChatInterface } from '../components/chat/ChatInterface';
import { getDefaultPersona } from '../validation/personaSchema';
import { Message, Persona } from '../../../shared';

// Mock dependencies
jest.mock('../stores', () => ({
  usePersonaStore: () => ({
    createFromTemplate: jest.fn(),
  }),
}));

jest.mock('../hooks/useSafetyValidation', () => ({
  __esModule: true,
  default: () => ({
    validationResult: { warnings: [] },
    validatePersona: jest.fn(),
    getSafetyRecommendations: jest.fn(),
  }),
}));

// Mock react-window for testing
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: Math.min(itemCount, 10) }).map((_, index) => 
        children({ index, style: {}, data: itemData })
      )}
    </div>
  )
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Performance Integration Tests', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    memoryCleanupManager.clearAll();
    jest.clearAllMocks();
  });

  afterEach(() => {
    performanceMonitor.clear();
    memoryCleanupManager.clearAll();
  });

  describe('Persona Builder Performance', () => {
    test('should handle rapid form updates efficiently', async () => {
      const mockOnPersonaChange = jest.fn();
      const defaultPersona = getDefaultPersona();

      const startTime = performance.now();

      await act(async () => {
        render(
          <TestWrapper>
            <OptimizedPersonaBuilder
              persona={defaultPersona}
              onPersonaChange={mockOnPersonaChange}
              sensitiveFieldsEnabled={false}
            />
          </TestWrapper>
        );
      });

      const initialRenderTime = performance.now() - startTime;

      // Should render initial form efficiently (less than 100ms)
      expect(initialRenderTime).toBeLessThan(100);

      // Simulate rapid typing in multiple fields
      const ageInput = screen.getByLabelText(/age/i);
      const genderInput = screen.getByLabelText(/gender/i);
      const occupationInput = screen.getByLabelText(/occupation/i);

      const typingStartTime = performance.now();

      // Rapid typing simulation
      for (let i = 0; i < 20; i++) {
        await act(async () => {
          fireEvent.change(ageInput, { target: { value: `${25 + i}` } });
          fireEvent.change(genderInput, { target: { value: `gender-${i}` } });
          fireEvent.change(occupationInput, { target: { value: `job-${i}` } });
        });
      }

      const typingTime = performance.now() - typingStartTime;

      // Should handle rapid typing efficiently (less than 200ms for 60 changes)
      expect(typingTime).toBeLessThan(200);

      // Should debounce onChange calls
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 400)); // Wait for debounce
      });

      // Should have called onChange only once due to debouncing
      expect(mockOnPersonaChange).toHaveBeenCalledTimes(1);
    });

    test('should handle section switching with lazy loading efficiently', async () => {
      const mockOnPersonaChange = jest.fn();
      const defaultPersona = getDefaultPersona();

      await act(async () => {
        render(
          <TestWrapper>
            <OptimizedPersonaBuilder
              persona={defaultPersona}
              onPersonaChange={mockOnPersonaChange}
              sensitiveFieldsEnabled={false}
            />
          </TestWrapper>
        );
      });

      const sections = ['personality', 'knowledge', 'communication', 'context', 'safety'];
      const switchingStartTime = performance.now();

      // Rapidly switch between sections
      for (const section of sections) {
        const sectionButton = screen.getByText(new RegExp(section, 'i'));
        
        await act(async () => {
          fireEvent.click(sectionButton);
        });
      }

      const switchingTime = performance.now() - switchingStartTime;

      // Should handle section switching efficiently (less than 100ms for 5 sections)
      expect(switchingTime).toBeLessThan(100);
    });
  });

  describe('Chat Interface Performance', () => {
    const generateTestMessages = (count: number): Message[] => {
      return Array.from({ length: count }, (_, index) => ({
        id: `msg-${index}`,
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: `Test message ${index}. This is a longer message to simulate real conversation content.`,
        timestamp: new Date(Date.now() - (count - index) * 1000)
      }));
    };

    const mockPersona: Persona = {
      schema_version: '1.0',
      age: 30,
      gender: 'non-binary',
      pronouns: 'they/them',
      nationality: 'American',
      region: 'West Coast',
      education: 'PhD Computer Science',
      occupation: 'Software Engineer',
      industry: 'Technology',
      seniority: 'Senior',
      politeness_directness: 60,
      expertise: ['Machine Learning'],
      tools: ['Python'],
      knowledge_cutoff: '2024-01',
      response_style: 'practical',
      tone: 'casual',
      language_preference: 'english',
      detail_depth: 'moderate',
      conversation_goal: 'Help with technical questions',
      banned_topics: []
    };

    test('should handle large conversation efficiently', async () => {
      const messages = generateTestMessages(500);
      const mockOnSendMessage = jest.fn();
      const mockOnCopy = jest.fn();
      const mockOnRegenerate = jest.fn();
      const mockOnExport = jest.fn();

      const startTime = performance.now();

      await act(async () => {
        render(
          <ChatInterface
            persona={mockPersona}
            messages={messages}
            onSendMessage={mockOnSendMessage}
            isStreaming={false}
            isConnected={true}
            onRegenerateMessage={mockOnRegenerate}
            onCopyMessage={mockOnCopy}
            onExportSession={mockOnExport}
          />
        );
      });

      const renderTime = performance.now() - startTime;

      // Should render large conversation efficiently (less than 200ms for 500 messages)
      expect(renderTime).toBeLessThan(200);

      // Should use virtualization for large conversations
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });

    test('should handle rapid message additions efficiently', async () => {
      let messages = generateTestMessages(10);
      const mockOnSendMessage = jest.fn();
      const mockOnCopy = jest.fn();
      const mockOnRegenerate = jest.fn();
      const mockOnExport = jest.fn();

      const { rerender } = render(
        <ChatInterface
          persona={mockPersona}
          messages={messages}
          onSendMessage={mockOnSendMessage}
          isStreaming={false}
          isConnected={true}
          onRegenerateMessage={mockOnRegenerate}
          onCopyMessage={mockOnCopy}
          onExportSession={mockOnExport}
        />
      );

      const startTime = performance.now();

      // Rapidly add messages
      for (let i = 0; i < 50; i++) {
        const newMessage: Message = {
          id: `rapid-msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Rapid message ${i}`,
          timestamp: new Date()
        };

        messages = [...messages, newMessage];

        await act(async () => {
          rerender(
            <ChatInterface
              persona={mockPersona}
              messages={messages}
              onSendMessage={mockOnSendMessage}
              isStreaming={false}
              isConnected={true}
              onRegenerateMessage={mockOnRegenerate}
              onCopyMessage={mockOnCopy}
              onExportSession={mockOnExport}
            />
          );
        });
      }

      const updateTime = performance.now() - startTime;

      // Should handle rapid updates efficiently (less than 300ms for 50 additions)
      expect(updateTime).toBeLessThan(300);
    });

    test('should handle streaming messages efficiently', async () => {
      const messages = generateTestMessages(20);
      const streamingMessageId = messages[messages.length - 1].id;
      const mockOnSendMessage = jest.fn();
      const mockOnCopy = jest.fn();
      const mockOnRegenerate = jest.fn();
      const mockOnExport = jest.fn();

      const { rerender } = render(
        <ChatInterface
          persona={mockPersona}
          messages={messages}
          onSendMessage={mockOnSendMessage}
          isStreaming={true}
          isConnected={true}
          onRegenerateMessage={mockOnRegenerate}
          onCopyMessage={mockOnCopy}
          onExportSession={mockOnExport}
        />
      );

      const startTime = performance.now();

      // Simulate streaming updates
      for (let i = 0; i < 20; i++) {
        const updatedMessages = [...messages];
        updatedMessages[updatedMessages.length - 1] = {
          ...updatedMessages[updatedMessages.length - 1],
          content: `Streaming content... ${'word '.repeat(i + 1)}`
        };

        await act(async () => {
          rerender(
            <ChatInterface
              persona={mockPersona}
              messages={updatedMessages}
              onSendMessage={mockOnSendMessage}
              isStreaming={true}
              isConnected={true}
              onRegenerateMessage={mockOnRegenerate}
              onCopyMessage={mockOnCopy}
              onExportSession={mockOnExport}
              streamingMessageId={streamingMessageId}
            />
          );
        });
      }

      const streamingTime = performance.now() - startTime;

      // Should handle streaming efficiently (less than 150ms for 20 updates)
      expect(streamingTime).toBeLessThan(150);
    });
  });

  describe('Memory Management Integration', () => {
    test('should manage memory efficiently across components', async () => {
      const mockOnPersonaChange = jest.fn();
      const defaultPersona = getDefaultPersona();

      // Render persona builder
      const { unmount: unmountPersonaBuilder } = render(
        <TestWrapper>
          <OptimizedPersonaBuilder
            persona={defaultPersona}
            onPersonaChange={mockOnPersonaChange}
            sensitiveFieldsEnabled={false}
          />
        </TestWrapper>
      );

      // Check initial memory stats
      const initialStats = memoryCleanupManager.getMemoryStats();

      // Render chat interface with large conversation
      const messages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date()
      }));

      const mockPersona: Persona = {
        schema_version: '1.0',
        age: 25,
        gender: 'female',
        pronouns: 'she/her',
        nationality: 'American',
        region: 'California',
        education: 'Bachelor\'s',
        occupation: 'Designer',
        industry: 'Tech',
        seniority: 'Mid',
        politeness_directness: 50,
        expertise: ['Design'],
        tools: ['Figma'],
        knowledge_cutoff: '2024-01',
        response_style: 'practical',
        tone: 'friendly',
        language_preference: 'english',
        detail_depth: 'moderate',
        conversation_goal: 'Design help',
        banned_topics: []
      };

      const { unmount: unmountChat } = render(
        <ChatInterface
          persona={mockPersona}
          messages={messages}
          onSendMessage={jest.fn()}
          isStreaming={false}
          isConnected={true}
          onRegenerateMessage={jest.fn()}
          onCopyMessage={jest.fn()}
          onExportSession={jest.fn()}
        />
      );

      // Check memory after rendering both components
      const midStats = memoryCleanupManager.getMemoryStats();

      // Unmount components
      unmountPersonaBuilder();
      unmountChat();

      // Force cleanup
      memoryCleanupManager.cleanupOldSessions();

      const finalStats = memoryCleanupManager.getMemoryStats();

      // Memory should be managed properly
      expect(finalStats.totalSessions).toBeLessThanOrEqual(midStats.totalSessions);
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should track performance metrics across components', async () => {
      const mockOnPersonaChange = jest.fn();
      const defaultPersona = getDefaultPersona();

      // Clear existing metrics
      performanceMonitor.clear();

      await act(async () => {
        render(
          <TestWrapper>
            <OptimizedPersonaBuilder
              persona={defaultPersona}
              onPersonaChange={mockOnPersonaChange}
              sensitiveFieldsEnabled={false}
            />
            <PerformanceDebugger enabled={true} />
          </TestWrapper>
        );
      });

      // Should have recorded performance metrics
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      // Should have component performance data
      const componentData = performanceMonitor.getComponentData();
      expect(componentData.length).toBeGreaterThan(0);

      // Should provide performance summary
      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.totalMetrics).toBeGreaterThan(0);
      expect(summary.averageRenderTime).toBeGreaterThan(0);
    });

    test('should handle performance debugging UI efficiently', async () => {
      const startTime = performance.now();

      await act(async () => {
        render(<PerformanceDebugger enabled={true} position="bottom-right" />);
      });

      const renderTime = performance.now() - startTime;

      // Should render performance debugger efficiently (less than 20ms)
      expect(renderTime).toBeLessThan(20);

      // Should show performance button
      expect(screen.getByText(/Perf:/)).toBeInTheDocument();
    });
  });

  describe('End-to-End Performance', () => {
    test('should handle complete user workflow efficiently', async () => {
      const mockOnPersonaChange = jest.fn();
      const defaultPersona = getDefaultPersona();

      const workflowStartTime = performance.now();

      // 1. Render persona builder
      const { rerender } = render(
        <TestWrapper>
          <OptimizedPersonaBuilder
            persona={defaultPersona}
            onPersonaChange={mockOnPersonaChange}
            sensitiveFieldsEnabled={false}
          />
        </TestWrapper>
      );

      // 2. Fill out form fields
      const ageInput = screen.getByLabelText(/age/i);
      await act(async () => {
        fireEvent.change(ageInput, { target: { value: '28' } });
      });

      // 3. Switch sections
      const personalityButton = screen.getByText(/personality/i);
      await act(async () => {
        fireEvent.click(personalityButton);
      });

      // 4. Switch to chat interface
      const messages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date()
      }));

      const mockPersona: Persona = {
        ...defaultPersona,
        age: 28
      };

      await act(async () => {
        rerender(
          <TestWrapper>
            <ChatInterface
              persona={mockPersona}
              messages={messages}
              onSendMessage={jest.fn()}
              isStreaming={false}
              isConnected={true}
              onRegenerateMessage={jest.fn()}
              onCopyMessage={jest.fn()}
              onExportSession={jest.fn()}
            />
          </TestWrapper>
        );
      });

      const workflowTime = performance.now() - workflowStartTime;

      // Should handle complete workflow efficiently (less than 500ms)
      expect(workflowTime).toBeLessThan(500);

      // Should have performance metrics from the workflow
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
    });
  });
});