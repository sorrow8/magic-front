import './App.css';
import { Routes, Route } from 'react-router-dom';
import { useLaserEyes } from '@omnisat/lasereyes-react';
import { OYL } from '@omnisat/lasereyes-core';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, GlobalStyles } from '@mui/material';
import { useEffect, useLayoutEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Send from './pages/Send';
import Cards from './pages/Cards';
import ErrorBoundary from './components/ErrorBoundary';
import tarotTheme from './tarotTheme';

// Немедленный глобальный перехват ошибок кошелька
const suppressWalletErrorsGlobally = () => {
  const originalOnError = window.onerror;
  const originalOnUnhandledRejection = window.onunhandledrejection;
  
  window.onerror = function(message, source, lineno, colno, error) {
    if (message && (message.includes('Approval request was cancelled') || 
                   message.includes('OylConnectError') ||
                   message.includes('cancelled') ||
                   message.includes('User rejected') ||
                   message.includes('User cancelled'))) {
      console.log('Wallet connection cancelled by user (global onerror)');
      return true; // Предотвращаем показ ошибки
    }
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };
  
  window.onunhandledrejection = function(event) {
    const errorMessage = event.reason?.message || event.reason?.toString() || '';
    if (errorMessage.includes('Approval request was cancelled') || 
        errorMessage.includes('OylConnectError') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('User cancelled')) {
      console.log('Wallet connection cancelled by user (global onunhandledrejection)');
      event.preventDefault();
      return;
    }
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection.call(this, event);
    }
  };
};

// Выполняем немедленно
suppressWalletErrorsGlobally();

const globalStyles = <GlobalStyles styles={{
  html: {
    background: '#fdf6f9',
  },
  body: {
    background: '#fdf6f9',
    minHeight: '100vh',
  },
  // Скрываем скроллбары на всех элементах но сохраняем функциональность
  '*::-webkit-scrollbar': {
    display: 'none', // Chrome, Safari, Opera
  },
  '*': {
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE/Edge
  },

  '.section-title': {
    fontFamily: 'Crimson Text, Georgia, serif',
    fontWeight: 700,
    fontSize: '1.5rem',
    letterSpacing: '0.12em',
    background: 'linear-gradient(90deg, #ff6b9d 0%, #ff8e53 60%, #ffd93d 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 2px 8px rgba(255,107,157,0.10)',
    marginBottom: 12,
    marginTop: 0,
  },
  '[class*="arbuz-card-"]:hover .arbuz-logo': {
    opacity: '1 !important',
  },
}} />;

