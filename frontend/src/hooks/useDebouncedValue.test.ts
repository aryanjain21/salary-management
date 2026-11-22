import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('only emits the latest value after the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'p' },
    });

    rerender({ value: 'pr' });
    rerender({ value: 'priya' });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('p');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('priya');
  });
});
