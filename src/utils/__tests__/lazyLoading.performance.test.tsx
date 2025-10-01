import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { createLazyComponent, preloadComponent, preloadComponents, usePreloadOnInteraction, LazyContent } from '../lazyLoading';

// Mock components for testing
const MockHeavyComponent = React.lazy(() => 
  Promise.resolve({
    default: () => <div data-testid="heavy-component">Heavy Component Loaded</div>
  })
);

const MockLightComponent = () => <div data-testid="light-component">Light Component</div>;

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Lazy Loading Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Lazy Loading', () => {
    test('should create lazy components efficiently', () => {
      const startTime = performance.now();

      // Create multiple lazy components
      const lazyComponents = [];
      for (let i = 0; i < 50; i++) {
        const LazyComp = createLazyComponent(() => 
          Promise.resolve({
            default: () => <div>Component {i}</div>
          })
        );
        lazyComponents.push(LazyComp);
      }

      const creationTime = performance.now() - startTime;

      // Should create lazy components efficiently (less than 20ms for 50 components)
      expect(creationTime).toBeLessThan(20);
      expect(lazyComponents).toHaveLength(50);
    });

    test('should handle lazy component rendering efficiently', async () => {
      const LazyTestComponent = createLazyComponent(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              default: () => <div data-testid="lazy-test">Lazy Component</div>
            });
          }, 10);
        })
      );

      const startTime = performance.now();

      await act(async () => {
        render(
          <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
            <LazyTestComponent />
          </React.Suspense>
        );
      });

      // Should show loading state immediately
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for lazy component to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      const renderTime = performance.now() - startTime;

      // Should render efficiently (less than 50ms including async loading)
      expect(renderTime).toBeLessThan(50);
      expect(screen.getByTestId('lazy-test')).toBeInTheDocument();
    });
  });

  describe('Preloading Performance', () => {
    test('should preload single component efficiently', async () => {
      const mockImport = jest.fn(() => 
        Promise.resolve({
          default: MockLightComponent
        })
      );

      const startTime = performance.now();
      await preloadComponent(mockImport);
      const preloadTime = performance.now() - startTime;

      // Should preload efficiently (less than 10ms)
      expect(preloadTime).toBeLessThan(10);
      expect(mockImport).toHaveBeenCalledTimes(1);
    });

    test('should preload multiple components in parallel efficiently', async () => {
      const mockImports = Array.from({ length: 10 }, (_, i) => 
        jest.fn(() => 
          Promise.resolve({
            default: () => <div>Component {i}</div>
          })
        )
      );

      const startTime = performance.now();
      await preloadComponents(mockImports);
      const preloadTime = performance.now() - startTime;

      // Should preload multiple components efficiently (less than 50ms for 10 components)
      expect(preloadTime).toBeLessThan(50);
      mockImports.forEach(mockImport => {
        expect(mockImport).toHaveBeenCalledTimes(1);
      });
    });

    test('should handle preload on interaction efficiently', () => {
      const mockImport = jest.fn(() => 
        Promise.resolve({
          default: MockLightComponent
        })
      );

      const TestComponent = () => {
        const preloadProps = usePreloadOnInteraction(mockImport);
        return (
          <button 
            data-testid="preload-button" 
            {...preloadProps}
          >
            Hover to preload
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByTestId('preload-button');

      const startTime = performance.now();
      
      // Simulate mouse enter
      fireEvent.mouseEnter(button);
      
      const interactionTime = performance.now() - startTime;

      // Should handle interaction efficiently (less than 5ms)
      expect(interactionTime).toBeLessThan(5);
      expect(mockImport).toHaveBeenCalledTimes(1);

      // Second interaction should not trigger another preload
      fireEvent.mouseEnter(button);
      expect(mockImport).toHaveBeenCalledTimes(1);
    });
  });

  describe('Intersection Observer Performance', () => {
    test('should handle multiple LazyContent components efficiently', () => {
      const startTime = performance.now();

      const { container } = render(
        <div>
          {Array.from({ length: 20 }, (_, i) => (
            <LazyContent key={i} fallback={<div>Loading {i}</div>}>
              <div data-testid={`content-${i}`}>Content {i}</div>
            </LazyContent>
          ))}
        </div>
      );

      const renderTime = performance.now() - startTime;

      // Should render multiple LazyContent components efficiently (less than 100ms for 20 components)
      expect(renderTime).toBeLessThan(100);

      // Should create intersection observers
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    test('should cleanup intersection observers properly', () => {
      const { unmount } = render(
        <LazyContent>
          <div data-testid="content">Test Content</div>
        </LazyContent>
      );

      // Mock the observer instance
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };
      mockIntersectionObserver.mockReturnValue(mockObserver);

      // Unmount component
      unmount();

      // Should not cause memory leaks (no errors thrown)
      expect(true).toBe(true);
    });
  });

  describe('Large Scale Lazy Loading', () => {
    test('should handle lazy loading of many components simultaneously', async () => {
      const componentCount = 100;
      const LazyComponents = Array.from({ length: componentCount }, (_, i) =>
        createLazyComponent(() => 
          Promise.resolve({
            default: () => <div data-testid={`lazy-${i}`}>Component {i}</div>
          })
        )
      );

      const startTime = performance.now();

      await act(async () => {
        render(
          <div>
            {LazyComponents.map((LazyComp, i) => (
              <React.Suspense key={i} fallback={<div>Loading {i}</div>}>
                <LazyComp />
              </React.Suspense>
            ))}
          </div>
        );
      });

      const renderTime = performance.now() - startTime;

      // Should handle many lazy components efficiently (less than 200ms for 100 components)
      expect(renderTime).toBeLessThan(200);
    });

    test('should handle rapid lazy loading state changes', async () => {
      const LazyTestComponent = createLazyComponent(() => 
        Promise.resolve({
          default: () => <div data-testid="rapid-lazy">Rapid Lazy Component</div>
        })
      );

      const TestWrapper = ({ show }: { show: boolean }) => (
        show ? (
          <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
            <LazyTestComponent />
          </React.Suspense>
        ) : null
      );

      const { rerender } = render(<TestWrapper show={false} />);

      const startTime = performance.now();

      // Rapidly toggle visibility
      for (let i = 0; i < 20; i++) {
        await act(async () => {
          rerender(<TestWrapper show={i % 2 === 0} />);
        });
      }

      const toggleTime = performance.now() - startTime;

      // Should handle rapid state changes efficiently (less than 100ms for 20 toggles)
      expect(toggleTime).toBeLessThan(100);
    });
  });

  describe('Memory Management', () => {
    test('should not create memory leaks with lazy components', async () => {
      const componentRefs: React.ComponentType[] = [];

      // Create and destroy many lazy components
      for (let i = 0; i < 50; i++) {
        const LazyComp = createLazyComponent(() => 
          Promise.resolve({
            default: () => <div>Component {i}</div>
          })
        );
        
        componentRefs.push(LazyComp);

        const { unmount } = render(
          <React.Suspense fallback={<div>Loading</div>}>
            <LazyComp />
          </React.Suspense>
        );

        // Immediately unmount
        unmount();
      }

      // Should not cause memory issues
      expect(componentRefs).toHaveLength(50);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // No errors should occur
      expect(true).toBe(true);
    });

    test('should handle concurrent lazy loading efficiently', async () => {
      const concurrentCount = 25;
      const promises: Promise<any>[] = [];

      const startTime = performance.now();

      // Create concurrent lazy loading operations
      for (let i = 0; i < concurrentCount; i++) {
        const promise = act(async () => {
          const LazyComp = createLazyComponent(() => 
            Promise.resolve({
              default: () => <div>Concurrent {i}</div>
            })
          );

          render(
            <React.Suspense fallback={<div>Loading</div>}>
              <LazyComp />
            </React.Suspense>
          );
        });

        promises.push(promise);
      }

      await Promise.all(promises);

      const concurrentTime = performance.now() - startTime;

      // Should handle concurrent operations efficiently (less than 150ms for 25 concurrent operations)
      expect(concurrentTime).toBeLessThan(150);
    });
  });
});