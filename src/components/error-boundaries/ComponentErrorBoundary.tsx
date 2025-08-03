import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/utils/logger';

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName: string;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Lightweight error boundary for individual components
 * Shows minimal fallback UI and logs errors for debugging
 */
export class ComponentErrorBoundary extends React.Component<ComponentErrorBoundaryProps, ComponentErrorBoundaryState> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ComponentErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(`Error in ${this.props.componentName} component`, error, {
      errorInfo: errorInfo.componentStack,
      componentName: this.props.componentName,
      errorBoundary: 'component'
    });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Return custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default minimal fallback
      return (
        <div className="flex items-center justify-center p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="text-center text-red-700">
            <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
            <div className="text-sm font-medium">Component Error</div>
            <div className="text-xs text-red-600">
              {this.props.componentName} failed to load
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}