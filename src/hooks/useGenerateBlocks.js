import { useState } from 'react';
import axios from 'axios';

// Константы из OYL SDK
const RANDOM_ADDRESS = 'bcrt1qz3y37epk6hqlul2pt09hrwgj0s09u5g6kzrkm2';

export function useGenerateBlocks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generateBlocks = async (count = 1, address = RANDOM_ADDRESS) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`🎯 Generating ${count} block(s) to address ${address}...`);

      // Используем точно такой же RPC вызов как в OYL SDK
      const response = await axios.post('http://localhost:18888', {
        jsonrpc: "2.0",
        id: 1,
        method: "generatetoaddress",
        params: [count, address]
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      const blockHashes = response.data.result;
      console.log(`✅ Generated ${count} block(s):`, blockHashes);

      const resultData = {
        count,
        blockHashes,
        address,
        timestamp: new Date().toISOString()
      };

      setResult(resultData);
      return resultData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate blocks';
      setError(errorMessage);
      console.error(`❌ Block generation error: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateBlocks,
    loading,
    error,
    result
  };
}

export default useGenerateBlocks; 