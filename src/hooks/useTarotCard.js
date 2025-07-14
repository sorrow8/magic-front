import { useState, useCallback } from 'react';

export function useTarotCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardData, setCardData] = useState(null);

  // Функция для декодирования hex в UTF-8
  const hexToUtf8 = useCallback((hex) => {
    if (hex.startsWith("0x")) hex = hex.slice(2);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  }, []);

  // Функция для выполнения симуляции
  const simulateAlkanes = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "alkanes_simulate",
        "params": [
          {
            "alkanes": [],
            "transaction": "0x",
            "block": "0x",
            "height": "20000",
            "txindex": 0,
            "target": { "block": "2", "tx": "14" },
            "inputs": ["1000"],
            "pointer": 0,
            "refundPointer": 0,
            "vout": 0,
            ...params // Позволяем переопределить параметры
          }
        ]
      };

      console.log('🚀 Отправляем запрос на сервер:', requestBody);

      const response = await fetch('http://localhost:18888', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Ответ сервера - статус:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Полученные данные:', data);

      if (data.error) {
        throw new Error(`RPC error: ${data.error.message || 'Unknown error'}`);
      }

      const result = data.result;
      
      if (!result) {
        throw new Error('No result in response');
      }

      console.log('🔍 Результат:', result);
      console.log('🔍 Поле result.data:', result.data);
      console.log('🔍 Поле result.execution.data:', result.execution?.data);

      // Декодируем hex данные - данные лежат в result.execution.data
      let decodedData = null;
      const hexData = result.execution?.data || result.data;
      
      if (hexData && hexData !== "0x") {
        try {
          decodedData = hexToUtf8(hexData);
          console.log('✅ Декодированные данные:', decodedData);
        } catch (decodeError) {
          console.warn('⚠️ Не удалось декодировать hex данные:', decodeError);
          decodedData = hexData; // Оставляем как есть если не получилось декодировать
        }
      } else {
        console.warn('⚠️ Поле data пустое или отсутствует в result.execution.data и result.data');
      }

      const cardResult = {
        status: result.status,
        gasUsed: result.gasUsed,
        execution: result.execution,
        decodedData: decodedData,
        rawData: hexData
      };

      setCardData(cardResult);
      return cardResult;

    } catch (err) {
      console.error('❌ Ошибка при симуляции:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hexToUtf8]);

  // Функция для загрузки карты таро
  const loadTarotCard = useCallback(async (cardParams) => {
    try {
      const result = await simulateAlkanes(cardParams);
      
      if (result.decodedData) {
        // Если получили JS код карты, создаем его на странице
        return result.decodedData;
      } else {
        throw new Error('No decoded data received');
      }
    } catch (err) {
      console.error('Error loading tarot card:', err);
      
      // Если сервер недоступен, предлагаем использовать mock данные
      if (err.message.includes('Failed to fetch') || err.message.includes('HTTP error')) {
        console.log('🔄 Сервер недоступен, предлагаем использовать mock данные');
        throw new Error('Server unavailable. Please start the server on localhost:18888 or use fallback mode.');
      }
      
      throw err;
    }
  }, [simulateAlkanes]);



  // Функция для выполнения JS кода карты
  const executeTarotCard = useCallback((jsCode, containerId) => {
    try {
      console.log('🔥 Выполняем JavaScript код:', jsCode.substring(0, 200) + '...');
      
      // Просто выполняем код и сразу ищем функцию
      const wrappedCode = `
        ${jsCode}
        
        // Автоматически вызываем функцию
        if (typeof createTarotCard === 'function') {
          console.log('📦 Функция createTarotCard найдена, вызываем...');
          createTarotCard('${containerId}');
          window.createTarotCard = createTarotCard; // Сохраняем в window
        } else {
          console.error('❌ Функция createTarotCard не найдена в коде');
        }
      `;
      
      eval(wrappedCode);
      console.log('✅ JavaScript код выполнен');
      
      return true;
    } catch (err) {
      console.error('❌ Ошибка при выполнении JS кода карты:', err);
      setError(`Failed to execute tarot card: ${err.message}`);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    cardData,
    simulateAlkanes,
    loadTarotCard,
    executeTarotCard,
    hexToUtf8
  };
} 