
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Something went wrong</h1>
          <p className="text-slate-500 max-w-md mb-8 font-medium">
            We've encountered an unexpected error. Please try refreshing the page or contact support if the issue persists.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left w-full max-w-lg mb-8 overflow-auto max-h-40">
            <code className="text-xs text-rose-500 font-mono">{this.state.error?.message}</code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3.5 bg-brand-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-dark shadow-lg shadow-brand-blue/20 transition-all flex items-center gap-2"
          >
            <RefreshCw size={18} /> Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
