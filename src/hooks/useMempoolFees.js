import { useEffect, useState } from 'react';

// mempool.space API: https://mempool.space/api/v1/fees/recommended
export function useMempoolFees() {
  const [fees, setFees] = useState({ fast: null, normal: null, slow: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://mempool.space/api/v1/fees/recommended');
      if (!response.ok) throw new Error('Failed to fetch mempool fees');
      const data = await response.json();
      setFees({
        fast: data.fastestFee,
        normal: data.halfHourFee,
        slow: data.hourFee,
      });
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
    // Обновлять каждые 60 секунд
    const interval = setInterval(fetchFees, 60000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return { fees, loading, error, refetch: fetchFees };
} 