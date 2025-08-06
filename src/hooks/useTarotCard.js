import { useState, useCallback } from 'react';

export function useTarotCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardData, setCardData] = useState(null);

  // Function to decode hex to UTF-8
  const hexToUtf8 = useCallback((hex) => {
    if (hex.startsWith("0x")) hex = hex.slice(2);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  }, []);

  // Function to perform simulation
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
            "pointer": 0,
            "refundPointer": 0,
            "vout": 0,
            ...params // Allow overriding parameters
          }
        ]
      };

      console.log('🚀 Sending request to server with parameters:', params);
      console.log('🚀 Full request:', requestBody);

      const response = await fetch('https://mainnet.sandshrew.io/v2/lasereyes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Server response - status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Received data:', data);

      if (data.error) {
        throw new Error(`RPC error: ${data.error.message || 'Unknown error'}`);
      }

      const result = data.result;
      
      if (!result) {
        throw new Error('No result in response');
      }

          console.log('🔍 Result:', result);
    console.log('🔍 Field result.data:', result.data);
    console.log('🔍 Field result.execution.data:', result.execution?.data);

      // Decode hex data - data is in result.execution.data
      let decodedData = null;
      const hexData = result.execution?.data || result.data;
      
      if (hexData && hexData !== "0x") {
        try {
          decodedData = hexToUtf8(hexData);
          console.log('✅ Decoded data:', decodedData);
        } catch (decodeError) {
          console.warn('⚠️ Failed to decode hex data:', decodeError);
          decodedData = hexData; // Leave as is if decoding failed
        }
      } else {
        console.warn('⚠️ Field data is empty or missing in result.execution.data and result.data');
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
      console.error('❌ Error during simulation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hexToUtf8]);

  // Function to load tarot card
  const loadTarotCard = useCallback(async (cardParams) => {
    try {
      const result = await simulateAlkanes(cardParams);
      
      if (result.decodedData) {
        // If we received JS code for the card, create it on the page
        return result.decodedData;
      } else {
        throw new Error('No decoded data received');
      }
    } catch (err) {
      console.error('Error loading tarot card:', err);
      
      // If server is unavailable, suggest using mock data
      if (err.message.includes('Failed to fetch') || err.message.includes('HTTP error')) {
                  console.log('🔄 Server unavailable, suggesting to use mock data');
        throw new Error('Server unavailable. Please start the server on localhost:18888 or use fallback mode.');
      }
      
      throw err;
    }
  }, [simulateAlkanes]);



  // Function to execute card JS code
  const executeTarotCard = useCallback((jsCode, containerId) => {
    try {
      console.log('🔥 Executing JavaScript code:', jsCode.substring(0, 200) + '...');
      
      // Simply execute the code and immediately look for the function
      const wrappedCode = `
        ${jsCode}
        
        // Automatically call the function
        if (typeof createTarotCard === 'function') {
          console.log('📦 Function createTarotCard found, calling...');
          createTarotCard('${containerId}');
                      window.createTarotCard = createTarotCard; // Save to window
                  } else {
            console.error('❌ Function createTarotCard not found in code');
        }
      `;
      
      // eslint-disable-next-line no-eval
      eval(wrappedCode);
              console.log('✅ JavaScript code executed');
      
      return true;
    } catch (err) {
      console.error('❌ Error executing card JS code:', err);
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