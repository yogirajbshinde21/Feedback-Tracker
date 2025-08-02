/**
 * Error Boundary Component
 * Catches JavaScript errors in React component tree
 */

import React from 'react';

/**
 * What is an Error Boundary?
 * - React component that catches JavaScript errors anywhere in child component tree
 * - Logs those errors and displays a fallback UI
 * - Prevents entire app from crashing due to component errors
 * - Only catches errors in render methods, lifecycle methods, and constructors
 */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Static method called when error is thrown
   * Updates state to trigger error UI
   */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  /**
   * Called when error is caught
   * Used for error logging and reporting
   */
  componentDidCatch(error, errorInfo) {
    console.error('🔥 Error Boundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In production, you might want to log to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  /**
   * Reset error boundary state
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  /**
   * Reload the page as last resort
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    // If there's an error, show fallback UI
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h1>🔥 Oops! Something went wrong</h1>
            <p>
              We're sorry, but something unexpected happened. 
              This error has been logged and we'll look into it.
            </p>
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Technical Details (Development Only)</summary>
                <pre className="error-stack">
                  <strong>Error:</strong> {this.state.error.toString()}
                  <br />
                  <strong>Stack Trace:</strong>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="error-actions">
              <button 
                className="btn btn-primary"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
              
              <button 
                className="btn btn-outline"
                onClick={() => window.history.back()}
              >
                Go Back
              </button>
            </div>

            {/* Help Text */}
            <div className="error-help">
              <p>
                <strong>What can you do?</strong>
              </p>
              <ul>
                <li>Try refreshing the page</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try again in a few minutes</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * 🎓 Learning Concepts:
 * 
 * 1. **Class Components:** Error boundaries must be class components
 * 2. **Error Handling:** Graceful error recovery in React
 * 3. **Development vs Production:** Different behavior based on environment
 * 4. **User Experience:** Providing helpful error messages and recovery options
 * 5. **Logging:** Capturing errors for debugging and monitoring
 */