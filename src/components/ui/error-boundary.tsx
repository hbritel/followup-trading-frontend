import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import PageError from '@/components/ui/page-error';

interface Props {
  children: ReactNode;
  /** Custom fallback rendered instead of the default PageError */
  fallback?: ReactNode;
  /** Called when an error is caught — useful for logging */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Class-based React error boundary.
 * Catches runtime errors in its subtree and renders a graceful fallback.
 * Functional-component equivalent is not possible (React limitation).
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    // In production you could send to an error tracking service here
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <PageError
          title="Unexpected error"
          message={this.state.error?.message || 'An unexpected error occurred in this section.'}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
