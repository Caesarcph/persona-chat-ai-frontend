import React from 'react';

/**
 * Memory cleanup utilities for managing session data and preventing memory leaks
 */

interface SessionCleanupConfig {
  maxSessions: number;
  maxMessagesPerSession: number;
  maxAge: number; // in milliseconds
  cleanupInterval: number; // in milliseconds
}

const DEFAULT_CONFIG: SessionCleanupConfig = {
  maxSessions: 10,
  maxMessagesPerSession: 1000,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
};

class MemoryCleanupManager {
  private config: SessionCleanupConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private sessionData = new Map<string, {
    messages: any[];
    lastAccessed: number;
    created: number;
  }>();

  constructor(config: Partial<SessionCleanupConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTimer();
  }

  /**
   * Register a session for memory management
   */
  registerSession(sessionId: string, messages: any[] = []): void {
    const now = Date.now();
    this.sessionData.set(sessionId, {
      messages: [...messages],
      lastAccessed: now,
      created: now,
    });

    // Immediate cleanup if we exceed max sessions
    if (this.sessionData.size > this.config.maxSessions) {
      this.cleanupOldSessions();
    }
  }

  /**
   * Update session access time and optionally add messages
   */
  updateSession(sessionId: string, newMessages?: any[]): void {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    session.lastAccessed = Date.now();
    
    if (newMessages) {
      session.messages.push(...newMessages);
      
      // Trim messages if we exceed the limit
      if (session.messages.length > this.config.maxMessagesPerSession) {
        const excess = session.messages.length - this.config.maxMessagesPerSession;
        session.messages.splice(0, excess);
      }
    }
  }

  /**
   * Remove a session from memory management
   */
  unregisterSession(sessionId: string): void {
    const session = this.sessionData.get(sessionId);
    if (session) {
      // Clear message references
      session.messages.length = 0;
      this.sessionData.delete(sessionId);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    messageCount: number;
    age: number;
    lastAccessed: number;
  } | null {
    const session = this.sessionData.get(sessionId);
    if (!session) return null;

    return {
      messageCount: session.messages.length,
      age: Date.now() - session.created,
      lastAccessed: session.lastAccessed,
    };
  }

  /**
   * Get overall memory statistics
   */
  getMemoryStats(): {
    totalSessions: number;
    totalMessages: number;
    oldestSession: number;
    newestSession: number;
  } {
    let totalMessages = 0;
    let oldestSession = Date.now();
    let newestSession = 0;

    for (const session of this.sessionData.values()) {
      totalMessages += session.messages.length;
      oldestSession = Math.min(oldestSession, session.created);
      newestSession = Math.max(newestSession, session.created);
    }

    return {
      totalSessions: this.sessionData.size,
      totalMessages,
      oldestSession: this.sessionData.size > 0 ? oldestSession : 0,
      newestSession,
    };
  }

  /**
   * Force cleanup of old sessions
   */
  cleanupOldSessions(): number {
    const now = Date.now();
    const sessionsToRemove: string[] = [];

    // Find sessions to remove based on age and access time
    for (const [sessionId, session] of this.sessionData.entries()) {
      const age = now - session.created;
      const timeSinceAccess = now - session.lastAccessed;

      if (age > this.config.maxAge || timeSinceAccess > this.config.maxAge) {
        sessionsToRemove.push(sessionId);
      }
    }

    // If we still have too many sessions, remove the least recently accessed
    if (this.sessionData.size - sessionsToRemove.length > this.config.maxSessions) {
      const sortedSessions = Array.from(this.sessionData.entries())
        .filter(([id]) => !sessionsToRemove.includes(id))
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

      const excessCount = this.sessionData.size - sessionsToRemove.length - this.config.maxSessions;
      for (let i = 0; i < excessCount; i++) {
        sessionsToRemove.push(sortedSessions[i][0]);
      }
    }

    // Remove the sessions
    for (const sessionId of sessionsToRemove) {
      this.unregisterSession(sessionId);
    }

    return sessionsToRemove.length;
  }

  /**
   * Cleanup messages within sessions that exceed limits
   */
  cleanupMessages(): number {
    let totalCleaned = 0;

    for (const session of this.sessionData.values()) {
      if (session.messages.length > this.config.maxMessagesPerSession) {
        const excess = session.messages.length - this.config.maxMessagesPerSession;
        session.messages.splice(0, excess);
        totalCleaned += excess;
      }
    }

    return totalCleaned;
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupOldSessions();
      this.cleanupMessages();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Clear all session data
   */
  clearAll(): void {
    for (const session of this.sessionData.values()) {
      session.messages.length = 0;
    }
    this.sessionData.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SessionCleanupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.startCleanupTimer(); // Restart with new interval
  }
}

// Global instance
export const memoryCleanupManager = new MemoryCleanupManager();

/**
 * React hook for using memory cleanup in components
 */
export const useMemoryCleanup = (sessionId?: string) => {
  const registerSession = React.useCallback((id: string, messages?: any[]) => {
    memoryCleanupManager.registerSession(id, messages);
  }, []);

  const updateSession = React.useCallback((id: string, messages?: any[]) => {
    memoryCleanupManager.updateSession(id, messages);
  }, []);

  const unregisterSession = React.useCallback((id: string) => {
    memoryCleanupManager.unregisterSession(id);
  }, []);

  const getStats = React.useCallback(() => {
    return memoryCleanupManager.getMemoryStats();
  }, []);

  const forceCleanup = React.useCallback(() => {
    return memoryCleanupManager.cleanupOldSessions();
  }, []);

  // Auto-register current session
  React.useEffect(() => {
    if (sessionId) {
      registerSession(sessionId);
      return () => unregisterSession(sessionId);
    }
  }, [sessionId, registerSession, unregisterSession]);

  return {
    registerSession,
    updateSession,
    unregisterSession,
    getStats,
    forceCleanup,
  };
};

/**
 * Utility for cleaning up DOM event listeners and observers
 */
export class DOMCleanupManager {
  private listeners = new Set<{
    element: Element | Window | Document;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
  }>();

  private observers = new Set<{
    observer: IntersectionObserver | MutationObserver | ResizeObserver;
    targets: Element[];
  }>();

  /**
   * Add an event listener with automatic cleanup tracking
   */
  addEventListener<K extends keyof WindowEventMap>(
    element: Window,
    event: K,
    handler: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener<K extends keyof DocumentEventMap>(
    element: Document,
    event: K,
    handler: (this: Document, ev: DocumentEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener<K extends keyof HTMLElementEventMap>(
    element: Element,
    event: K,
    handler: (this: Element, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    element: Element | Window | Document,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options);
    this.listeners.add({ element, event, handler, options });
  }

  /**
   * Add an intersection observer with automatic cleanup tracking
   */
  addIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    const observer = new IntersectionObserver(callback, options);
    this.observers.add({ observer, targets: [] });
    return observer;
  }

  /**
   * Observe an element with an existing observer
   */
  observe(observer: IntersectionObserver, target: Element): void {
    observer.observe(target);
    const observerData = Array.from(this.observers).find(o => o.observer === observer);
    if (observerData) {
      observerData.targets.push(target);
    }
  }

  /**
   * Clean up all tracked listeners and observers
   */
  cleanup(): void {
    // Remove event listeners
    for (const { element, event, handler, options } of this.listeners) {
      element.removeEventListener(event, handler, options);
    }
    this.listeners.clear();

    // Disconnect observers
    for (const { observer, targets } of this.observers) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}

