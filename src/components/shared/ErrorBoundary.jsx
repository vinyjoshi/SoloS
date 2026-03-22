import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log to a service like Sentry here later
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-red-400 text-2xl">⚠</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-zinc-500 text-sm mb-8 max-w-sm">
            SolOS hit an unexpected error. Your data is safe.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-2 bg-white text-black font-bold rounded-full text-sm hover:bg-zinc-200 transition-colors mb-3"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 border border-white/10 text-zinc-400 font-bold rounded-full text-sm hover:border-white/30 hover:text-white transition-colors"
          >
            Reload Page
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-8 p-4 bg-zinc-900 border border-white/5 rounded-xl text-left text-xs text-red-400 max-w-lg overflow-auto">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;