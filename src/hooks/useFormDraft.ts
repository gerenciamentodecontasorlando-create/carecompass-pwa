import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Like useState but persists the value to sessionStorage.
 * Data survives navigation but is cleared when the tab/browser is closed.
 */
export function useFormDraft<T>(key: string, initialValue: T) {
  const storageKey = `draft:${key}`;
  
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const valueRef = useRef(value);
  valueRef.current = value;

  // Save to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {}
  }, [storageKey, value]);

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setValue(initialValue);
  }, [storageKey, initialValue]);

  return [value, setValue, clearDraft] as const;
}
