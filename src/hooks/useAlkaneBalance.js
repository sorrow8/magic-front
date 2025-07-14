import { useState, useEffect } from 'react';


// Функция для конвертации hex в число
function hexToNumber(hexString) {
  // Убираем префикс 0x если есть
  const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  return parseInt(cleanHex, 16);
}

function bigIntReplacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

// Function to reverse TXID from API format to standard format
function reverseTxid(txid) {
  const bytes = [];
  for (let i = 0; i < txid.length; i += 2) {
    bytes.push(txid.substr(i, 2));
  }
  return bytes.reverse().join('');
}

/**
 * Хук для получения и обработки данных проторанов для указанного адреса
 * @param address - Биткоин-адрес для запроса
 * @param protocolTag - Идентификатор протокола
 * @param tokenFilter - Фильтр для конкретного токена (опционально)
 * @returns Объект с данными и состоянием запроса
 */
export function useAlkaneBalance(
  address, 
  protocolTag = '1',
  tokenFilter
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [processedData, setProcessedData] = useState({
    outpoints: [],
    balanceSheet: []
  });

  // Функция для нормализации hex значений для сравнения
  const normalizeHex = (value) => {
    if (typeof value === 'number') return value;
    return hexToNumber(value);
  };

  // Функция для фильтрации токенов по ID
  const filterTokensByID = (outpoints) => {
    if (!tokenFilter) {
      // Если фильтр не задан, возвращаем все токены с полной информацией об outpoint
      return outpoints.flatMap(outpoint => 
        outpoint.runes.map(rune => ({
          ...rune,
          outpoint: {
            txid: outpoint.txid, // API format (reversed)
            standardTxid: outpoint.standardTxid, // Standard format for explorers
            vout: outpoint.vout
          },
          output: {
            value: outpoint.value,
            script: outpoint.script || null
          },
          height: outpoint.height || null,
          txindex: outpoint.txindex || null
        }))
      );
    }

    const targetBlock = normalizeHex(tokenFilter.block);
    const targetTx = normalizeHex(tokenFilter.tx);

    const filteredTokensWithOutpoints = [];

    outpoints.forEach(outpoint => {
      outpoint.runes.forEach(rune => {
        if (rune.id.block === targetBlock && rune.id.tx === targetTx) {
          filteredTokensWithOutpoints.push({
            ...rune,
            outpoint: {
              txid: outpoint.txid, // API format (reversed)
              standardTxid: outpoint.standardTxid, // Standard format for explorers
              vout: outpoint.vout
            },
            output: {
              value: outpoint.value,
              script: outpoint.script || null
            },
            height: outpoint.height || null,
            txindex: outpoint.txindex || null
          });
        }
      });
    });

    return filteredTokensWithOutpoints;
  };

  // Функция для выполнения запроса
  const fetchProtorunesByAddress = async (addr, tag) => {
    console.log('🪙 Начинаем запрос токенов...');
    setLoading(true);
    setError(null);
    
    try {
      const requestBody = {
        jsonrpc: "2.0",
        method: "alkanes_protorunesbyaddress",
        params: [
          {
            address: addr,
            protocolTag: tag
          }
        ],
        id: 1
      };
      
      console.log('📤 Отправляем запрос токенов:', requestBody);
      
      const response = await fetch("http://localhost:18888", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody, bigIntReplacer)
      });
      
      console.log('📥 Получен ответ токенов:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();


      
      if (responseData.error) {
        throw new Error(responseData.error.message);
      }
      
      setData(responseData);
      console.log('✅ Данные токенов установлены в состояние');
      
      // Обработка полученных данных
      if (responseData.result) {
        const { outpoints, balanceSheet } = responseData.result;
        console.log('📊 Обрабатываем данные токенов:', { outpoints, balanceSheet });
        
        const processedOutpoints = outpoints 
          ? outpoints.map((outpoint, index) => ({
              index: index + 1,
              txid: outpoint.outpoint.txid, // API format (reversed)
              standardTxid: reverseTxid(outpoint.outpoint.txid), // Standard format
              vout: outpoint.outpoint.vout, // VOUT is already correct
              value: outpoint.output.value,
              script: outpoint.output.script,
              height: outpoint.height,
              txindex: outpoint.txindex,
              runes: outpoint.runes 
                ? outpoint.runes.map((rune, runeIndex) => {
                    const hexBalance = rune.balance;
                    const decimalBalance = hexToNumber(hexBalance);
                    const actualBalance = decimalBalance;
                    
                    return {
                      index: runeIndex + 1,
                      id: {
                        block: hexToNumber(rune.rune.id.block),
                        tx: hexToNumber(rune.rune.id.tx)
                      },
                      name: rune.rune.name,
                      spacedName: rune.rune.spacedName,
                      symbol: rune.rune.symbol,
                      balance: actualBalance.toString(),
                      divisibility: rune.rune.divisibility,
                      rawBalance: decimalBalance
                    };
                  })
                : []
            }))
          : [];
        
        setProcessedData({
          outpoints: processedOutpoints,
          balanceSheet: balanceSheet || []
        });
        
        console.log('🎯 ФИНАЛЬНЫЕ ОБРАБОТАННЫЕ ДАННЫЕ:', {
          processedOutpoints,
          balanceSheet,
          totalOutpoints: processedOutpoints.length
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error("Ошибка при запросе проторанов:", err);
    } finally {
      setLoading(false);
    }
  };

  // Запускаем запрос при изменении адреса или protocolTag
  useEffect(() => {
    const hardcodedAddress = 'bcrt1pa3s736wjyesxn8sxr3nrwetk3ccz8qta5h3flnlnlj9rmecerknq64ncj3';
    fetchProtorunesByAddress(hardcodedAddress, protocolTag);
  }, [address, protocolTag]);

  // Функция для ручного повторного запроса
  const refetch = () => {
    const hardcodedAddress = 'bcrt1pa3s736wjyesxn8sxr3nrwetk3ccz8qta5h3flnlnlj9rmecerknq64ncj3';
    fetchProtorunesByAddress(hardcodedAddress, protocolTag);
  };

  // Вычисляем отфильтрованные токены и общий баланс
  const filteredTokens = filterTokensByID(processedData.outpoints);

  // Логируем финальные результаты
  console.log('🏆 ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ ТОКЕНОВ:', {
    filteredTokens,
    filteredTokensCount: filteredTokens.length,
    hasProcessedData: processedData.outpoints.length > 0
  });

  return {
    loading,
    error,
    rawData: data,
    refetch,
    filteredTokens
  };
}

export default useAlkaneBalance;
