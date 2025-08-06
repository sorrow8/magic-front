import { useState, useEffect } from 'react';
import { useLaserEyes } from '@omnisat/lasereyes-react';
import { useWalletTokens } from '../hooks/useWalletBalance';
import { useMintCard } from '../hooks/useMintCard';
import { useMempoolFees } from '../hooks/useMempoolFees';
import { useBlockHeight } from '../hooks/useBlockHeight';
import arbuzLogo from '../assets/arbuz.svg';
import { ToggleButton, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip } from '@mui/material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';

function FeeButton({ label, value, selected, onClick, inputMode, inputValue, onInputChange, onInputBlur, disabled }) {
  return (
    <ToggleButton
      value={label.toLowerCase()}
      selected={selected}
      onChange={onClick}
      disabled={disabled}
      sx={{
        width: '120px !important',
        minWidth: '120px !important',
        maxWidth: '120px !important',
        minHeight: 56,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 0,
        flex: 'none',
        background: selected 
          ? 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)' 
          : 'linear-gradient(90deg, #7c3aed 0%, #2d1b4e 100%)',
        color: '#ffffff',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        border: selected 
          ? '2px solid #ffd700' 
          : '2px solid #7c3aed55',
        boxShadow: selected 
          ? '0 0 16px 2px #ffd70088' 
          : '0 0 8px 1px #7c3aed55',
        fontWeight: 700,
        borderRadius: 3,
        transition: 'all 0.18s',
        '&:hover': {
          background: selected
            ? 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)'
            : 'linear-gradient(90deg, #a78bfa 0%, #7c3aed 100%)',
          boxShadow: '0 0 24px 4px #ffd700cc',
          color: '#ffffff',
        },
        '&.Mui-selected': {
          background: 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)',
          color: '#ffffff',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          border: '2px solid #ffd700',
          boxShadow: '0 0 16px 2px #ffd70088',
        },
      }}
    >
      <>
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem', color: 'inherit' }}>
          {label}
        </Typography>
        {inputMode ? (
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={e => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              onInputChange({ target: { value: val } });
            }}
            onBlur={onInputBlur}
            disabled={disabled}
            autoFocus
            style={{
              width: 48,
              fontSize: '1rem',
              fontWeight: 700,
              color: '#ffffff',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 0,
              textAlign: 'center',
              boxShadow: 'none',
              appearance: 'textfield',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            }}
          />
        ) : (
          <Typography variant="caption" sx={{ fontSize: '1rem', color: 'inherit', fontWeight: 500, width: '100%', textAlign: 'center', height: '20px', lineHeight: '20px', overflow: 'hidden' }}>
            {value ? `${value} sat/vB` : '\u00A0'}
          </Typography>
        )}
      </>
    </ToggleButton>
  );
}

