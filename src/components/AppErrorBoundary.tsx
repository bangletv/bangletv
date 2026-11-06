import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class AppErrorBoundary extends React.Component<Props, State> {
  declare readonly props: Props;
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    let message = error?.message || 'An unexpected broadcast client error occurred.';
    try {
      const parsed = JSON.parse(message);
      if (parsed && parsed.error && parsed.operationType) {
        message = `Database permission or connectivity notice (${parsed.operationType} on ${parsed.path || 'collection'}): ${parsed.error}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, errorMessage: message };
  }

  public componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm space-y-4 text-center">
            <div className="w-11 h-11 rounded-xl bg-[#FFF2F2] border border-[#FFD6D9] text-[#D70015] flex items-center justify-center mx-auto">
              <AlertTriangle size={20} />
            </div>
            <h1 className="text-base font-bold text-[#1D1D1F]">
              Broadcast Session Recovery
            </h1>
            <p className="text-xs text-[#6E6E73] leading-relaxed break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Reload Bengal TV</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
