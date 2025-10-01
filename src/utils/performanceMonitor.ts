import React from 'react';

/**
 * Performance monitoring utilities for tracking and optimizing app performance
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'network' | 'memory' | 'user-interaction';
}

interface ComponentPerformanceData {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  propsChanges: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private componentData: Map<string, ComponentPerformanceData> = new Map();
  private maxMetrics = 1000;

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, category: PerformanceMetric['category'] = 'render') {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Record component render performance
   */
  recordComponentRender(componentName: string, renderTime: number) {
    const existing = this.componentData.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.averageRenderTime = (existing.averageRenderTime * (existing.renderCount - 1) + renderTime) / existing.renderCount;
      existing.lastRenderTime = renderTime;
    } else {
      this.componentData.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        propsChanges: 0
      });
    }

    this.recordMetric(`${componentName}_render`, renderTime, 'render');
  }

  /**
   * Record props change for a component
   */
  recordPropsChange(componentName: string) {
    const existing = this.componentData.get(componentName);
    if (existing) {
      existing.propsChanges++;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const renderMetrics = this.metrics.filter(m => m.category === 'render');
    const averageRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length 
      : 0;

    const slowestComponents = Array.from(this.componentData.values())
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, 5);

    return {
      totalMetrics: this.metrics.length,
      averageRenderTime,
      slowestComponents,
      componentCount: this.componentData.size
    };
  }

  /**
   * Clear all performance data
   */
  clear() {
    this.metrics = [];
    this.componentData.clear();
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return [...this.metrics];
  }

  /**
   * Get component data
   */
  getComponentData() {
    return new Map(this.componentData);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for monitoring component performance
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = React.useRef<number>();

  React.useEffect(() => {
    renderStartTime.current = performance.now();
  });

  React.useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      performanceMonitor.recordComponentRender(componentName, renderTime);
    }
  });

  const trackPropsChange = React.useCallback((props: any) => {
    performanceMonitor.recordPropsChange(componentName);
  }, [componentName]);

  const recordMetric = React.useCallback((name: string, value: number) => {
    performanceMonitor.recordMetric(name, value);
  }, []);

  return {
    trackPropsChange,
    recordMetric
  };
};

/**
 * Hook for monitoring memory usage
 */
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = React.useState<any>(null);

  React.useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

/**
 * Higher-order component for automatic performance monitoring
 */
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const MonitoredComponent = React.forwardRef<any, P>((props, ref) => {
    const { trackPropsChange } = usePerformanceMonitor(displayName);
    
    // Track props changes
    React.useEffect(() => {
      trackPropsChange(props);
    }, [props, trackPropsChange]);

    return React.createElement(WrappedComponent, { ...props, ref } as any);
  });

  MonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return MonitoredComponent;
};

/**
 * Performance debugger utility functions
 */
export const createPerformanceDebugger = () => {
  return {
    getSummary: () => performanceMonitor.getPerformanceSummary(),
    clear: () => performanceMonitor.clear(),
    isEnabled: process.env.NODE_ENV === 'development'
  };
};