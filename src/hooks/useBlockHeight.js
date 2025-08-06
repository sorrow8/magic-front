import { useState, useEffect } from 'react';

const MINT_START_BLOCK = 907205;
const MINT_INTERVAL = 144; // каждые 144 блока

export function useBlockHeight() {
  const [blockHeight, setBlockHeight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlockHeight = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://mainnet.sandshrew.io/v2/lasereyes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'esplora_blocks:tip:height',
          params: []
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch block height');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'API error');
      }

      setBlockHeight(data.result);
    } catch (err) {
      console.error('Error fetching block height:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Вычисляем информацию о следующем минте
  const getMintInfo = () => {
    if (!blockHeight) return null;

    const blocksSinceMintStart = blockHeight - MINT_START_BLOCK;
    const currentMintCycle = Math.floor(blocksSinceMintStart / MINT_INTERVAL);
    const nextMintBlock = MINT_START_BLOCK + (currentMintCycle + 1) * MINT_INTERVAL;
    
    // Транзакция попадёт в следующий блок (blockHeight + 1)
    // Поэтому считаем от следующего блока до минт-блока
    const nextBlockHeight = blockHeight + 1;
    const blocksUntilNextMint = nextMintBlock - nextBlockHeight;
    
    // Примерное время (10 минут на блок)
    const minutesUntilNextMint = Math.max(0, blocksUntilNextMint) * 10;
    const hoursUntilNextMint = Math.floor(minutesUntilNextMint / 60);
    const remainingMinutes = minutesUntilNextMint % 60;

    return {
      currentBlock: blockHeight,
      nextMintBlock,
      blocksUntilNextMint: Math.max(0, blocksUntilNextMint),
      hoursUntilNextMint,
      minutesUntilNextMint: remainingMinutes,
      canMintNow: blocksUntilNextMint <= 0,
      mintCycle: currentMintCycle + 1,
      transactionWillBeInBlock: nextBlockHeight
    };
  };

  useEffect(() => {
    fetchBlockHeight();
    
    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchBlockHeight, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    blockHeight,
    loading,
    error,
    mintInfo: getMintInfo(),
    refetch: fetchBlockHeight
  };
} 