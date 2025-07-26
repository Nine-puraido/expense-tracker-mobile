import { renderHook, act } from '@testing-library/react-native';
import { useDebounce, useDebounceCallback } from '../useDebounce';

// Mock timers
jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change the value
    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // Should still be initial

    // Fast forward time but not enough to trigger debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');

    // Fast forward past debounce delay
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timer when value changes quickly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Change value multiple times quickly
    rerender({ value: 'first', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender({ value: 'second', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender({ value: 'final', delay: 500 });

    // Fast forward past delay
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Should only see the final value, not intermediate ones
    expect(result.current).toBe('final');
  });
});

describe('useDebounceCallback', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should debounce callback execution', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(mockCallback, 500));

    // Call the debounced callback multiple times
    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    // Callback should not have been called yet
    expect(mockCallback).not.toHaveBeenCalled();

    // Fast forward past debounce delay
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Callback should be called once with the last arguments
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('arg3');
  });

  it('should cancel previous callback when called again', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(mockCallback, 500));

    // Call the debounced callback
    act(() => {
      result.current('first');
    });

    // Fast forward partially
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Call again before first call executes
    act(() => {
      result.current('second');
    });

    // Fast forward past delay
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Should only call with the second argument
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('second');
  });

  it('should cleanup timeout on unmount', () => {
    const mockCallback = jest.fn();
    const { result, unmount } = renderHook(() => useDebounceCallback(mockCallback, 500));

    // Call the debounced callback
    act(() => {
      result.current('test');
    });

    // Unmount before callback executes
    unmount();

    // Fast forward past delay
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Callback should not have been called
    expect(mockCallback).not.toHaveBeenCalled();
  });
});