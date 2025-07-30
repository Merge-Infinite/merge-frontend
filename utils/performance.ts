export const measurePerformance = (name: string) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    return {
      start: () => performance.mark(`${name}-start`),
      end: () => {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name)[0];
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
        }
        return measure.duration;
      }
    };
  }
  return {
    start: () => {},
    end: () => 0
  };
};

export const withPerformanceTracking = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: Parameters<T>) => {
    const perf = measurePerformance(name);
    perf.start();
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => perf.end());
    } else {
      perf.end();
      return result;
    }
  }) as T;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};