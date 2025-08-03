// Production optimization configuration

export const PRODUCTION_CONFIG = {
  // Bundle optimization
  enableLazyLoading: true,
  enableCodeSplitting: true,
  enableTreeShaking: true,
  
  // Performance settings
  maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
  debounceDelay: 300, // ms
  throttleLimit: 100, // ms
  
  // Image optimization
  defaultImageQuality: 0.8,
  maxImageWidth: 1200,
  enableWebP: true,
  
  // API optimization
  defaultTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  
  // Memory management
  enableGarbageCollection: true,
  memoryThreshold: 100 * 1024 * 1024, // 100MB
  
  // Feature flags for production
  features: {
    enableAnalytics: false, // Set to true when analytics are configured
    enableErrorReporting: false, // Set to true when error reporting is configured
    enablePerformanceMonitoring: false, // Set to true when monitoring is configured
    enableAdvancedCaching: true,
    enableServiceWorker: false, // Set to true when PWA features are needed
  },
  
  // Security settings
  security: {
    enableCSP: true,
    strictMode: true,
    sanitizeInputs: true,
  },
  
  // Development vs Production differences
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Logging levels
  logLevel: import.meta.env.PROD ? 'error' : 'debug',
  
  // Bundle size warnings
  bundleSizeWarnings: {
    maxChunkSize: 500 * 1024, // 500KB
    maxTotalSize: 2 * 1024 * 1024, // 2MB
  },
} as const;

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const baseConfig = PRODUCTION_CONFIG;
  
  if (import.meta.env.DEV) {
    return {
      ...baseConfig,
      features: {
        ...baseConfig.features,
        enableAnalytics: false,
        enableErrorReporting: false,
        enablePerformanceMonitoring: true, // Enable in dev for debugging
      },
    };
  }
  
  return baseConfig;
};

// Performance budget enforcement
export const PERFORMANCE_BUDGET = {
  // Core Web Vitals targets
  LCP: 2500, // Largest Contentful Paint - 2.5s
  FID: 100, // First Input Delay - 100ms
  CLS: 0.1, // Cumulative Layout Shift - 0.1
  
  // Additional metrics
  FCP: 1800, // First Contentful Paint - 1.8s
  TTI: 3800, // Time to Interactive - 3.8s
  
  // Bundle size limits
  mainBundle: 300 * 1024, // 300KB
  vendorBundle: 800 * 1024, // 800KB
  asyncChunks: 200 * 1024, // 200KB per chunk
  
  // Memory limits
  heapSize: 50 * 1024 * 1024, // 50MB
  
  // Network limits
  maxRequests: 50, // per page
  maxTransferSize: 1.5 * 1024 * 1024, // 1.5MB
} as const;