import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from '../useDebouncedValue';

jest.useFakeTimers();

describe('useDebouncedValue', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 300));
    expect(result.current).toBe('a');
  });

  it('returns updated value after the delay', () => {
    const { result, rerender } = renderHook(
      (props: { v: string }) => useDebouncedValue(props.v, 300),
      {
        initialProps: { v: 'a' },
      }
    );
    rerender({ v: 'b' });
    expect(result.current).toBe('a');
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('b');
  });

  it('cancels prior timer when value changes again before delay', () => {
    const { result, rerender } = renderHook(
      (props: { v: string }) => useDebouncedValue(props.v, 300),
      {
        initialProps: { v: 'a' },
      }
    );
    rerender({ v: 'b' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ v: 'c' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('c');
  });
});
