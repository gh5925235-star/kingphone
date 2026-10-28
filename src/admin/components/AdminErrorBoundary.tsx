import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

type State = { error: Error | null };

export class AdminErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Admin panel error:', error, info);
  }

  reset = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 p-6">
        <div className="card max-w-md space-y-4 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-white">Something went wrong</h1>
          <p className="text-sm text-white/60" dir="ltr">
            {this.state.error.message || 'An unexpected error occurred in the admin panel.'}
          </p>
          <button onClick={this.reset} className="btn-gold mx-auto inline-flex items-center gap-2 px-4 py-2 text-xs">
            <RotateCcw size={14} />
            <span>Reload</span>
          </button>
        </div>
      </div>
    );
  }
}
