import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Проверяем, является ли это ошибкой отмены подключения кошелька
    if (error && error.message && 
        (error.message.includes('Approval request was cancelled') || 
         error.message.includes('OylConnectError') ||
         error.message.includes('cancelled') ||
         error.message.includes('User rejected') ||
         error.message.includes('User cancelled'))) {
      console.log('Wallet connection cancelled by user (ErrorBoundary)');
      // Не показываем ошибку пользователю
      return { hasError: false };
    }
    // Для других ошибок показываем состояние ошибки
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Проверяем, является ли это ошибкой отмены подключения кошелька
    if (error && error.message && 
        (error.message.includes('Approval request was cancelled') || 
         error.message.includes('OylConnectError') ||
         error.message.includes('cancelled') ||
         error.message.includes('User rejected') ||
         error.message.includes('User cancelled'))) {
      console.log('Wallet connection cancelled by user (componentDidCatch)');
      // Сбрасываем состояние ошибки
      this.setState({ hasError: false });
      return;
    }
    
    // Логируем другие ошибки
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Можно отобразить кастомный UI для ошибок
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#fff',
          backgroundColor: '#1a1333',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <h1>Something went wrong</h1>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '10px 20px',
              backgroundColor: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 