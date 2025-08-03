// Performance optimization utilities

/**
 * Lazy load heavy dependencies only when needed
 */

// Lazy load PDF processing
export const loadPDFProcessor = async () => {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.js?url')
  ]);
  
  // Configure worker
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
};

// Lazy load chart libraries
export const loadChartLibrary = async () => {
  const recharts = await import('recharts');
  return recharts;
};

// Lazy load calendar libraries
export const loadCalendarLibrary = async () => {
  const [core, react, daygrid, timegrid, interaction] = await Promise.all([
    import('@fullcalendar/core'),
    import('@fullcalendar/react'),
    import('@fullcalendar/daygrid'),
    import('@fullcalendar/timegrid'),
    import('@fullcalendar/interaction'),
  ]);
  
  return { core, react, daygrid, timegrid, interaction };
};

// Lazy load form validation
export const loadValidationLibrary = async () => {
  const zod = await import('zod');
  return zod;
};

// Preload critical resources when browser is idle
export const preloadCriticalResources = () => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      // Preload commonly used icons
      import('lucide-react').then((icons) => {
        // Pre-instantiate commonly used icons
        const commonIcons = [
          'Calendar', 'User', 'Settings', 'Home', 'FileText', 
          'CheckCircle', 'AlertCircle', 'Plus', 'Edit', 'Trash2'
        ];
        // Icons are now cached for immediate use
      });
    });
  }
};

// Image optimization utility
export const optimizeImage = (url: string, maxWidth = 800, quality = 0.8): string => {
  // For future implementation with image optimization service
  return url;
};

// Debounce utility for performance-sensitive operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Throttle utility for scroll/resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Intersection Observer for lazy loading
export const createLazyLoader = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Memory usage monitoring (development only)
export const monitorMemoryUsage = () => {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.info('Memory Usage:', {
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    });
  }
};

// Bundle analysis helper (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.info('Bundle Analysis:', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
    });
  }
};