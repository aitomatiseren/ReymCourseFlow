import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/utils/logger';

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  operationName: string;
  maxRetries?: number;
  onRetry?: () => Promise<void>;
  fallback?: React.ReactNode;
}

/**
 * Error boundary specifically designed for async operations
 * Includes retry functionality and loading states
 */
export class AsyncErrorBoundary extends React.Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  private retryCount = 0;

  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(`Async error in ${this.props.operationName}`, error, {
      errorInfo: errorInfo.componentStack,
      operationName: this.props.operationName,
      retryCount: this.retryCount,
      errorBoundary: 'async'
    });
  }

  handleRetry = async () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.retryCount >= maxRetries) {
      logger.warn(`Max retries exceeded for ${this.props.operationName}`, { retryCount: this.retryCount });
      return;
    }

    this.setState({ isRetrying: true });
    this.retryCount++;

    try {
      if (this.props.onRetry) {
        await this.props.onRetry();
      }
      
      // Reset error state if retry was successful
      this.setState({ 
        hasError: false, 
        error: null, 
        isRetrying: false 
      });
    } catch (error) {
      logger.error(`Retry failed for ${this.props.operationName}`, error);
      this.setState({ isRetrying: false });
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Return custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.retryCount < maxRetries && this.props.onRetry;

      return (
        <Card className="border-orange-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-orange-700 text-base">
                {this.props.operationName} Failed
              </CardTitle>
            </div>
            <CardDescription>
              An error occurred while loading data. This might be a temporary issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
              {this.state.error.message}
            </div>
            
            {canRetry && (
              <div className="flex items-center gap-2">
                <Button 
                  onClick={this.handleRetry} 
                  disabled={this.state.isRetrying}
                  variant="outline" 
                  size="sm"
                >
                  {this.state.isRetrying ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {this.state.isRetrying ? 'Retrying...' : 'Retry'}
                </Button>
                
                <span className="text-xs text-gray-500">
                  Attempt {this.retryCount} of {maxRetries}
                </span>
              </div>
            )}
            
            {!canRetry && this.retryCount >= maxRetries && (
              <div className="text-sm text-red-600">
                Maximum retry attempts exceeded. Please refresh the page or contact support.
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}