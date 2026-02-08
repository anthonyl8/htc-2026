import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Map error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-background-dark text-gray-300 p-6 gap-4">
          <span className="material-symbols-outlined text-4xl text-primary">map</span>
          <p className="font-semibold text-white">Map couldn’t load</p>
          <p className="text-sm text-center max-w-md">
            Check that <code className="bg-[#28392c] px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in <code className="bg-[#28392c] px-1 rounded">.env.local</code> is a valid key and that Maps JavaScript API is enabled in Google Cloud.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-colors text-sm font-medium"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
