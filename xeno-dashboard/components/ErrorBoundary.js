'use client';
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
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          border: '1px solid #ef4444',
          borderRadius: '0.5rem',
          backgroundColor: '#fef2f2',
          color: '#dc2626'
        }}>
          <h2>Something went wrong</h2>
          <p>We&apos;re sorry, but something unexpected happened.</p>
          <details>
            <summary>Error details</summary>
            <pre style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              backgroundColor: '#fca5a5', 
              borderRadius: '0.25rem',
              textAlign: 'left',
              overflow: 'auto'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;