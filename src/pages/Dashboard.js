import { useBtcBalance } from '../hooks/useBtcBalance';
import { useAlkaneBalance } from '../hooks/useAlkaneBalance';
import { useGenerateBlocks } from '../hooks/useGenerateBlocks';

function Dashboard() {
  const { balanceBTC, loading, error, refetch, balance, confirmedBalance, unconfirmedBalance } = useBtcBalance();
  const { 
    loading: tokensLoading, 
    error: tokensError, 
    filteredTokens,
    refetch: tokensRefetch 
  } = useAlkaneBalance(null, '1');
  const { generateBlocks, loading: blocksLoading, error: blocksError, result: blocksResult } = useGenerateBlocks();

  const handleGenerateBlock = async () => {
    try {
      await generateBlocks(1);
      // Обновляем балансы после генерации блока
      setTimeout(() => {
        refetch();
        tokensRefetch();
      }, 1000);
    } catch (err) {
      console.error('Failed to generate block:', err);
    }
  };

  const handleGenerate100Blocks = async () => {
    try {
      await generateBlocks(100);
      // Обновляем балансы после генерации блоков
      setTimeout(() => {
        refetch();
        tokensRefetch();
      }, 1000);
    } catch (err) {
      console.error('Failed to generate blocks:', err);
    }
  };

  return (
    <div>
      {/* Error State */}
      {error && (
        <div style={{ 
          color: '#dc2626', 
          background: '#fef2f2',
          border: '1px solid #fecaca',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Blocks Error */}
      {blocksError && (
        <div style={{ 
          color: '#dc2626', 
          background: '#fef2f2',
          border: '1px solid #fecaca',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          Block generation error: {blocksError}
        </div>
      )}

      {/* Blocks Success */}
      {blocksResult && (
        <div style={{ 
          color: '#065f46', 
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          ✅ Generated {blocksResult.count} block(s) successfully!
          <br />
          <small>Latest hash: {blocksResult.blockHashes?.[0]?.slice(0, 16)}...</small>
        </div>
      )}
      
      {/* Bitcoin Balance */}
      <div style={{ 
        background: '#fff', 
        border: '1px solid #e1e4e8',
        borderRadius: '12px', 
        marginBottom: '32px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '32px',
          textAlign: 'center',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: '600', 
            color: '#1f2937',
            marginBottom: '8px',
            fontFeatureSettings: '"tnum"'
          }}>
            {balanceBTC || '0.00000000'}
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#6b7280',
            fontWeight: '500'
          }}>
            BTC
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr'
        }}>
          <div style={{ 
            padding: '24px 32px',
            borderRight: '1px solid #f3f4f6'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
              marginBottom: '4px'
            }}>
              Confirmed
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#1f2937',
              fontFeatureSettings: '"tnum"'
            }}>
              {confirmedBalance || '0'}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#9ca3af',
              marginTop: '2px'
            }}>
              sat
            </div>
          </div>
          <div style={{ 
            padding: '24px 32px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
              marginBottom: '4px'
            }}>
              Unconfirmed
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#1f2937',
              fontFeatureSettings: '"tnum"'
            }}>
              {unconfirmedBalance ?? '0'}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#9ca3af',
              marginTop: '2px'
            }}>
              sat
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'center',
        marginBottom: '48px'
      }}>
        <button onClick={refetch} style={{ 
          padding: '12px 24px', 
          fontSize: '14px', 
          fontWeight: '500',
          background: '#fff',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}>
          Refresh
        </button>
        <button onClick={tokensRefetch} style={{ 
          padding: '12px 24px', 
          fontSize: '14px', 
          fontWeight: '500',
          background: '#1f2937',
          color: '#fff',
          border: '1px solid #1f2937',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}>
          Refresh Tokens
        </button>
        <button 
          onClick={handleGenerateBlock} 
          disabled={blocksLoading}
          style={{ 
            padding: '12px 24px', 
            fontSize: '14px', 
            fontWeight: '500',
            background: '#10b981',
            color: '#fff',
            border: '1px solid #10b981',
            borderRadius: '8px',
            cursor: blocksLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: blocksLoading ? 0.6 : 1
          }}
        >
          {blocksLoading ? 'Generating...' : '⛏️ Generate Block'}
        </button>
        <button 
          onClick={handleGenerate100Blocks} 
          disabled={blocksLoading}
          style={{ 
            padding: '12px 24px', 
            fontSize: '14px', 
            fontWeight: '500',
            background: '#dc2626',
            color: '#fff',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            cursor: blocksLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: blocksLoading ? 0.6 : 1
          }}
        >
          {blocksLoading ? 'Generating...' : '🚀 Generate 100 Blocks'}
        </button>
      </div>

      {/* Tokens Section */}
      <div style={{ 
        background: '#fff', 
        border: '1px solid #e1e4e8',
        borderRadius: '12px'
      }}>
        <div style={{ 
          padding: '24px 32px',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Tokens
          </h2>
          {!tokensLoading && !tokensError && filteredTokens.length > 0 && (
            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              marginTop: '4px'
            }}>
              {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <div style={{ padding: '0' }}>
          {tokensLoading && (
            <div style={{ 
              color: '#6b7280', 
              textAlign: 'center',
              padding: '48px 32px',
              fontSize: '14px'
            }}>
              Loading...
            </div>
          )}
          
          {tokensError && (
            <div style={{ 
              color: '#dc2626', 
              background: '#fef2f2',
              padding: '16px 32px',
              fontSize: '14px'
            }}>
              {tokensError}
            </div>
          )}
          
          {!tokensLoading && !tokensError && (
            <>
              {filteredTokens.length > 0 ? (
                <div>
                  {filteredTokens.map((token, index) => (
                    <div key={index} style={{ 
                      padding: '24px 32px',
                      borderBottom: index < filteredTokens.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start' 
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginBottom: '4px'
                          }}>
                            {token.name || `Token #${token.index}`}
                          </div>
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#6b7280',
                            fontFeatureSettings: '"tnum"'
                          }}>
                            {token.id.block}:{token.id.tx}
                          </div>
                        </div>
                        <div style={{ 
                          textAlign: 'right',
                          marginLeft: '16px'
                        }}>
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            color: '#1f2937',
                            fontFeatureSettings: '"tnum"'
                          }}>
                            {token.balance}
                          </div>
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#6b7280',
                            marginTop: '2px'
                          }}>
                            {token.symbol || 'tokens'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  color: '#6b7280', 
                  textAlign: 'center', 
                  padding: '48px 32px',
                  fontSize: '14px'
                }}>
                  No tokens found
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 