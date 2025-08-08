import React from 'react';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  componentName?: string;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('React Error Boundary', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      component: this.props.componentName || 'Unknown',
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <img src="/Astropal_Logo.png" alt="Astropal Logo" className="w-10 h-10 mx-auto mb-4" />
            <h1 className="text-xl font-medium mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-sm">Please refresh the page and try again.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


