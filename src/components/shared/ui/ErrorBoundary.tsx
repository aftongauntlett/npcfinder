import { Component, ErrorInfo, ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/shared";
import { logError } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 *
 * Catches React render errors and displays a fallback UI.
 * Logs errors to Sentry with context.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Get userId from localStorage (AuthContext stores it there)
    let userId: string | undefined;
    try {
      const authData = localStorage.getItem("auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        userId = parsed?.user?.id;
      }
    } catch {
      // Ignore parse errors
    }

    // Log to Sentry with structured context
    logError(error, {
      component: "ErrorBoundary",
      action: "render_error",
      userId,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      const {
        fallbackTitle = "Something went wrong",
        fallbackMessage = "An unexpected error occurred. Please try again or return to the dashboard.",
      } = this.props;

      return (
        <div
          className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-8">
            {/* Error Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4">
                <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
              {fallbackTitle}
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
              {fallbackMessage}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button
                onClick={this.handleReset}
                variant="primary"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </Button>
              <Link to="/app">
                <Button variant="secondary" icon={<Home className="w-4 h-4" />}>
                  Go to Dashboard
                </Button>
              </Link>
            </div>

            {/* Dev Mode: Error Details */}
            {isDev && this.state.error && (
              <details className="mt-6 border border-gray-300 dark:border-gray-600 rounded-lg">
                <summary className="cursor-pointer px-4 py-3 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
                  Error Details (Dev Mode)
                </summary>
                <div className="p-4 bg-gray-900 text-gray-100 rounded-b-lg overflow-auto">
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-red-400 mb-1">
                      Error Message:
                    </p>
                    <p className="text-sm font-mono">
                      {this.state.error.message}
                    </p>
                  </div>
                  {this.state.error.stack && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-red-400 mb-1">
                        Stack Trace:
                      </p>
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-semibold text-red-400 mb-1">
                        Component Stack:
                      </p>
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
