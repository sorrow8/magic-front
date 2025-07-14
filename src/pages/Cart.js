import React, { useState, useEffect } from 'react';
import { useTarotCard } from '../hooks/useTarotCard';

function Cart() {
  const { loading, error, loadTarotCard, executeTarotCard } = useTarotCard();
  const [cardLoaded, setCardLoaded] = useState(false);

  // Загружаем карту с сервера
  useEffect(() => {
    const loadCard = async () => {
      try {
        console.log('🚀 Начинаем загрузку карты...');
        const jsCode = await loadTarotCard();
        
        if (jsCode) {
          console.log('✅ JS код получен, длина:', jsCode.length);
          
          // Выполняем JavaScript код
          const success = executeTarotCard(jsCode, 'dynamic-tarot-card');
          
          if (success) {
            setCardLoaded(true);
            console.log('✅ Карта успешно загружена!');
          } else {
            console.error('❌ Не удалось выполнить JS код');
            // Пробуем еще раз через секунду
            setTimeout(() => loadCard(), 1000);
          }
        } else {
          console.error('❌ Нет JS кода, пробуем еще раз...');
          setTimeout(() => loadCard(), 1000);
        }
      } catch (err) {
        console.error('❌ Ошибка загрузки, пробуем еще раз через секунду:', err);
        setTimeout(() => loadCard(), 1000);
      }
    };

    loadCard();
  }, [loadTarotCard, executeTarotCard]);

  return (
    <div style={{ 
      background: '#0f172a',
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '60px'
      }}>
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: '700',
          color: '#fff',
          marginBottom: '12px',
          textShadow: '0 0 20px rgba(255,255,255,0.5)'
        }}>
          🔮 DYNAMIC TAROT CARD 🔮
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: '#64748b',
          margin: 0
        }}>
          {loading ? 'Загружаем карту с сервера...' : 
           cardLoaded ? 'Карта загружена с сервера динамически!' :
           'Получаем карту таро через API...'}
        </p>

        {/* Error Display */}
        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px',
            color: '#fca5a5',
            fontSize: '14px'
          }}>
            ⚠️ Ошибка: {error}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && !cardLoaded && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '500px',
          color: '#64748b'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'spin 2s linear infinite'
          }}>
            🔮
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '500'
          }}>
            Загружаем карту таро с сервера...
          </div>
        </div>
      )}

      {/* Dynamic Card Container - простой div без ref */}
      <div style={{ 
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '600px'
      }}>
        <div id="dynamic-tarot-card"></div>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Cart; 