import { Component } from 'react';

// Componente ErrorBoundary para manejar errores en componentes hijos
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error en componente:', error, errorInfo);
    try {
      if (typeof window !== 'undefined') {
        window.__MYWED_LAST_ERROR = {
          message: error?.message || String(error),
          stack: error?.stack || null,
          componentStack: errorInfo?.componentStack || null,
          timestamp: Date.now(),
        };
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        const payload = JSON.stringify({
          message: error?.message || String(error),
          stack: error?.stack || null,
          componentStack: errorInfo?.componentStack || null,
          timestamp: new Date().toISOString(),
        });
        window.localStorage.setItem('mywed:lastErrorBoundary', payload);
      }
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: 16, border: '1px solid #fecaca', borderRadius: 8, background: '#fef2f2', color: '#7f1d1d' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Algo salió mal.</div>
          {error?.message && (
            <div style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {error.message}
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
