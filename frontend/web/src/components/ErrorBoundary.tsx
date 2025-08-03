/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ error?: Error }> = ({ error }) => {
  const { t } = useTranslation();

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="error-boundary">
      <div className="error-boundary__container">
        <div className="error-boundary__icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        
        <h1 className="error-boundary__title">
          {t('errors:unexpected_error')}
        </h1>
        
        <p className="error-boundary__message">
          {t('errors:error_description')}
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="error-boundary__details">
            <summary>{t('errors:error_details')}</summary>
            <pre className="error-boundary__stack">
              {error.toString()}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="error-boundary__actions">
          <button
            className="error-boundary__button error-boundary__button--primary"
            onClick={handleReload}
          >
            {t('errors:reload_page')}
          </button>
          
          <button
            className="error-boundary__button error-boundary__button--secondary"
            onClick={() => window.history.back()}
          >
            {t('errors:go_back')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
