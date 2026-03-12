import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            background: 'linear-gradient(180deg, #0F172A 0%, #1E1B4B 100%)',
            color: 'white',
            fontFamily: "'Quicksand', -apple-system, sans-serif",
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>:(</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px', maxWidth: 320 }}>
            StudyBuddy ran into an unexpected error. Please restart the app.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              padding: '14px 32px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Quicksand', -apple-system, sans-serif",
            }}
          >
            Restart App
          </button>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '24px' }}>
            If this keeps happening, contact support at mylesdrewbiz@gmail.com
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
