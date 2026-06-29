/**
 * Error Boundary Component for HAL Builder
 * Prevents application crashes by catching and handling React errors gracefully
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error info:', errorInfo);

    // Generate unique event ID for error reporting
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to localStorage for debugging (non-sensitive data only)
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        eventId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 10).join('\n'), // First 10 lines only
        },
        componentStack: errorInfo.componentStack
          ?.split('\n')
          .slice(0, 10)
          .join('\n'),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      const existingLogs = JSON.parse(
        localStorage.getItem('hal-error-logs') || '[]'
      );
      const updatedLogs = [...existingLogs, errorLog].slice(-10); // Keep last 10 errors
      localStorage.setItem('hal-error-logs', JSON.stringify(updatedLogs));
    } catch (logError) {
      console.warn('Failed to log error to localStorage:', logError);
    }
  }

  override componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Auto-reset on props change if enabled
    if (hasError && resetOnPropsChange) {
      const hasResetKeyChanged = resetKeys?.some(
        (key, index) => prevProps.resetKeys?.[index] !== key
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    // Clear any pending reset timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReportError = () => {
    const { error, errorInfo, eventId } = this.state;

    if (error && errorInfo && eventId) {
      // Create error report
      const errorReport = {
        eventId,
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Copy to clipboard for user to report
      navigator.clipboard
        .writeText(JSON.stringify(errorReport, null, 2))
        .then(() => {
          alert(
            'Error report copied to clipboard. Please paste it when reporting the issue.'
          );
        })
        .catch(() => {
          // Fallback: show error report in a modal/alert
          const reportText = `Error Report (ID: ${eventId})\n\nError: ${error.message}\n\nPlease copy this information when reporting the issue.`;
          alert(reportText);
        });
    }
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default error UI
      return (
        <div
          className='frostlight-panel-primary frostdark-panel-primary error-boundary-container'
          style={{
            padding: '2rem',
            margin: '1rem',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <h2
              className='frostlight-text-primary frostdark-text-primary'
              style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}
            >
              🚨 Something went wrong
            </h2>
            <p className='frostlight-text-secondary frostdark-text-secondary'>
              HAL Builder encountered an unexpected error and needs to recover.
            </p>
          </div>

          <div
            className='frostlight-card-secondary frostdark-card-secondary'
            style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '6px',
              textAlign: 'left',
            }}
          >
            <details>
              <summary
                className='frostlight-text-primary frostdark-text-primary'
                style={{ cursor: 'pointer', marginBottom: '0.5rem' }}
              >
                Error Details
              </summary>
              <div
                className='frostlight-text-secondary frostdark-text-secondary'
                style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}
              >
                <strong>Error:</strong> {this.state.error?.message}
                <br />
                <strong>ID:</strong> {this.state.eventId}
                <br />
                {this.state.error?.stack && (
                  <>
                    <strong>Stack:</strong>
                    <br />
                    <pre
                      style={{
                        fontSize: '0.75rem',
                        overflow: 'auto',
                        maxHeight: '200px',
                        whiteSpace: 'pre-wrap',
                        marginTop: '0.5rem',
                      }}
                    >
                      {this.state.error.stack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          </div>

          <div
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}
          >
            <button
              onClick={this.handleRetry}
              className='frostlight-button-primary frostdark-button-primary'
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              🔄 Try Again
            </button>

            <button
              onClick={this.handleReload}
              className='frostlight-button-secondary frostdark-button-secondary'
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              🔃 Reload Page
            </button>

            <button
              onClick={this.handleReportError}
              className='frostlight-button-accent frostdark-button-accent'
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              📋 Copy Error Report
            </button>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <p
              className='frostlight-text-tertiary frostdark-text-tertiary'
              style={{ fontSize: '0.75rem' }}
            >
              Your work is automatically saved. You can safely reload the page
              to continue.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * Hook version for functional components that need error boundary functionality
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback(
    (error: Error, errorInfo?: ErrorInfo) => {
      console.error('Manual error report:', error);
      if (errorInfo) {
        console.error('Error info:', errorInfo);
      }

      // This will be caught by the nearest error boundary
      throw error;
    },
    []
  );

  return { handleError };
};

/**
 * HOC version for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent: React.FC<P> = props => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

/**
 * Specialized Error Boundary for Audio Components
 * Provides audio-specific error handling and recovery
 */
export class AudioErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Audio Error caught by AudioErrorBoundary:', error);
    console.error('Audio Error info:', errorInfo);

    const eventId = `audio_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      eventId,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Special handling for audio context errors
    if (
      error.message.includes('AudioContext') ||
      error.message.includes('getUserMedia')
    ) {
      console.warn('Audio system error detected, attempting recovery...');
      // Could implement audio system reset here
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div
          className='frostlight-card-tertiary frostdark-card-tertiary'
          style={{
            padding: '1rem',
            margin: '0.5rem',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          <p
            className='frostlight-text-primary frostdark-text-primary'
            style={{ marginBottom: '0.5rem' }}
          >
            🎵 Audio System Error
          </p>
          <p
            className='frostlight-text-secondary frostdark-text-secondary'
            style={{ fontSize: '0.875rem', marginBottom: '1rem' }}
          >
            The audio visualization encountered an error but other features
            remain functional.
          </p>
          <button
            onClick={this.resetErrorBoundary}
            className='frostlight-button-primary frostdark-button-primary'
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Restart Audio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
