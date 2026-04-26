import { useEffect, useState } from 'react';

/**
 * useLocalStorageState — like useState, but persists the value to localStorage
 * under the given key. Falls back gracefully when storage is unavailable
 * (private mode, quota exceeded, SSR).
 *
 * Only primitive types and JSON-serializable values are supported.
 */
export function useLocalStorageState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable or quota exceeded — silently ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
