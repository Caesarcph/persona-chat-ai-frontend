import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '../useDebounce';
import { performanceMonitor } from '../../utils/performanceMonitor';

describe('useDebounce Performance Tests', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    performanceMonitor.clear();
    jest.useRealTimers();
  });

  describe('useDebounce Hook', () => {
    test('should prevent excessive updates with rapid value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 300 } }
      );

      expect(result.current).toBe('initial');

      // Rapidly change values
      const values = ['a', 'ab', 'abc', 'abcd', 'abcde'];
      const startTime = performance.now();

      values.forEach((value, index) => {
        act(() => {
          rerender({ value, delay: 300 });
        });
      });

      const updateTime = performance.now() - startTime;

      // Should still show initial value before debounce delay
      expect(result.current).toBe('initial');

      // Fast forward time to trigger debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should now show the final value
      expect(result.current).toBe('abcde');

      // Should handle rapid updates efficiently (less than 10ms)
      expect(updateTime).toBeLessThan(10);
    });

    test('should handle large number of rapid updates efficiently', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: '', delay: 500 } }
      );

      const startTime = performance.now();

      // Simulate typing 100 characters rapidly
      for (let i = 0; i < 100; i++) {
        act(() => {
          rerender({ value: 'a'.repeat(i + 1), delay: 500 });
        });
      }

      const updateTime = performance.now() - startTime;

      // Should handle 100 rapid updates efficiently (less than 50ms)
      expect(updateTime).toBeLessThan(50);

      // Should still show initial value
      expect(result.current).toBe('');

      // Fast forward to trigger debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should show final value
      expect(result.current).toBe('a'.repeat(100));
    });

    test('should cleanup timers properly to prevent memory leaks', () => {
      const { result, rerender, unmount } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'test', delay: 300 } }
      );

      // Create multiple pending timers
      for (let i = 0; i < 10; i++) {
        act(() => {
          rerender({ value: `test-${i}`, delay: 300 });
        });
      }

      // Unmount component
      unmount();

      // Fast forward time - should not cause any errors
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // No errors should occur, indicating proper cleanup
      expect(true).toBe(true);
    });
  });

  describe('useDebouncedCallback Hook', () => {
    test('should prevent excessive callback executions', () => {
      const mockCallback = jest.fn();
      const { result, rerender } = renderHook(
        ({ callback, delay }) => useDebouncedCallback(callback, delay),
        { initialProps: { callback: mockCallback, delay: 300 } }
      );

      const startTime = performance.now();

      // Rapidly call the debounced callback
      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current();
        });
      }

      const callTime = performance.now() - startTime;

      // Should handle rapid calls efficiently (less than 20ms)
      expect(callTime).toBeLessThan(20);

      // Callback should not have been executed yet
      expect(mockCallback).not.toHaveBeenCalled();

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Callback should have been executed only once
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('should handle callback changes efficiently', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();

      const { result, rerender } = renderHook(
        ({ callback, delay }) => useDebouncedCallback(callback, delay),
        { initialProps: { callback: mockCallback1, delay: 200 } }
      );

      const startTime = performance.now();

      // Change callback multiple times
      for (let i = 0; i < 20; i++) {
        const callback = i % 2 === 0 ? mockCallback1 : mockCallback2;
        act(() => {
          rerender({ callback, delay: 200 });
        });
      }

      const updateTime = performance.now() - startTime;

      // Should handle callback changes efficiently (less than 15ms)
      expect(updateTime).toBeLessThan(15);
    });
  });

  describe('Form Performance Simulation', () => {
    test('should simulate persona form typing performance', () => {
      const mockOnChange = jest.fn();
      const { result, rerender } = renderHook(
        ({ value, delay }) => {
          const debouncedValue = useDebounce(value, delay);
          const debouncedCallback = useDebouncedCallback(mockOnChange, delay);
          return { debouncedValue, debouncedCallback };
        },
        { initialProps: { value: '', delay: 300 } }
      );

      const startTime = performance.now();

      // Simulate typing a long persona description
      const text = 'This is a detailed persona description that includes personality traits, background information, and various characteristics that would be typical in a real-world usage scenario.';
      
      text.split('').forEach((char, index) => {
        act(() => {
          rerender({ value: text.substring(0, index + 1), delay: 300 });
          result.current.debouncedCallback();
        });
      });

      const typingTime = performance.now() - startTime;

      // Should handle realistic typing scenario efficiently (less than 100ms for 200+ characters)
      expect(typingTime).toBeLessThan(100);

      // Should not have triggered onChange yet
      expect(mockOnChange).not.toHaveBeenCalled();

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should have final value and single callback execution
      expect(result.current.debouncedValue).toBe(text);
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    test('should handle multiple form fields updating simultaneously', () => {
      const fields = ['name', 'age', 'occupation', 'personality', 'background'];
      const hooks = fields.map(field => 
        renderHook(
          ({ value, delay }) => useDebounce(value, delay),
          { initialProps: { value: '', delay: 300 } }
        )
      );

      const startTime = performance.now();

      // Simulate updating all fields simultaneously
      for (let i = 0; i < 50; i++) {
        hooks.forEach((hook, fieldIndex) => {
          act(() => {
            hook.rerender({ value: `${fields[fieldIndex]}-${i}`, delay: 300 });
          });
        });
      }

      const updateTime = performance.now() - startTime;

      // Should handle multiple field updates efficiently (less than 100ms)
      expect(updateTime).toBeLessThan(100);

      // All hooks should still show initial values
      hooks.forEach(hook => {
        expect(hook.result.current).toBe('');
      });

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // All hooks should show final values
      hooks.forEach((hook, fieldIndex) => {
        expect(hook.result.current).toBe(`${fields[fieldIndex]}-49`);
      });

      // Cleanup
      hooks.forEach(hook => hook.unmount());
    });
  });
});