import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#e2e8f0', background: '#0f1724', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>エラーが発生しました</h1>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>
            アプリケーションで予期しないエラーが発生しました。再読み込みをお試しください。
          </p>
          <pre style={{ color: '#f87171', whiteSpace: 'pre-wrap', fontSize: 13, background: '#1e293b', padding: 16, borderRadius: 8, marginBottom: 16, maxHeight: 300, overflow: 'auto' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#22d3ee', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            再読み込み
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
