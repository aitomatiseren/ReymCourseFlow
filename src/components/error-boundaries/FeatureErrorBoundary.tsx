import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/utils/logger';

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface FeatureErrorBoundaryProps {
  children: React.ReactNode;
  featureName: string;
  fallbackRoute?: string;
  showDetails?: boolean;
}

export class FeatureErrorBoundary extends React.Component<FeatureErrorBoundaryProps, FeatureErrorBoundaryState> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<FeatureErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(`Error in ${this.props.featureName} feature`, error, {
      errorInfo: errorInfo.componentStack,
      featureName: this.props.featureName,
      errorBoundary: 'feature'
    });
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  navigateBack = () => {
    if (this.props.fallbackRoute) {
      window.location.href = this.props.fallbackRoute;
    } else {
      window.history.back();
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-orange-700">
                  {this.props.featureName} Error
                </CardTitle>
              </div>
              <CardDescription>
                There was an issue with the {this.props.featureName} feature. 
                You can try again or go back to continue using the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.props.showDetails && (
                <div className="text-sm text-gray-600 font-mono bg-gray-100 p-3 rounded border">
                  <div className="font-semibold mb-1">Error details:</div>
                  {this.state.error.message}
                </div>
              )}
              
              <div className="flex gap-2 flex-wrap">
                <Button onClick={this.resetError} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button onClick={this.navigateBack} variant="secondary" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="default" 
                  size="sm"
                >
                  Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}