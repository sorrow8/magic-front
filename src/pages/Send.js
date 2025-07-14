import { useState } from 'react';
import { useResolve } from '../hooks/useResolve';
import { useResolve2 } from '../hooks/useResolve2';
import { useAlkaneBalance } from '../hooks/useAlkaneBalance';

function Send() {
  const { resolveContract, loading, error, result } = useResolve();
  const { 
    resolveContract2, 
    loading: loading2, 
    error: error2, 
    result: result2 
  } = useResolve2();
  const { filteredTokens, loading: balanceLoading } = useAlkaneBalance();
  
  const [selectedTokenId, setSelectedTokenId] = useState(null);

  // Helper функция для получения уникального ID токена (включая ID руны для различия токенов в одном UTXO)
  const getTokenId = (token) => `${token.outpoint.standardTxid}:${token.outpoint.vout}:${token.id.block}:${token.id.tx}`;

  // Находим выбранный токен по ID
  const selectedToken = filteredTokens.find(token => selectedTokenId === getTokenId(token));

  const handleClaim = async () => {
    try {
      const tokenAmount = selectedToken ? parseFloat(selectedToken.balance) : 0;
      console.log(`🚀 CLAIM: Sending ${tokenAmount} tokens`);
      
      let manualUtxo = null;
      if (selectedToken) {
        manualUtxo = {
          txId: selectedToken.outpoint.standardTxid,
          outputIndex: selectedToken.outpoint.vout
        };
      }
      
      // Вызываем resolve опкод без параметра UP/DOWN
      await resolveContract(2, 24, 22, tokenAmount, manualUtxo);
    } catch (err) {
      console.error('Claim failed:', err);
    }
  };

  const handleClaim2 = async () => {
    try {
      const tokenAmount = selectedToken ? parseFloat(selectedToken.balance) : 0;
      console.log(`🟡 CLAIM2: Sending ${tokenAmount} tokens`);
      
      let manualUtxo = null;
      if (selectedToken) {
        manualUtxo = {
          txId: selectedToken.outpoint.standardTxid,
          outputIndex: selectedToken.outpoint.vout
        };
      }
      
      // Вызываем resolve2 опкод с другими параметрами
      await resolveContract2(2, 8, 20, tokenAmount, manualUtxo);
    } catch (err) {
      console.error('Claim2 failed:', err);
    }
  };

  return (
    <div className="page">
      <h2>Resolve Contract</h2>
      
      {/* Список всех токенов */}
      <div style={{ 
        background: '#fff', 
        border: '1px solid #e1e4e8',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '16px',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          🪙 Available Tokens
        </h3>
        
        {balanceLoading ? (
          <div style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
            Loading tokens...
          </div>
        ) : filteredTokens.length === 0 ? (
          <div style={{ padding: '12px', fontSize: '14px', color: '#ef4444' }}>
            No tokens found
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {filteredTokens.map((token, index) => (
              <div 
                key={index} 
                onClick={() => {
                  const tokenId = getTokenId(token);
                  setSelectedTokenId(selectedTokenId === tokenId ? null : tokenId);
                }}
                style={{
                  background: selectedTokenId === getTokenId(token) ? '#dcfce7' : '#f9fafb',
                  border: selectedTokenId === getTokenId(token) ? '4px solid #22c55e' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {selectedTokenId === getTokenId(token) && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    color: '#10b981',
                    fontSize: '18px'
                  }}>
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div>
                    <span style={{ 
                      fontWeight: '600', 
                      fontSize: '16px',
                      color: '#1f2937'
                    }}>
                      {token.symbol || token.name}
                    </span>
                    <span style={{ 
                      marginLeft: '8px',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      ({token.spacedName})
                    </span>
                  </div>
                  <span style={{ 
                    fontWeight: '700',
                    fontSize: '18px',
                    color: selectedTokenId === getTokenId(token) ? '#166534' : '#10b981'
                  }}>
                    {token.balance}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  lineHeight: '1.4'
                }}>
                  <div>ID: {token.id.block}:{token.id.tx}</div>
                  <div>UTXO: {token.outpoint.standardTxid.slice(0, 16)}...:{token.outpoint.vout}</div>
                  <div>Value: {token.output.value} sats</div>
                  {token.height && <div>Height: {token.height}</div>}
                </div>
                
                {selectedTokenId === getTokenId(token) && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: '#dcfce7',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#166534',
                    fontWeight: '500'
                  }}>
                    💫 Click again to deselect • Full UTXO: {token.outpoint.standardTxid}:{token.outpoint.vout}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Две кнопки Claim */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <button 
          onClick={handleClaim}
          disabled={loading || loading2}
          className="button button-primary"
          style={{
            background: '#8b5cf6',
            borderColor: '#8b5cf6',
            padding: '24px 48px',
            fontSize: '18px',
            fontWeight: '700',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            opacity: (loading || loading2) ? 0.6 : 1,
            minWidth: '200px'
          }}
        >
          <span style={{ fontSize: '32px' }}>🎯</span>
          <span>CLAIM</span>
          <span style={{ fontSize: '14px', opacity: 0.8 }}>
            {selectedToken ? `Send ${selectedToken.balance} ${selectedToken.symbol}` : 'Resolve contract'}
          </span>
        </button>

        <button 
          onClick={handleClaim2}
          disabled={loading || loading2}
          className="button button-primary"
          style={{
            background: '#f59e0b',
            borderColor: '#f59e0b',
            padding: '24px 48px',
            fontSize: '18px',
            fontWeight: '700',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            opacity: (loading || loading2) ? 0.6 : 1,
            minWidth: '200px'
          }}
        >
          <span style={{ fontSize: '32px' }}>🟡</span>
          <span>CLAIM2</span>
          <span style={{ fontSize: '14px', opacity: 0.8 }}>
            {selectedToken ? `Send ${selectedToken.balance} ${selectedToken.symbol}` : 'Resolve2 contract'}
          </span>
        </button>
      </div>

      {/* Loading статусы */}
      {(loading || loading2) && (
        <div className="status loading">
          {loading && loading2 ? 'Processing both contracts...' : 
           loading ? 'Resolving contract...' : 
           'Resolving contract2...'}
        </div>
      )}

      {/* Error статусы */}
      {error && (
        <div className="status error">
          Error (CLAIM): {error}
        </div>
      )}

      {error2 && (
        <div className="status error">
          Error (CLAIM2): {error2}
        </div>
      )}

      {/* Result для первой кнопки */}
      {result && (
        <div style={{ 
          background: '#f0fdf4', 
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '24px'
        }}>
          <h3 style={{ color: '#166534', margin: '0 0 16px 0' }}>✅ Contract resolved! (CLAIM)</h3>
          <div style={{ fontSize: '14px', color: '#065f46' }}>
            <p><strong>TX Hash:</strong> {result.txHash}</p>
            <p><strong>Fee:</strong> {result.fee} sats</p>
            <p><strong>Contract:</strong> {result.contract}</p>
            <p><strong>Opcode:</strong> {result.opcode}</p>
            <p><strong>Tokens:</strong> {result.tokensUsed}</p>
            <p><strong>Transaction Size:</strong> {result.size} vbytes</p>
          </div>
        </div>
      )}

      {/* Result для второй кнопки */}
      {result2 && (
        <div style={{ 
          background: '#fffbeb', 
          border: '1px solid #fbbf24',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '24px'
        }}>
          <h3 style={{ color: '#d97706', margin: '0 0 16px 0' }}>🟡 Contract2 resolved! (CLAIM2)</h3>
          <div style={{ fontSize: '14px', color: '#92400e' }}>
            <p><strong>TX Hash:</strong> {result2.txHash}</p>
            <p><strong>Fee:</strong> {result2.fee} sats</p>
            <p><strong>Contract:</strong> {result2.contract}</p>
            <p><strong>Opcode:</strong> {result2.opcode}</p>
            <p><strong>Tokens:</strong> {result2.tokensUsed}</p>
            <p><strong>Transaction Size:</strong> {result2.size} vbytes</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Send; 