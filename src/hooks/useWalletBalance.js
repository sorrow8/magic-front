import { useState, useEffect, useCallback } from 'react'
import { useLaserEyes } from '@omnisat/lasereyes-react'

export function useWalletBalance() {
  const { address, paymentAddress, connected, network } = useLaserEyes()
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Логируем доступные адреса только когда кошелек полностью инициализирован
  useEffect(() => {
    if (connected && network && (address || paymentAddress)) {
      console.log('🔍 DEBUG - LaserEyes addresses:', {
        address, // taproot адрес
        paymentAddress, // native segwit адрес
        connected,
        network
      });
      console.log('🌐 Current network:', network);
    }
  }, [address, paymentAddress, connected, network]);

  const fetchBalance = useCallback(async () => {
    // Проверяем что кошелек полностью инициализирован
    if (!connected || !network || !paymentAddress) {
      console.log('⏳ Wallet not fully initialized yet:', { connected, network, hasPaymentAddress: !!paymentAddress });
      return
    }
    
    const addressToUse = paymentAddress;

    setLoading(true)
    setError(null)

    try {
      // Используем API в зависимости от сети кошелька
      const networkName = network || 'mainnet';
      const apiUrl = networkName === 'signet' 
        ? 'https://signet.sandshrew.io/v2/lasereyes'
        : 'https://mainnet.sandshrew.io/v2/lasereyes';
      
      console.log('🌐 Using API URL:', apiUrl);
      console.log('💰 Checking BTC balance for address:', addressToUse);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          method: 'esplora_address',
          params: [addressToUse],
          jsonrpc: '2.0',
          id: Date.now(),
        }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      // console.log('📊 BTC balance response:', data);
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      // Вычисляем баланс из UTXO данных
      const result = data.result
      const confirmedBalance = result && result.chain_stats ? 
        (result.chain_stats.funded_txo_sum - result.chain_stats.spent_txo_sum) : 0
      const unconfirmedBalance = result && result.mempool_stats ? 
        (result.mempool_stats.funded_txo_sum - result.mempool_stats.spent_txo_sum) : 0
      
      // console.log('💰 Calculated balances:', {
      //   confirmedBalance,
      //   unconfirmedBalance,
      //   total: confirmedBalance + unconfirmedBalance,
      //   address: addressToUse
      // });
      
      setBalance({
        confirmed: confirmedBalance,
        unconfirmed: unconfirmedBalance
      })
    } catch (err) {
      console.error('Error fetching wallet balance:', err)
      // Показываем пользователю понятную ошибку
      if (err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
        setError('Network error - CORS blocked. Try using a different network or check your connection.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [connected, paymentAddress, network])

  useEffect(() => {
    // Выполняем запрос только если кошелек полностью инициализирован
    if (connected && network && paymentAddress) {
      const timer = setTimeout(() => {
        fetchBalance()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [paymentAddress, connected, network, fetchBalance])

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance
  }
}

export function useWalletTokens() {
  const { address, connected, network } = useLaserEyes()
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasArbuz, setHasArbuz] = useState(false)

  const fetchTokens = useCallback(async () => {
    // Проверяем что кошелек полностью инициализирован
    if (!connected || !network || !address) {
      console.log('⏳ Wallet not fully initialized yet:', { connected, network, hasAddress: !!address });
      setTokens([])
      setHasArbuz(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Используем API в зависимости от сети кошелька
      const networkName = network || 'mainnet';
      const apiUrl = networkName === 'signet' 
        ? 'https://signet.sandshrew.io/v2/lasereyes'
        : 'https://mainnet.sandshrew.io/v2/lasereyes';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'alkanes_protorunesbyaddress',
          params: [{ address, protocolTag: '1' }],
          jsonrpc: '2.0',
          id: Date.now(),
        }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      // Получаем токены из outpoints
      const allTokens = data.result?.outpoints || []
      
      // Проверяем наличие ARBUZ руны (block: 2, tx: 879 или 25349)
      const arbuzToken = allTokens.find(token => {
        if (token.runes && Array.isArray(token.runes)) {
          return token.runes.some(rune => 
            rune.rune && 
            rune.rune.name === 'ARBUZ' &&
            rune.rune.id && 
            rune.rune.id.block === '0x2' && 
            (rune.rune.id.tx === '0x36f' || rune.rune.id.tx === '0x6305') // 879 или 25349
          )
        }
        return false
      })
      setHasArbuz(!!arbuzToken)
      
      // Фильтруем только ARBUZ токены для отображения (только ID 2:879 и 2:25349)
      const arbuzTokens = allTokens.filter(token => {
        if (token.runes && Array.isArray(token.runes)) {
          return token.runes.some(rune => 
            rune.rune && 
            rune.rune.name === 'ARBUZ' &&
            rune.rune.id && 
            rune.rune.id.block === '0x2' && 
            (rune.rune.id.tx === '0x36f' || rune.rune.id.tx === '0x6305') // 879 или 25349
          )
        }
        return false
      })
      
      setTokens(arbuzTokens)
    } catch (err) {
      console.error('Error fetching wallet tokens:', err)
      // Не показываем ошибки пользователю, просто логируем их
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [connected, address, network])

  useEffect(() => {
    // Выполняем запрос только если кошелек полностью инициализирован
    if (connected && network && address) {
      const timer = setTimeout(() => {
        fetchTokens()
      }, 600)
      
      return () => clearTimeout(timer)
    }
  }, [address, connected, network, fetchTokens])

  return {
    tokens,
    loading,
    error,
    hasArbuz,
    refetch: fetchTokens
  }
} 

export function useAllTokens() {
  const { address, connected, network } = useLaserEyes()
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAllTokens = useCallback(async () => {
    // Проверяем что кошелек полностью инициализирован
    if (!connected || !network || !address) {
      console.log('⏳ Wallet not fully initialized yet:', { connected, network, hasAddress: !!address });
      setTokens([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Используем API в зависимости от сети кошелька
      const networkName = network || 'mainnet';
      const apiUrl = networkName === 'signet' 
        ? 'https://signet.sandshrew.io/v2/lasereyes'
        : 'https://mainnet.sandshrew.io/v2/lasereyes';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'alkanes_protorunesbyaddress',
          params: [{ address, protocolTag: '1' }],
          jsonrpc: '2.0',
          id: Date.now(),
        }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      // Получаем все токены из outpoints
      const allTokens = data.result?.outpoints || []
      
      // Фильтруем только токены с рунами (алканы)
      const alkaneTokens = allTokens.filter(token => 
        token.runes && Array.isArray(token.runes) && token.runes.length > 0
      )
      
      setTokens(alkaneTokens)
    } catch (err) {
      console.error('Error fetching all tokens:', err)
      // Не показываем ошибки пользователю, просто логируем их
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [connected, address, network])

  useEffect(() => {
    // Выполняем запрос только если кошелек полностью инициализирован
    if (connected && network && address) {
      const timer = setTimeout(() => {
        fetchAllTokens()
      }, 700)
      
      return () => clearTimeout(timer)
    }
  }, [address, connected, network, fetchAllTokens])

  return {
    tokens,
    loading,
    error,
    refetch: fetchAllTokens
  }
} 