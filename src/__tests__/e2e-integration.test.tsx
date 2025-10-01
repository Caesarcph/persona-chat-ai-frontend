/**
 * Comprehensive End-to-End Integration Tests
 * Tests the complete persona creation → chat → export → replay cycle
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { getDefaultPersona } from '../validation/personaSchema';
import { Persona, Message } from '../../../shared';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

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

// Mock boring-avatars
jest.mock('boring-avatars', () => ({
  __esModule: true,
  default: ({ name, ...props }: any) => (
    <div data-testid="boring-avatar" data-name={name} {...props}>
      Avatar for {name}
    </div>
  )
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('End-to-End Integration Tests', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses by default
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'healthy',
            services: { ollama: 'healthy', database: 'healthy' },
            ollama: { connected: true, models_count: 3 }
          })
        });
      }
      
      if (url.includes('/api/models')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            models: [
              { name: 'qwen2.5:7b', size: 4000000000 },
              { name: 'llama3.1:8b', size: 4500000000 }
            ]
          })
        });
      }
      
      if (url.includes('/api/personas') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'persona-123',
            name: 'Test Persona',
            created_at: new Date().toISOString()
          })
        });
      }
      
      if (url.includes('/api/personas') && options?.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            personas: [
              {
                id: 'persona-123',
                name: 'Test Persona',
                persona: getDefaultPersona(),
                is_template: false
              }
            ]
          })
        });
      }
      
      if (url.includes('/api/sessions') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'session-456',
            persona_id: 'persona-123',
            name: 'Test Session'
          })
        });
      }
      
      if (url.includes('/api/sessions') && options?.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            sessions: [
              {
                id: 'session-456',
                name: 'Test Session',
                created_at: new Date().toISOString()
              }
            ]
          })
        });
      }
      
      if (url.includes('/api/sessions/session-456/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            messages: [
              {
                id: 'msg-1',
                role: 'user',
                content: 'Hello, test message',
                timestamp: new Date().toISOString()
              },
              {
                id: 'msg-2',
                role: 'assistant',
                content: 'Hello! How can I help you today?',
                timestamp: new Date().toISOString()
              }
            ],
            persona: getDefaultPersona()
          })
        });
      }
      
      if (url.includes('/api/sessions/session-456/export')) {
        const format = url.includes('format=markdown') ? 'markdown' : 'json';
        const content = format === 'json' 
          ? JSON.stringify({
              version: '1.0',
              persona: getDefaultPersona(),
              messages: [
                { id: 'msg-1', role: 'user', content: 'Hello, test message' },
                { id: 'msg-2', role: 'assistant', content: 'Hello! How can I help you today?' }
              ]
            })
          : '# Test Session\n\n**User:** Hello, test message\n\n**Assistant:** Hello! How can I help you today?';
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            format,
            content,
            filename: `session-export.${format === 'json' ? 'json' : 'md'}`
          })
        });
      }
      
      if (url.includes('/api/chat')) {
        // Mock streaming response
        const mockResponse = {
          ok: true,
          body: {
            getReader: () => ({
              read: jest.fn()
                .mockResolvedValueOnce({
                  done: false,
                  value: new TextEncoder().encode('data: {"content": "Hello", "done": false}\n\n')
                })
                .mockResolvedValueOnce({
                  done: false,
                  value: new TextEncoder().encode('data: {"content": " there!", "done": false}\n\n')
                })
                .mockResolvedValueOnce({
                  done: false,
                  value: new TextEncoder().encode('data: {"content": "", "done": true}\n\n')
                })
                .mockResolvedValue({ done: true })
            })
          }
        };
        return Promise.resolve(mockResponse);
      }
      
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });
  });

  describe('Complete Persona Creation → Chat → Export → Replay Cycle', () => {
    test('should complete full workflow successfully', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for initial load and health check
      await waitFor(() => {
        expect(screen.getByText('PersonaChatAI')).toBeInTheDocument();
      });

      // Step 1: Create a persona
      expect(screen.getByText(/persona builder/i)).toBeInTheDocument();
      
      // Fill out basic persona information
      const ageInput = screen.getByLabelText(/age/i);
      const genderInput = screen.getByLabelText(/gender/i);
      const occupationInput = screen.getByLabelText(/occupation/i);
      
      await user.clear(ageInput);
      await user.type(ageInput, '28');
      await user.clear(genderInput);
      await user.type(genderInput, 'non-binary');
      await user.clear(occupationInput);
      await user.type(occupationInput, 'Software Engineer');

      // Save the persona
      const saveButton = screen.getByText(/save persona/i);
      await user.click(saveButton);

      // Wait for save confirmation
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/personas'),
          expect.objectContaining({ method: 'POST' })
        );
      });

      // Step 2: Start a chat session
      const startChatButton = screen.getByText(/start chat/i);
      await user.click(startChatButton);

      // Wait for navigation to chat page
      await waitFor(() => {
        expect(screen.getByText(/chat interface/i)).toBeInTheDocument();
      });

      // Send a message
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'Hello, this is a test message');
      
      const sendButton = screen.getByText(/send/i);
      await user.click(sendButton);

      // Wait for message to be sent and response received
      await waitFor(() => {
        expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
      });

      // Step 3: Export the session
      const exportButton = screen.getByText(/export/i);
      await user.click(exportButton);

      // Choose JSON format
      const jsonExportButton = screen.getByText(/json/i);
      await user.click(jsonExportButton);

      // Wait for export to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sessions/'),
          expect.objectContaining({ method: 'GET' })
        );
      });

      // Step 4: Navigate to sessions page
      const sessionsLink = screen.getByText(/sessions/i);
      await user.click(sessionsLink);

      // Wait for sessions page to load
      await waitFor(() => {
        expect(screen.getByText(/session management/i)).toBeInTheDocument();
      });

      // Step 5: Import and replay a session
      const importButton = screen.getByText(/import session/i);
      await user.click(importButton);

      // Mock file upload
      const fileInput = screen.getByLabelText(/choose file/i);
      const mockFile = new File(
        [JSON.stringify({
          version: '1.0',
          persona: getDefaultPersona(),
          messages: [
            { id: 'msg-1', role: 'user', content: 'Imported message' },
            { id: 'msg-2', role: 'assistant', content: 'Imported response' }
          ]
        })],
        'session-export.json',
        { type: 'application/json' }
      );

      await user.upload(fileInput, mockFile);

      // Confirm import
      const confirmImportButton = screen.getByText(/confirm import/i);
      await user.click(confirmImportButton);

      // Wait for import to complete and session to be created
      await waitFor(() => {
        expect(screen.getByText('Imported message')).toBeInTheDocument();
        expect(screen.getByText('Imported response')).toBeInTheDocument();
      });

      // Verify the complete cycle worked
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/personas'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat'),
        expect.objectContaining({ method: 'POST' })
      );
    }, 30000); // Extended timeout for full workflow

    test('should handle workflow interruptions gracefully', async () => {
      // Mock network failure during persona save
      mockFetch.mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      );

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('PersonaChatAI')).toBeInTheDocument();
      });

      // Try to save persona with network error
      const ageInput = screen.getByLabelText(/age/i);
      await user.type(ageInput, '25');

      const saveButton = screen.getByText(/save persona/i);
      await user.click(saveButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error saving persona/i)).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    test('should handle offline state gracefully', async () => {
      // Mock offline health check
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/health')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              status: 'degraded',
              services: { ollama: 'unhealthy', database: 'healthy' },
              ollama: { connected: false, error: 'Connection refused' }
            })
          });
        }
        return Promise.reject(new Error('Service unavailable'));
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText(/ollama offline/i)).toBeInTheDocument();
      });

      // Should disable chat functionality
      expect(screen.getByText(/chat unavailable/i)).toBeInTheDocument();
    });
  });

  describe('Error Recovery and Retry Mechanisms', () => {
    test('should retry failed API calls with exponential backoff', async () => {
      let callCount = 0;
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/health')) {
          callCount++;
          if (callCount < 3) {
            return Promise.reject(new Error('Temporary failure'));
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              status: 'healthy',
              services: { ollama: 'healthy', database: 'healthy' }
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByText('PersonaChatAI')).toBeInTheDocument();
      }, { timeout: 10000 });

      expect(callCount).toBe(3);
    });

    test('should handle streaming connection failures with reconnection', async () => {
      let streamAttempts = 0;
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/chat')) {
          streamAttempts++;
          if (streamAttempts === 1) {
            // First attempt fails
            return Promise.reject(new Error('Connection failed'));
          }
          // Second attempt succeeds
          return Promise.resolve({
            ok: true,
            body: {
              getReader: () => ({
                read: jest.fn()
                  .mockResolvedValueOnce({
                    done: false,
                    value: new TextEncoder().encode('data: {"content": "Reconnected!", "done": true}\n\n')
                  })
                  .mockResolvedValue({ done: true })
              })
            }
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to chat
      await waitFor(() => {
        expect(screen.getByText('PersonaChatAI')).toBeInTheDocument();
      });

      const chatLink = screen.getByText(/chat/i);
      await user.click(chatLink);

      // Send message that will fail first, then succeed
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'Test reconnection');
      
      const sendButton = screen.getByText(/send/i);
      await user.click(sendButton);

      // Should show reconnection attempt
      await waitFor(() => {
        expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
      });

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByText('Reconnected!')).toBeInTheDocument();
      });

      expect(streamAttempts).toBe(2);
    });
  });

  describe('Data Persistence and Recovery', () => {
    test('should persist persona data across page reloads', async () => {
      const { unmount } = render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Create and save persona
      await waitFor(() => {
        expect(screen.getByText('PersonaChatAI')).toBeInTheDocument();
      });

      const ageInput = screen.getByLabelText(/age/i);
      await user.type(ageInput, '30');

      const saveButton = screen.getByText(/save persona/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/personas'),
          expect.objectContaining({ method: 'POST' })
        );
      });

      // Unmount and remount (simulate page reload)
      unmount();

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should load saved persona
      await waitFor(() => {
        expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      });
    });

    test('should handle corrupted session data gracefully', async () => {
      // Mock corrupted session data
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/sessions/') && url.includes('/messages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              messages: null, // Corrupted data
              persona: null
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      const sessionsLink = screen.getByText(/sessions/i);
      await user.click(sessionsLink);

      // Should show error message for corrupted data
      await waitFor(() => {
        expect(screen.getByText(/session data corrupted/i)).toBeInTheDocument();
      });

      // Should offer recovery options
      expect(screen.getByText(/create new session/i)).toBeInTheDocument();
    });
  });

  describe('Performance Under Load', () => {
    test('should handle large conversation history efficiently', async () => {
      // Mock large conversation
      const largeMessages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i} with some content to simulate real conversation length`,
        timestamp: new Date(Date.now() - (1000 - i) * 1000).toISOString()
      }));

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/sessions/') && url.includes('/messages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              messages: largeMessages,
              persona: getDefaultPersona()
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      const startTime = performance.now();

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      const chatLink = screen.getByText(/chat/i);
      await user.click(chatLink);

      // Should render efficiently even with large conversation
      await waitFor(() => {
        expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      
      // Should render large conversation in reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });

    test('should handle rapid user interactions without blocking UI', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('PersonaChatAI')).toBeInTheDocument();
      });

      const ageInput = screen.getByLabelText(/age/i);
      
      const startTime = performance.now();

      // Rapid typing simulation
      for (let i = 0; i < 50; i++) {
        await user.clear(ageInput);
        await user.type(ageInput, `${20 + i}`);
      }

      const interactionTime = performance.now() - startTime;

      // Should handle rapid interactions efficiently (less than 500ms for 50 interactions)
      expect(interactionTime).toBeLessThan(500);
    });
  });
});