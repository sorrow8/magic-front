import { useState, useCallback } from 'react';

export function useCards() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState([]);

  // Функция для получения всех токенов адреса
  const fetchAddressTokens = useCallback(async (address) => {
    if (!address) {
      setError('No address provided');
      setLoading(false);
      return [];
    }
    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        "jsonrpc": "2.0",
        "method": "alkanes_protorunesbyaddress",
        "params": [{
          "address": address,
          "protocolTag": "1"
        }],
        "id": 1
      };

      console.log('🚀 Запрашиваем токены адреса:', address);

      const response = await fetch('https://mainnet.sandshrew.io/v2/lasereyes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Полученные данные:', data);

      if (data.error) {
        throw new Error(`RPC error: ${data.error.message || 'Unknown error'}`);
      }

      return data.result;

    } catch (err) {
      console.error('❌ Ошибка при получении токенов:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для фильтрации Magic Arbuz карт
  const filterMagicArbuzCards = useCallback((outpoints) => {
    if (!outpoints || !Array.isArray(outpoints)) {
      return [];
    }

    const magicArbuzCards = [];

    outpoints.forEach(outpoint => {
      if (outpoint.runes && Array.isArray(outpoint.runes)) {
        outpoint.runes.forEach(rune => {
          // Проверяем, что это Magic Arbuz Card
          if (rune.rune.name && rune.rune.name.startsWith('Magic Arbuz Card #')) {
            // Извлекаем номер карты из названия
            const cardNumber = rune.rune.name.replace('Magic Arbuz Card #', '');
            
            magicArbuzCards.push({
              cardNumber: parseInt(cardNumber),
              name: rune.rune.name,
              symbol: rune.rune.symbol,
              balance: rune.balance,
              block: parseInt(rune.rune.id.block, 16).toString(),  // Convert hex to decimal
              tx: parseInt(rune.rune.id.tx, 16).toString(),        // Convert hex to decimal
              outpoint: outpoint.outpoint,
              height: outpoint.height,
              txindex: outpoint.txindex
            });
          }
        });
      }
    });

    // Сортируем по номеру карты
    magicArbuzCards.sort((a, b) => a.cardNumber - b.cardNumber);

    console.log('🎴 Найдены Magic Arbuz карты:', magicArbuzCards);
    return magicArbuzCards;
  }, []);

  // Функция для загрузки всех карт
  const loadCards = useCallback(async (address) => {
    if (!address) {
      setError('No address provided');
      return [];
    }
    try {
      const result = await fetchAddressTokens(address);
      
      if (result && result.outpoints) {
        const magicArbuzCards = filterMagicArbuzCards(result.outpoints);
        setCards(magicArbuzCards);
        return magicArbuzCards;
      } else {
        throw new Error('No outpoints in response');
      }
    } catch (err) {
      console.error('Error loading cards:', err);
      throw err;
    }
  }, [fetchAddressTokens, filterMagicArbuzCards]);

  return {
    loading,
    error,
    cards,
    loadCards,
    fetchAddressTokens,
    filterMagicArbuzCards
  };
} 