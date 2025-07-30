import { useCallback, useEffect, useRef, useState } from 'react';

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      const renderTime = performance.now() - renderStartTime.current;
      if (renderTime > 16) { // More than 16ms (60fps threshold)
        console.warn(`🐌 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
      }
    }
  });

  const markRenderStart = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // Call this at the start of your component render
  markRenderStart();

  return {
    renderCount: renderCount.current,
    markRenderStart,
  };
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

