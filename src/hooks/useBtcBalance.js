import { useState, useEffect } from 'react';

/**
 * Хук для получения BTC баланса через Esplora API
 * @returns Объект с данными баланса и состоянием запроса
 */
export function useBtcBalance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Захардкоженный адрес
  const hardcodedAddress = 'bcrt1qghccwgtzly6pfewp05z92lmc0m7wu9sva467ch';

  // Функция для выполнения запроса
  const fetchBtcBalance = async () => {
    console.log('🔄 Начинаем запрос BTC баланса...');
    setLoading(true);
    setError(null);
    
    try {
      const requestBody = {
        jsonrpc: "2.0",
        id: 1,
        method: "esplora_address",
        params: [hardcodedAddress]
      };
      
      console.log('📤 Отправляем запрос:', requestBody);
      
      const response = await fetch("http://localhost:18888", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📥 Получен ответ:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('📊 Данные ответа:', responseData);
      
      if (responseData.error) {
        throw new Error(responseData.error.message);
      }
      
      setData(responseData);
      console.log('✅ Данные успешно установлены');
      
      // Логируем данные сразу после установки
      const newConfirmedBalance = responseData.result ? 
        (responseData.result.chain_stats.funded_txo_sum - responseData.result.chain_stats.spent_txo_sum) : 0;
      const newUnconfirmedBalance = responseData.result ? 
        (responseData.result.mempool_stats.funded_txo_sum - responseData.result.mempool_stats.spent_txo_sum) : 0;
      const newTotalBalance = newConfirmedBalance + newUnconfirmedBalance;
      const newBalanceBTC = newTotalBalance / 100000000;
      
      console.log('🔥 НОВЫЕ ВЫЧИСЛЕННЫЕ БАЛАНСЫ:', {
        newConfirmedBalance,
        newUnconfirmedBalance, 
        newTotalBalance,
        newBalanceBTC
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error("❌ Ошибка при запросе BTC баланса:", err);
    } finally {
      setLoading(false);
      console.log('🏁 Запрос завершен');
    }
  };

  // Запускаем запрос при загрузке компонента
  useEffect(() => {
    fetchBtcBalance();
  }, []);

  // Логируем когда data изменяется
  useEffect(() => {
    console.log('📝 Data изменились:', data);
  }, [data]);

  // Функция для ручного повторного запроса
  const refetch = () => {
    fetchBtcBalance();
  };

  // Вычисляем балансы из данных ответа
  const confirmedBalance = data?.result ? 
    (data.result.chain_stats.funded_txo_sum - data.result.chain_stats.spent_txo_sum) : 0;
  
  const unconfirmedBalance = data?.result ? 
    (data.result.mempool_stats.funded_txo_sum - data.result.mempool_stats.spent_txo_sum) : 0;
  
  const totalBalance = confirmedBalance + unconfirmedBalance;
  const balanceBTC = totalBalance / 100000000; // Конвертация сатоши в BTC

  // Логирование вычисленных балансов
  console.log('💰 Вычисленные балансы:', {
    confirmedBalance,
    unconfirmedBalance,
    totalBalance,
    balanceBTC,
    hasData: !!data?.result
  });

  return {
    loading,
    error,
    rawData: data,
    balance: totalBalance,
    balanceBTC,
    confirmedBalance,
    unconfirmedBalance,
    refetch
  };
}

export default useBtcBalance;
