import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erreur racine capturée :', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a1628',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px', color: '#fbbf24' }}>
              BS Alvéoles ERP/MES
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
              Une réinitialisation du cache de votre navigateur est recommandée pour charger la nouvelle version.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '11px',
                color: '#fca5a5',
                textAlign: 'left',
                fontFamily: 'monospace',
                marginBottom: '20px',
                maxHeight: '120px',
                overflowY: 'auto',
                wordBreak: 'break-word'
              }}>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: '#f59e0b',
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                }}
              >
                Recharger l'application
              </button>
              <button
                onClick={async () => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                    const dbs = await window.indexedDB?.databases?.();
                    if (dbs) {
                      for (const dbInfo of dbs) {
                        if (dbInfo.name) window.indexedDB.deleteDatabase(dbInfo.name);
                      }
                    }
                  } catch (_) {}
                  window.location.reload();
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer'
                }}
              >
                Vider le cache & Relancer
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }

}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </RootErrorBoundary>
  </React.StrictMode>
);

// Enregistrement du Service Worker PWA (Application Mobile & Hors-Ligne)
if ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration failed:', err);
    });
  });
}