function Send() {
  const { connected, address } = useLaserEyes();
  const { tokens, loading: tokensLoading, error: tokensError, hasArbuz, refetch: tokensRefetch } = useWalletTokens();
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [openMintModal, setOpenMintModal] = useState(false);
  const [modalToken, setModalToken] = useState(null);
  const { mintCard, minting, error, txid, result, clearResult } = useMintCard();
  const { fees, loading: feesLoading } = useMempoolFees();
  const { blockHeight, loading: blockLoading, mintInfo, refetch: blockRefetch } = useBlockHeight();
  const [selectedFee, setSelectedFee] = useState('normal');
  const [customFee, setCustomFee] = useState('');
  
  // Состояние для хранения результатов транзакций по UTXO
  const [utxoResults, setUtxoResults] = useState({});

  // Helper function to get unique token ID (including rune ID to distinguish tokens in the same UTXO)
  const getTokenId = (token) => `${token.outpoint.txid}:${token.outpoint.vout}:${token.runes[0].rune.id.block}:${token.runes[0].rune.id.tx}`;

  // Отслеживаем успешный результат и сохраняем его для текущего UTXO
  useEffect(() => {
    if (result && result.success && txid && modalToken) {
      const tokenId = getTokenId(modalToken);
      setUtxoResults(prev => ({
        ...prev,
        [tokenId]: {
          success: true,
          txid: txid,
          timestamp: Date.now()
        }
      }));
    }
  }, [result, txid, modalToken]);

  // Find selected token by ID
  const selectedToken = tokens.find(token => selectedTokenId === getTokenId(token));

      const feeRate = selectedFee === 'normal' ? (fees?.normal || 1) : parseInt(customFee) || 1;

  const handleMintCard = async () => {
    try {
      if (tokens.length === 0) {
        throw new Error('No ARBUZ Alkanes found. You need ARBUZ Alkanes to mint cards.');
      }
      if (!modalToken) {
        throw new Error('Please select an ARBUZ Alkane to use for minting.');
      }
      await mintCard(feeRate, modalToken); // Передаём выбранный UTXO
      
      // Обновляем список токенов после успешного минта
      setTimeout(() => {
        tokensRefetch();
      }, 2000); // Ждём 2 секунды для подтверждения транзакции
      
      // НЕ закрываем модал автоматически - пользователь сам закроет
    } catch (err) {
      // Ошибка уже обработана в хуке useMintCard
    }
  };

  const handleTokenClick = (token) => {
    const tokenId = getTokenId(token);
    setSelectedTokenId(tokenId);
    setModalToken(token);
    
    // Проверяем, есть ли сохранённый результат для этого UTXO
    const savedResult = utxoResults[tokenId];
    if (!savedResult) {
      clearResult(); // Очищаем предыдущий результат только если нет сохранённого
    }
    
    setOpenMintModal(true);
  };

  const handleCloseModal = () => {
    setOpenMintModal(false);
    setSelectedTokenId(null);
    setModalToken(null);
    setSelectedFee('normal');
    setCustomFee('');
    
    // Очищаем результат только если он не сохранён для этого UTXO
    if (selectedTokenId && utxoResults[selectedTokenId]) {
      // Не очищаем результат - он сохранён для этого UTXO
    } else {
      clearResult(); // Очищаем результат при закрытии
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      {/* Wallet Connection Status */}
      {!connected && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 3, fontWeight: 700 }}>
          🔗 Please connect your OYL wallet to mint cards
        </Alert>
      )}

      {/* Card Mint Timing Reminder */}
      {connected && mintInfo && (
        <Card sx={{ 
          mb: 2, 
          background: mintInfo.canMintNow 
            ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' 
            : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
          border: '2px solid #ffd700', 
          boxShadow: mintInfo.canMintNow 
            ? '0 8px 32px 0px rgba(34, 197, 94, 0.4), 0 4px 16px 0px rgba(34, 197, 94, 0.2)' 
            : '0 8px 32px 0px rgba(239, 68, 68, 0.4), 0 4px 16px 0px rgba(239, 68, 68, 0.2)', 
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                color: '#fff', 
                textShadow: '0 1px 8px #000',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                {mintInfo.canMintNow ? '🟢' : '🔴'} Card Mint Status
              </Typography>
              <Box
                onClick={blockRefetch}
                sx={{ 
                  color: '#ffd700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 215, 0, 0.1)'
                  }
                }}
              >
                {blockLoading ? <CircularProgress size={20} sx={{ color: '#ffd700' }} /> : <RefreshIcon />}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                Current Block: <strong>{mintInfo.currentBlock?.toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                Next Mint Block: <strong>{mintInfo.nextMintBlock?.toLocaleString()}</strong>
              </Typography>
              
              {mintInfo.canMintNow ? (
                <Typography variant="body1" sx={{ 
                  color: '#fff', 
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '8px 12px',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  🚀 Send your mint transaction now!
                </Typography>
              ) : (
                <Box>
                  <Typography variant="body1" sx={{ 
                    color: '#fff', 
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '8px 12px',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    ⏳ Wait {mintInfo.blocksUntilNextMint} more blocks (~{mintInfo.hoursUntilNextMint}h {mintInfo.minutesUntilNextMint}m)
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tokens List & Header */}
      {connected && (
        <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #2d1b4e 60%, #7c3aed 100%)', border: '2px solid #ffd700', boxShadow: '0 8px 32px 0px rgba(255, 215, 0, 0.5), 0 4px 16px 0px rgba(124, 58, 237, 0.3)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmojiEventsIcon sx={{ color: '#ffd700', fontSize: 32, filter: 'drop-shadow(0 0 6px #ffd70088)' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#fffbe6', textShadow: '0 1px 8px #000, 0 0 6px #ffd70088' }}>
                  Select ARBUZ to Mint Card
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {!tokensLoading && !tokensError && tokens.length > 0 && (
                  <Chip 
                    label={`${tokens.length} Alkane${tokens.length !== 1 ? 's' : ''}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
                <Box
                  onClick={tokensRefetch}
                  sx={{ 
                    ml: 1, 
                    color: '#ffd700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 215, 0, 0.1)'
                    }
                  }}
                >
                  <RefreshIcon />
                </Box>
              </Box>
            </Box>
            <Box>
              {tokensLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ffd700', fontWeight: 700, mb: 2 }}>
                  <CircularProgress size={20} sx={{ color: '#ffd700' }} />
                  Loading Alkanes...
                </Box>
              )}
              {!tokensLoading && !tokensError && (
                <>
                  {tokens.length > 0 ? (
                    <Box>
                      {tokens.map((token, index) => {
                        const tokenId = getTokenId(token);
                        const selected = selectedTokenId === tokenId;
                        return (
                          <Paper
                            key={index}
                            className={`arbuz-card-${index}`}
                            onClick={() => handleTokenClick(token)}
                            sx={{
                              mb: 2,
                              p: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: selected
                                ? 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)'
                                : 'linear-gradient(90deg, #7c3aed 0%, #2d1b4e 100%)',
                              color: selected ? '#2d1b4e' : '#fffbe6',
                              border: selected ? '2.5px solid #ffd700' : '1.5px solid #ffd70055',
                              boxShadow: selected ? '0 0 16px 2px #ffd700cc' : '0 0 8px 1px #7c3aed55',
                              borderRadius: 3,
                              cursor: 'pointer',
                              transition: 'all 0.18s',
                              '&:hover': {
                                boxShadow: '0 0 24px 4px #ffd700cc',
                                background: 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)',
                                color: '#2d1b4e',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <img 
                                src={arbuzLogo} 
                                alt="Arbuz" 
                                style={{ 
                                  width: '64px', 
                                  height: '64px',
                                  opacity: 0.3,
                                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                                  marginLeft: '-16px',
                                  marginTop: '-8px',
                                  transition: 'opacity 0.18s'
                                }} 
                                className="arbuz-logo"
                              />
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, textShadow: '0 1px 6px #000, 0 0 4px #ffd70055' }}>
                                  {token.runes[0].rune.name}
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', opacity: 0.85 }}>
                                  {parseInt(token.runes[0].rune.id.block, 16)}:{parseInt(token.runes[0].rune.id.tx, 16)}
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', opacity: 0.7, fontSize: '0.75rem' }}>
                                  UTXO: {token.outpoint.txid.slice(0, 8)}...{token.outpoint.txid.slice(-8)}:{token.outpoint.vout}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, textShadow: '0 1px 8px #000, 0 0 6px #ffd70088' }}>
                                {(parseInt(token.runes[0].balance, 16) / (10 ** 8)).toLocaleString()}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: selected ? '#2d1b4e' : '#ffd700' }}>
                                {token.runes[0].rune.symbol}
                              </Typography>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  ) : (
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}>
                      No ARBUZ Alkanes found. You need ARBUZ Alkanes to mint cards.
                    </Alert>
                  )}
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Модальное окно для минта */}
      <Dialog open={openMintModal} onClose={handleCloseModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
          <span style={{ fontWeight: 700, color: '#ffd700', fontSize: 20 }}>Mint Card</span>
          <IconButton onClick={handleCloseModal} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 1, mt: 1, textAlign: 'center' }}>
            Fee Rate Selection
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, justifyContent: 'center', width: '250px', margin: '0 auto 16px auto' }}>
            <FeeButton
              label="Current"
              value={fees?.normal}
              selected={selectedFee === 'normal'}
              onClick={() => setSelectedFee('normal')}
              disabled={feesLoading}
            />
            <FeeButton
              label="Custom"
              value={customFee}
              selected={selectedFee === 'custom'}
              onClick={() => setSelectedFee('custom')}
              inputMode={selectedFee === 'custom'}
              inputValue={customFee}
              onInputChange={e => setCustomFee(e.target.value)}
              onInputBlur={() => { if (!customFee) setSelectedFee('normal'); }}
              disabled={feesLoading}
            />
          </Box>
          
          {/* Показываем кнопку и состояния минта только если UTXO еще не отправлен */}
          {(() => {
            const savedResult = selectedTokenId ? utxoResults[selectedTokenId] : null;
            const isAlreadySent = savedResult?.success;
            
            return !isAlreadySent && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Button
                    onClick={handleMintCard}
                    disabled={minting || feesLoading}
                    sx={{
                      px: 5,
                      py: 1.5,
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: (minting || feesLoading)
                        ? 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)'
                        : 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)',
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      boxShadow: (minting || feesLoading)
                        ? '0 0 16px 2px #7c3aedaa'
                        : '0 0 16px 2px #ffd70088',
                      border: (minting || feesLoading)
                        ? '2px solid #7c3aed'
                        : '2px solid #ffd700',
                      letterSpacing: 1,
                      transition: 'all 0.18s',
                      '&:hover': {
                        background: (minting || feesLoading)
                          ? 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)'
                          : 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)',
                        color: '#ffffff',
                        boxShadow: (minting || feesLoading)
                          ? '0 0 24px 4px #7c3aedcc'
                          : '0 0 24px 4px #ffd700cc',
                      },
                    }}
                  >
                    MINT CARD
                  </Button>
                </Box>
                {minting && (
                  <Alert severity="info" icon={false} sx={{ mt: 3, borderRadius: 2, fontWeight: 700 }}>
                    <CircularProgress size={18} sx={{ color: '#ffd700', mr: 1 }} />
                    Signing Transaction...
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mt: 3, borderRadius: 2, fontWeight: 700 }} icon={<ErrorIcon />}>
                    {error}
                  </Alert>
                )}
              </>
            );
          })()}

          {(() => {
            // Определяем, какой результат показывать - текущий или сохранённый
            const currentTxid = txid;
            const savedResult = selectedTokenId ? utxoResults[selectedTokenId] : null;
            const displayTxid = currentTxid || (savedResult?.success ? savedResult.txid : null);
            
            return displayTxid && (
              <Card sx={{ mt: 4, background: 'linear-gradient(135deg, #2d1b4e 60%, #7c3aed 100%)', border: '2px solid #ffd700', boxShadow: '0 8px 32px 0px rgba(255, 215, 0, 0.5), 0 4px 16px 0px rgba(124, 58, 237, 0.3)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircleIcon sx={{ color: '#ffd700', fontSize: 28, filter: 'drop-shadow(0 0 6px #ffd70088)' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#fffbe6', textShadow: '0 1px 8px #000, 0 0 6px #ffd70088' }}>
                      Mint transaction sent!
                    </Typography>
                  </Box>
                  <Box sx={{ color: '#fffbe6', fontSize: '1rem', fontFamily: 'monospace', ml: 1 }}>
                    <div><strong>TXID:</strong> {displayTxid}</div>
                    <div style={{ marginTop: '8px' }}>
                      <a 
                        href={`https://mempool.space/signet/tx/${displayTxid}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#ffd700', textDecoration: 'underline', fontWeight: 700 }}
                      >
                        View on Explorer
                      </a>
                    </div>
                  </Box>
                </CardContent>
              </Card>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Send; 