import { useCallback } from 'react';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

interface ErrorHandlerOptions {
  showToast?: boolean;
  toastMessage?: string;
  logError?: boolean;
  context?: string;
  onError?: (error: Error) => void;
}

/**
 * Hook for consistent error handling across components
 * Provides logging, toast notifications, and custom error handling
 */
export function useErrorHandler() {
  const handleError = useCallback((
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      toastMessage,
      logError = true,
      context,
      onError
    } = options;

    // Normalize error to Error object
    const normalizedError = error instanceof Error 
      ? error 
      : new Error(String(error));

    // Log error if enabled
    if (logError) {
      logger.error(
        context ? `Error in ${context}` : 'Application error',
        normalizedError,
        { context }
      );
    }

    // Show toast notification if enabled
    if (showToast) {
      const message = toastMessage || 
        (normalizedError.message === 'Failed to fetch' 
          ? 'Network error. Please check your connection.'
          : normalizedError.message || 'An unexpected error occurred'
        );
      
      toast.error(message);
    }

    // Call custom error handler if provided
    onError?.(normalizedError);

    return normalizedError;
  }, []);

  const handleAsyncError = useCallback(async (
    asyncOperation: () => Promise<any>,
    options: ErrorHandlerOptions = {}
  ) => {
    try {
      return await asyncOperation();
    } catch (error) {
      handleError(error, options);
      throw error; // Re-throw to allow caller to handle if needed
    }
  }, [handleError]);

  const createErrorHandler = useCallback((
    options: ErrorHandlerOptions = {}
  ) => {
    return (error: Error | unknown) => handleError(error, options);
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    createErrorHandler,
  };
}