function App() {
  const { connected, address, connect, disconnect, network } = useLaserEyes();

  // Немедленная глобальная обработка ошибок (до useEffect)
  useLayoutEffect(() => {
    // Перехватываем все возможные ошибки немедленно
    const suppressWalletErrors = (event) => {
      const errorMessage = event.reason?.message || event.reason?.toString() || event.error?.message || event.message || '';
      if (errorMessage.includes('Approval request was cancelled') || 
          errorMessage.includes('OylConnectError') ||
          errorMessage.includes('cancelled') ||
          errorMessage.includes('User rejected') ||
          errorMessage.includes('User cancelled')) {
        console.log('Wallet connection cancelled by user (immediate suppression)');
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    // Устанавливаем обработчики с максимальным приоритетом
    window.addEventListener('unhandledrejection', suppressWalletErrors, { capture: true, passive: false });
    window.addEventListener('error', suppressWalletErrors, { capture: true, passive: false });
    document.addEventListener('unhandledrejection', suppressWalletErrors, { capture: true, passive: false });
    document.addEventListener('error', suppressWalletErrors, { capture: true, passive: false });

    return () => {
      window.removeEventListener('unhandledrejection', suppressWalletErrors, { capture: true });
      window.removeEventListener('error', suppressWalletErrors, { capture: true });
      document.removeEventListener('unhandledrejection', suppressWalletErrors, { capture: true });
      document.removeEventListener('error', suppressWalletErrors, { capture: true });
    };
  }, []);

  // Глобальная обработка ошибок отмены подключения кошелька
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      const errorMessage = event.reason?.message || event.reason?.toString() || '';
      if (errorMessage.includes('Approval request was cancelled') || 
          errorMessage.includes('OylConnectError') ||
          errorMessage.includes('cancelled') ||
          errorMessage.includes('User rejected') ||
          errorMessage.includes('User cancelled') ||
          event.reason?.name === 'OylConnectError') {
        console.log('Wallet connection cancelled by user (unhandledrejection)');
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    const handleError = (event) => {
      const errorMessage = event.error?.message || event.message || '';
      if (errorMessage.includes('Approval request was cancelled') || 
          errorMessage.includes('OylConnectError') ||
          errorMessage.includes('cancelled') ||
          errorMessage.includes('User rejected') ||
          errorMessage.includes('User cancelled') ||
          event.error?.name === 'OylConnectError') {
        console.log('Wallet connection cancelled by user (error)');
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    // Перехватываем все типы ошибок с максимальным приоритетом - добавляем множественные обработчики
    window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true, passive: false });
    window.addEventListener('error', handleError, { capture: true, passive: false });
    
    // Дополнительные обработчики для разных фаз
    document.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true, passive: false });
    document.addEventListener('error', handleError, { capture: true, passive: false });
    
    // Дополнительно перехватываем ошибки React
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorStr = args.join(' ');
      if (errorStr.includes('Approval request was cancelled') || 
          errorStr.includes('OylConnectError') ||
          errorStr.includes('cancelled') ||
          errorStr.includes('User rejected') ||
          errorStr.includes('User cancelled') ||
          errorStr.includes('The above error occurred') ||
          errorStr.includes('Uncaught runtime errors')) {
        console.log('Wallet connection cancelled by user (console.error intercepted)');
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Перехватываем React DevTools ошибки
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      const errorStr = args.join(' ');
      if (errorStr.includes('Approval request was cancelled') || 
          errorStr.includes('OylConnectError') ||
          errorStr.includes('cancelled') ||
          errorStr.includes('User rejected') ||
          errorStr.includes('User cancelled')) {
        console.log('Wallet connection cancelled by user (console.warn intercepted)');
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
      window.removeEventListener('error', handleError, { capture: true });
      document.removeEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
      document.removeEventListener('error', handleError, { capture: true });
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  const handleConnect = async () => {
    try {
      await connect(OYL);
    } catch (error) {
      // Проверяем, является ли это ошибкой отмены подключения
      if (error.message && 
          (error.message.includes('Approval request was cancelled') || 
           error.message.includes('OylConnectError') ||
           error.message.includes('cancelled') ||
           error.message.includes('User rejected') ||
           error.message.includes('User cancelled'))) {
        console.log('Wallet connection cancelled by user');
        return; // Не показываем ошибку пользователю
      }
      console.error('Error connecting wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider theme={tarotTheme}>
        <CssBaseline />
        {globalStyles}
        <div className="App">
        <header className="App-header">
          <h1>MAGIC ARBUZ</h1>
          {!connected ? (
            <button 
              onClick={handleConnect}
              className="wallet-launch-btn"
            >
              Launch Wallet
            </button>
          ) : (
            <div className="wallet-info">
              <div className="wallet-address">
                {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'No address'}
              </div>
              <button 
                onClick={handleDisconnect}
                className="wallet-connected-btn"
                style={{ position: 'relative' }}
              >
                <span>Connected</span>
                {network && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '8px',
                    padding: '1px 4px',
                    backgroundColor: '#ff6b9d',
                    color: 'white',
                    borderRadius: '6px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    border: '1px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}>
                    {network}
                  </div>
                )}
              </button>
            </div>
          )}
        </header>
        {connected && (
          <div style={{ 
            position: 'fixed', 
            left: 'max(24px, calc(50% - 600px - 220px))', 
            top: 110, 
            width: 200, 
            zIndex: 1000 
          }}>
            <Navigation />
          </div>
        )}
        <Container maxWidth="lg" sx={{ mt: 2, overflow: 'visible' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/send" element={<Send />} />
            <Route path="/cards" element={<Cards />} />
          </Routes>
        </Container>
      </div>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
