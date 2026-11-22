import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Returns a stable function that calls `fn` only after it has not been
 * invoked for `delayMs`. Always calls the latest `fn`; cancels on unmount.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs = 300,
): (...args: Args) => void {
  const fnRef = useRef(fn);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (...args: Args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delayMs);
    },
    [delayMs],
  );
}
