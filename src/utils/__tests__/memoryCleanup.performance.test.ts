import { memoryCleanupManager } from '../memoryCleanup';

describe('Memory Cleanup Performance Tests', () => {
  beforeEach(() => {
    memoryCleanupManager.clearAll();
    jest.useFakeTimers();
  });

  afterEach(() => {
    memoryCleanupManager.clearAll();
    jest.useRealTimers();
  });

  describe('Large Session Management', () => {
    test('should handle 100 sessions efficiently', () => {
      const startTime = performance.now();

      // Create 100 sessions with messages
      for (let i = 0; i < 100; i++) {
        const messages = Array.from({ length: 50 }, (_, j) => ({
          id: `msg-${i}-${j}`,
          content: `Message ${j} in session ${i}`,
          timestamp: Date.now()
        }));
        
        memoryCleanupManager.registerSession(`session-${i}`, messages);
      }

      const registrationTime = performance.now() - startTime;

      // Should register 100 sessions efficiently (less than 100ms)
      expect(registrationTime).toBeLessThan(100);

      const stats = memoryCleanupManager.getMemoryStats();
      expect(stats.totalSessions).toBe(100);
      expect(stats.totalMessages).toBe(5000); // 100 sessions * 50 messages
    });

    test('should cleanup old sessions efficiently', () => {
      // Create sessions with different ages
      const now = Date.now();
      for (let i = 0; i < 50; i++) {
        const messages = Array.from({ length: 20 }, (_, j) => ({
          id: `msg-${i}-${j}`,
          content: `Message ${j}`,
          timestamp: now - (i * 60000) // Each session is 1 minute older
        }));
        
        memoryCleanupManager.registerSession(`session-${i}`, messages);
        
        // Simulate different creation times
        const session = (memoryCleanupManager as any).sessionData.get(`session-${i}`);
        if (session) {
          session.created = now - (i * 60000);
          session.lastAccessed = now - (i * 30000);
        }
      }

      const startTime = performance.now();
      const cleanedCount = memoryCleanupManager.cleanupOldSessions();
      const cleanupTime = performance.now() - startTime;

      // Should cleanup efficiently (less than 50ms)
      expect(cleanupTime).toBeLessThan(50);

      // Should have cleaned up some old sessions
      expect(cleanedCount).toBeGreaterThan(0);

      const stats = memoryCleanupManager.getMemoryStats();
      expect(stats.totalSessions).toBeLessThan(50);
    });

    test('should handle rapid session updates without performance degradation', () => {
      const sessionId = 'rapid-update-session';
      memoryCleanupManager.registerSession(sessionId, []);

      const startTime = performance.now();

      // Rapidly add messages to a session
      for (let i = 0; i < 1000; i++) {
        const newMessages = [{
          id: `msg-${i}`,
          content: `Rapid message ${i}`,
          timestamp: Date.now()
        }];
        
        memoryCleanupManager.updateSession(sessionId, newMessages);
      }

      const updateTime = performance.now() - startTime;

      // Should handle 1000 rapid updates efficiently (less than 200ms)
      expect(updateTime).toBeLessThan(200);

      const stats = memoryCleanupManager.getSessionStats(sessionId);
      expect(stats?.messageCount).toBeLessThanOrEqual(1000); // Should be trimmed to max limit
    });
  });

  describe('Memory Leak Prevention', () => {
    test('should prevent memory leaks with excessive message accumulation', () => {
      const sessionId = 'memory-test-session';
      memoryCleanupManager.registerSession(sessionId, []);

      // Add messages beyond the limit
      const messagesPerBatch = 100;
      const batches = 20; // Total: 2000 messages

      const startTime = performance.now();

      for (let batch = 0; batch < batches; batch++) {
        const messages = Array.from({ length: messagesPerBatch }, (_, i) => ({
          id: `msg-${batch}-${i}`,
          content: `Message ${i} in batch ${batch}`,
          timestamp: Date.now()
        }));
        
        memoryCleanupManager.updateSession(sessionId, messages);
      }

      const addTime = performance.now() - startTime;

      // Should handle large message accumulation efficiently (less than 300ms)
      expect(addTime).toBeLessThan(300);

      const stats = memoryCleanupManager.getSessionStats(sessionId);
      
      // Should have trimmed messages to prevent memory leaks
      expect(stats?.messageCount).toBeLessThanOrEqual(1000); // Default max limit
    });

    test('should cleanup automatically on timer', () => {
      // Create sessions that will be cleaned up
      for (let i = 0; i < 20; i++) {
        const messages = Array.from({ length: 10 }, (_, j) => ({
          id: `msg-${i}-${j}`,
          content: `Message ${j}`,
          timestamp: Date.now()
        }));
        
        memoryCleanupManager.registerSession(`timer-session-${i}`, messages);
        
        // Make some sessions old
        if (i < 10) {
          const session = (memoryCleanupManager as any).sessionData.get(`timer-session-${i}`);
          if (session) {
            session.created = Date.now() - (25 * 60 * 60 * 1000); // 25 hours old
            session.lastAccessed = Date.now() - (25 * 60 * 60 * 1000);
          }
        }
      }

      const initialStats = memoryCleanupManager.getMemoryStats();
      expect(initialStats.totalSessions).toBe(20);

      // Fast forward the cleanup timer (default: 5 minutes)
      jest.advanceTimersByTime(5 * 60 * 1000);

      const finalStats = memoryCleanupManager.getMemoryStats();
      
      // Should have cleaned up old sessions automatically
      expect(finalStats.totalSessions).toBeLessThan(initialStats.totalSessions);
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should provide performance statistics efficiently', () => {
      // Create multiple sessions
      for (let i = 0; i < 30; i++) {
        const messages = Array.from({ length: 25 }, (_, j) => ({
          id: `msg-${i}-${j}`,
          content: `Message ${j}`,
          timestamp: Date.now()
        }));
        
        memoryCleanupManager.registerSession(`perf-session-${i}`, messages);
      }

      const startTime = performance.now();
      
      // Get statistics multiple times
      for (let i = 0; i < 100; i++) {
        memoryCleanupManager.getMemoryStats();
      }

      const statsTime = performance.now() - startTime;

      // Should provide stats efficiently (less than 50ms for 100 calls)
      expect(statsTime).toBeLessThan(50);
    });

    test('should handle concurrent session operations efficiently', () => {
      const startTime = performance.now();

      // Simulate concurrent operations
      const operations = [];
      
      for (let i = 0; i < 50; i++) {
        operations.push(() => {
          const sessionId = `concurrent-session-${i}`;
          const messages = Array.from({ length: 10 }, (_, j) => ({
            id: `msg-${i}-${j}`,
            content: `Message ${j}`,
            timestamp: Date.now()
          }));
          
          memoryCleanupManager.registerSession(sessionId, messages);
          memoryCleanupManager.updateSession(sessionId, [{ 
            id: `update-${i}`, 
            content: 'Updated', 
            timestamp: Date.now() 
          }]);
          memoryCleanupManager.getSessionStats(sessionId);
        });
      }

      // Execute all operations
      operations.forEach(op => op());

      const operationTime = performance.now() - startTime;

      // Should handle concurrent operations efficiently (less than 100ms)
      expect(operationTime).toBeLessThan(100);

      const stats = memoryCleanupManager.getMemoryStats();
      expect(stats.totalSessions).toBe(50);
    });
  });

  describe('Configuration Performance', () => {
    test('should handle configuration updates efficiently', () => {
      // Create initial sessions
      for (let i = 0; i < 25; i++) {
        memoryCleanupManager.registerSession(`config-session-${i}`, []);
      }

      const startTime = performance.now();

      // Update configuration multiple times
      for (let i = 0; i < 20; i++) {
        memoryCleanupManager.updateConfig({
          maxSessions: 10 + i,
          maxMessagesPerSession: 500 + (i * 10),
          cleanupInterval: 1000 + (i * 100)
        });
      }

      const configTime = performance.now() - startTime;

      // Should handle config updates efficiently (less than 30ms)
      expect(configTime).toBeLessThan(30);
    });
  });
});