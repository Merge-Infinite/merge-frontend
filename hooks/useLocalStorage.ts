"use client";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseLocalStorageOptions<T> {
  onChange?: (value: T | null) => void;
  onError?: (error: Error) => void;
  onSave?: (value: T) => void;
  onRemove?: () => void;
}

interface UseLocalStorageReturn<T> {
  value: T | null;
  setValue: (value: T) => void;
  remove: () => void;
  error: Error | null;
}

/**
 * Custom hook for managing localStorage with event synchronization across tabs
 * @param key - The localStorage key
 * @param initialValue - Optional initial value if key doesn't exist
 * @param options - Optional callbacks for change, error, save, and remove events
 * @returns Object with value, setValue, remove functions and error state
 */
export function useLocalStorage<T>(
  key: string,
  initialValue?: T,
  options?: UseLocalStorageOptions<T>
): UseLocalStorageReturn<T> {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to store callbacks to avoid infinite re-renders
  const optionsRef = useRef(options);
  const initializedRef = useRef(false);

  // Update ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize value from localStorage (only once)
  useEffect(() => {
    if (typeof window === "undefined" || initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedValue = JSON.parse(item);
        setValue(parsedValue);
        optionsRef.current?.onChange?.(parsedValue);
      } else if (initialValue !== undefined) {
        setValue(initialValue);
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        optionsRef.current?.onChange?.(initialValue);
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to read from localStorage");
      setError(error);
      optionsRef.current?.onError?.(error);
    }
  }, [key, initialValue]);

  // Save value to localStorage
  const handleSetValue = useCallback(
    (newValue: T) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        setValue(newValue);
        window.localStorage.setItem(key, JSON.stringify(newValue));
        setError(null);

        // Dispatch custom event for same-window synchronization
        window.dispatchEvent(
          new CustomEvent("local-storage-change", {
            detail: { key, value: newValue },
          })
        );

        // Call callbacks
        optionsRef.current?.onSave?.(newValue);
        optionsRef.current?.onChange?.(newValue);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to save to localStorage");
        setError(error);
        optionsRef.current?.onError?.(error);
      }
    },
    [key]
  );

  // Remove value from localStorage
  const handleRemove = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      setValue(null);
      window.localStorage.removeItem(key);
      setError(null);

      // Dispatch custom event for same-window synchronization
      window.dispatchEvent(
        new CustomEvent("local-storage-change", {
          detail: { key, value: null },
        })
      );

      // Call callbacks
      optionsRef.current?.onRemove?.();
      optionsRef.current?.onChange?.(null);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to remove from localStorage");
      setError(error);
      optionsRef.current?.onError?.(error);
    }
  }, [key]);

  // Listen for storage events from other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Handler for storage events (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          if (e.newValue === null) {
            setValue(null);
            optionsRef.current?.onChange?.(null);
          } else {
            const parsedValue = JSON.parse(e.newValue);
            setValue(parsedValue);
            optionsRef.current?.onChange?.(parsedValue);
          }
        } catch (err) {
          const error =
            err instanceof Error
              ? err
              : new Error("Failed to parse storage event");
          setError(error);
          optionsRef.current?.onError?.(error);
        }
      }
    };

    // Handler for custom events (same-window communication)
    const handleCustomStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; value: T | null }>;
      if (customEvent.detail.key === key) {
        setValue(customEvent.detail.value);
        optionsRef.current?.onChange?.(customEvent.detail.value);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage-change", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "local-storage-change",
        handleCustomStorageChange
      );
    };
  }, [key]);

  return {
    value,
    setValue: handleSetValue,
    remove: handleRemove,
    error,
  };
}
