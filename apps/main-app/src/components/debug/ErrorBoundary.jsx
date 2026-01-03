import React from 'react';

import { performanceMonitor } from '../../services/PerformanceMonitor';

/**
 * ErrorBoundary global para capturar errores de React y registrar métricas.
 * Muestra un mensaje amigable y registra el error mediante el monitor de rendimiento.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ errorInfo: info, error });
    try {
      performanceMonitor.logError('react_error', error, { componentStack: info.componentStack });
    } catch (e) {
      // En caso de fallo en el monitor, al menos mostramos por consola
      // console.error('Error report failed:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">Algo ha ido mal</h1>
          <p className="text-gray-600 mb-4">
            Se ha producido un error inesperado. Nuestro equipo ha sido notificado.
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <div className="text-left max-w-3xl mx-auto">
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded mb-3 text-sm">
                  <strong>Error:</strong> {String(this.state.error?.message || this.state.error)}
                </div>
              )}
              {this.state.errorInfo && (
                <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded shadow-inner overflow-x-auto max-h-64 text-xs">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
