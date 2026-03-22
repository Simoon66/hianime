import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      let parsedError: any = null;
      try {
        if (this.state.error?.message) {
          parsedError = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 p-6 rounded-xl max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            {parsedError ? (
              <div className="space-y-4 text-sm">
                <p className="text-zinc-300">
                  <span className="font-semibold text-white">Operation:</span> {parsedError.operationType}
                </p>
                <p className="text-zinc-300">
                  <span className="font-semibold text-white">Path:</span> {parsedError.path}
                </p>
                <div className="bg-black/50 p-4 rounded-lg overflow-auto">
                  <pre className="text-red-300 whitespace-pre-wrap font-mono text-xs">
                    {parsedError.error}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-black/50 p-4 rounded-lg overflow-auto">
                <pre className="text-red-300 whitespace-pre-wrap font-mono text-xs">
                  {this.state.error?.toString()}
                </pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
