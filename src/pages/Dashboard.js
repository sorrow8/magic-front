import { useLaserEyes } from '@omnisat/lasereyes-react';
import { useWalletBalance, useWalletTokens, useAllTokens } from '../hooks/useWalletBalance';
import { useMintArbuz } from '../hooks/useMintArbuz';
import { useMempoolFees } from '../hooks/useMempoolFees';
import { useEffect, useState } from 'react';
import React from 'react';
import arbuzLogo from '../assets/arbuz.svg';
import {
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Token as TokenIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

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

function Dashboard() {
  const { connected } = useLaserEyes();
  const { balance, loading, refetch } = useWalletBalance();
  const { refetch: tokensRefetch } = useWalletTokens();
  const { tokens: allTokens, loading: allTokensLoading, error: allTokensError, refetch: allTokensRefetch } = useAllTokens();
  const [selectedFee, setSelectedFee] = useState('normal');
  const [customFee, setCustomFee] = useState('');
  const [refreshingTokens, setRefreshingTokens] = useState(false);
  const [privatePoolFeeRate, setPrivatePoolFeeRate] = useState(1);
  const [originalPrivatePoolFeeRate, setOriginalPrivatePoolFeeRate] = useState(1);
  const [privatePoolFeeLoading, setPrivatePoolFeeLoading] = useState(false);
  const [mintMode, setMintMode] = useState('rebar'); // 'rebar' | 'public'
  const { fees, loading: feesLoading, refetch: feesRefetch } = useMempoolFees();
  const { mintArbuz, minting } = useMintArbuz({ value: mintMode === 'rebar' ? privatePoolFeeRate : (selectedFee === 'fast' ? (fees?.fast || 10) : selectedFee === 'normal' ? (fees?.normal || 1) : selectedFee === 'slow' ? (fees?.slow || 2) : parseInt(customFee) || 1) });
  const [lastTxid, setLastTxid] = useState(null);
  const [openMintModal, setOpenMintModal] = useState(false);
  const [mintResult, setMintResult] = useState(null);

  // Автоматическое обновление токенов при переключении сети
  useEffect(() => {
    const handleNetworkSwitch = (event) => {
      setRefreshingTokens(true);
      
      // Обновляем баланс и токены
      Promise.all([refetch(), tokensRefetch(), allTokensRefetch()]).finally(() => {
        setTimeout(() => setRefreshingTokens(false), 1000);
      });
    };

    // Слушаем событие переключения сети
    window.addEventListener('NETWORK_SWITCHED', handleNetworkSwitch);
    
    // Экспортируем функцию для обновления токенов
    window.refreshTokens = () => {
      setRefreshingTokens(true);
      Promise.all([refetch(), tokensRefetch(), allTokensRefetch()]).finally(() => {
        setTimeout(() => setRefreshingTokens(false), 1000);
      });
  };

    return () => {
      window.removeEventListener('NETWORK_SWITCHED', handleNetworkSwitch);
      delete window.refreshTokens;
    };
  }, [refetch, tokensRefetch, allTokensRefetch]);

  // Функция для получения комиссии приватных пулов
  const fetchPrivatePoolFee = async () => {
    setPrivatePoolFeeLoading(true);
    try {
      const response = await fetch('https://shield.rebarlabs.io/v1/info');
      const data = await response.json();
      if (data.fees && data.fees[0] && data.fees[0].feerate) {
        // Сохраняем исходную комиссию от API
        const originalFee = data.fees[0].feerate;
        setOriginalPrivatePoolFeeRate(originalFee);
        setPrivatePoolFeeRate(originalFee);
      }
    } catch (error) {
      console.error('Error fetching private pool fee rate:', error);
    } finally {
      setPrivatePoolFeeLoading(false);
    }
  };

  // Загружаем комиссию при монтировании компонента
  useEffect(() => {
    if (connected) {
      fetchPrivatePoolFee();
    }
  }, [connected]);
  
  const handleMintArbuz = async () => {
    setOpenMintModal(true);
    setMintResult(null);
    
    try {
      let feeRate = 1;
      if (mintMode === 'rebar') {
        feeRate = privatePoolFeeRate;
      } else {
        if (selectedFee === 'fast') feeRate = fees?.fast || 10;
        else if (selectedFee === 'normal') feeRate = fees?.normal || 1;
        else if (selectedFee === 'slow') feeRate = fees?.slow || 2;
        else if (selectedFee === 'custom') feeRate = parseInt(customFee) || 1;
      }
      
      const result = await mintArbuz(feeRate);
      
      if (result?.cancelled) {
        // Пользователь отменил транзакцию
        setMintResult({ error: 'Transaction cancelled by user' });
        return;
      }
      
      if (result && result.txid) {
        setLastTxid(result.txid);
        setMintResult(result);
        console.log(`🎉 ARBUZ minted successfully! TXID: ${result.txid}`);
        
        setTimeout(() => {
          tokensRefetch();
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to mint ARBUZ:', err);
      setLastTxid(null);
      setMintResult({ error: err.message });
    }
  };

  const handleCloseModal = () => {
    setOpenMintModal(false);
    setMintResult(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      {/* Wallet Connection Status */}
      {!connected && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
        >
          Please connect your OYL wallet first
        </Alert>
      )}

      {/* Token Refresh Status */}
      {connected && refreshingTokens && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            Auto-refreshing tokens (same as "Refresh Tokens" button)
          </Box>
        </Alert>
      )}




      
      {/* Action Buttons */}


      {/* ARBUZ Mint Section */}
      {connected && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TokenIcon color="primary" />
              <Typography variant="h6" component="h2" sx={{ textShadow: '0 1px 8px #000, 0 0 6px #ffd70088' }}>
                Mint ARBUZ
              </Typography>
            </Box>

            <ToggleButtonGroup
              value={mintMode}
              exclusive
              onChange={(e, newMode) => newMode && setMintMode(newMode)}
              sx={{
                mb: 2,
                '& .MuiToggleButtonGroup-grouped': {
                  border: 'none !important',
                },
                '& .MuiToggleButton-root': {
                  border: 'none !important',
                  boxShadow: 'none',
                  minWidth: 150,
                },
              }}
            >
              <ToggleButton
                value="rebar"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  color: mintMode === 'rebar' ? '#2d1b4e' : '#fffbe6',
                  background: mintMode === 'rebar'
                    ? 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)'
                    : 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
                  boxShadow: mintMode === 'rebar' ? '0 0 16px 2px #ffd70088' : 'none',
                  borderRight: '2px solid #fffbe6',
                  zIndex: mintMode === 'rebar' ? 2 : 1,
                  transition: 'all 0.2s',
                  '&.Mui-selected, &.Mui-selected:hover': {
                    background: 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)',
                    color: '#2d1b4e',
                    boxShadow: '0 0 16px 2px #ffd70088',
                  },
                  '&:hover': {
                    boxShadow: '0 0 12px 2px #ffd70055',
                    background: mintMode === 'rebar'
                      ? 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)'
                      : 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
                    color: mintMode === 'rebar' ? '#2d1b4e' : '#fffbe6',
                  },
                }}
              >
                MINT VIA REBAR
              </ToggleButton>
              <ToggleButton
                value="public"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  color: mintMode === 'public' ? '#2d1b4e' : '#fffbe6',
                  background: mintMode === 'public'
                    ? 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)'
                    : 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
                  boxShadow: mintMode === 'public' ? '0 0 16px 2px #ffd70088' : 'none',
                  zIndex: mintMode === 'public' ? 2 : 1,
                  transition: 'all 0.2s',
                  '&.Mui-selected, &.Mui-selected:hover': {
                    background: 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)',
                    color: '#2d1b4e',
                    boxShadow: '0 0 16px 2px #ffd70088',
                  },
                  '&:hover': {
                    boxShadow: '0 0 12px 2px #ffd70055',
                    background: mintMode === 'public'
                      ? 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)'
                      : 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
                    color: mintMode === 'public' ? '#2d1b4e' : '#fffbe6',
                  },
                }}
              >
                MINT VIA PUBLIC
              </ToggleButton>
            </ToggleButtonGroup>

            {mintMode === 'rebar' && (
              <Paper sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Optimal Rebar Fee Rate:
                  </Typography>
                  <IconButton
                    onClick={fetchPrivatePoolFee}
                    disabled={privatePoolFeeLoading}
                    size="small"
                    sx={{ 
                      color: '#ffd700', 
                      filter: 'drop-shadow(0 0 6px #ffd70088)',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {privatePoolFeeLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, minHeight: 56 }}>
                  <IconButton
                    onClick={() => {
                      const newValue = Math.max(originalPrivatePoolFeeRate, privatePoolFeeRate - 1);
                      setPrivatePoolFeeRate(newValue);
                    }}
                    disabled={privatePoolFeeRate <= originalPrivatePoolFeeRate}
                    size="small"
                    sx={{
                      color: '#ffd700',
                      border: '1px solid #ffd700',
                      borderRadius: 1,
                      width: 32,
                      height: 32,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        boxShadow: '0 0 8px rgba(255, 215, 0, 0.3)'
                      },
                      '&:disabled': {
                        color: '#666',
                        borderColor: '#666'
                      }
                    }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  
                  <TextField
                    type="text"
                    value={privatePoolFeeRate}
                    onChange={e => {
                      const v = parseInt(e.target.value.replace(/[^0-9]/g, '')) || originalPrivatePoolFeeRate;
                      if (v >= originalPrivatePoolFeeRate && v <= 100) setPrivatePoolFeeRate(v);
                    }}
                    size="small"
                    sx={{ 
                      width: 80,
                      '& input': {
                        textAlign: 'center',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#fffbe6'
                      },
                      '& .MuiOutlinedInput-root': {
                        '& input[type=number]': {
                          MozAppearance: 'textfield'
                        },
                        '& input[type=number]::-webkit-outer-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0
                        }
                      }
                    }}
                  />
                  
                  <IconButton
                    onClick={() => {
                      const newValue = Math.min(100, privatePoolFeeRate + 1);
                      setPrivatePoolFeeRate(newValue);
                    }}
                    disabled={privatePoolFeeRate >= 100}
                    size="small"
                    sx={{
                      color: '#ffd700',
                      border: '1px solid #ffd700',
                      borderRadius: 1,
                      width: 32,
                      height: 32,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        boxShadow: '0 0 8px rgba(255, 215, 0, 0.3)'
                      },
                      '&:disabled': {
                        color: '#666',
                        borderColor: '#666'
                      }
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                  
                  <Typography variant="body2" sx={{ color: '#fffbe6', fontWeight: 500 }}>
                    sat/vB
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  onClick={handleMintArbuz}
                  disabled={minting}
                  startIcon={minting ? <CircularProgress size={16} /> : null}
                  sx={{
                    width: 200,
                    minHeight: 56,
                    background: 'linear-gradient(90deg, #7c3aed 0%, #2d1b4e 100%)',
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    border: '2px solid #ffd70055',
                    boxShadow: '0 0 8px 1px #7c3aed55',
                    fontWeight: 700,
                    borderRadius: 3,
                    transition: 'all 0.18s',
                    fontSize: '1rem',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #a78bfa 0%, #7c3aed 100%)',
                      boxShadow: '0 0 24px 4px #ffd700cc',
                      color: '#ffffff',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(90deg, #4c4c4c 0%, #2d2d2d 100%)',
                      color: '#888888',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {minting ? 'Minting...' : '🍉 Mint ARBUZ'}
                </Button>
              </Paper>
            )}

            {mintMode === 'public' && (
              <Paper sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Public Pool Fee Rate:
                  </Typography>
                  <IconButton
                    onClick={feesRefetch}
                    disabled={feesLoading}
                    size="small"
                    sx={{ 
                      color: '#ffd700', 
                      filter: 'drop-shadow(0 0 6px #ffd70088)',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {feesLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, width: '250px', justifyContent: 'flex-start' }}>
                  <FeeButton
                    label="Current"
                    value={fees.normal}
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

                <Button
                  variant="contained"
                  onClick={handleMintArbuz}
                  disabled={minting}
                  startIcon={minting ? <CircularProgress size={16} /> : null}
                  sx={{
                    width: 200,
                    minHeight: 56,
                    background: 'linear-gradient(90deg, #7c3aed 0%, #2d1b4e 100%)',
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    border: '2px solid #ffd70055',
                    boxShadow: '0 0 8px 1px #7c3aed55',
                    fontWeight: 700,
                    borderRadius: 3,
                    transition: 'all 0.18s',
                    fontSize: '1rem',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #a78bfa 0%, #7c3aed 100%)',
                      boxShadow: '0 0 24px 4px #ffd700cc',
                      color: '#ffffff',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(90deg, #4c4c4c 0%, #2d2d2d 100%)',
                      color: '#888888',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {minting ? 'Minting...' : '🍉 Mint ARBUZ'}
                </Button>
              </Paper>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Alkanes Section */}
      {connected && (
        <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #2d1b4e 60%, #7c3aed 100%)', border: '2px solid #ffd700', boxShadow: '0 8px 32px 0px rgba(255, 215, 0, 0.5), 0 4px 16px 0px rgba(124, 58, 237, 0.3)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TokenIcon color="primary" />
                <Typography variant="h6" component="h2" sx={{ textShadow: '0 1px 8px #000, 0 0 6px #ffd70088' }}>
                  Your ARBUZ
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {!allTokensLoading && !allTokensError && (() => {
                  const arbuzCount = allTokens.filter(token => {
                    if (token.runes && token.runes.length > 0) {
                      return token.runes.some(rune => 
                        rune.rune && 
                        rune.rune.name === 'ARBUZ' &&
                        rune.rune.id && 
                        rune.rune.id.block === '0x2' && 
                        (rune.rune.id.tx === '0x36f' || rune.rune.id.tx === '0x6305') // 879 или 25349
                      );
                    }
                    return false;
                  }).length;
                  
                  return arbuzCount > 0 ? (
                    <Chip 
                      label={`${arbuzCount} Alkane${arbuzCount !== 1 ? 's' : ''}`}
                      color="primary"
                      variant="outlined"
                    />
                  ) : null;
                })()}
                <IconButton
                  onClick={() => {
                    tokensRefetch();
                    allTokensRefetch();
                  }}
                  size="small"
                  sx={{ 
                    ml: 1,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Box>
            
            {allTokensLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}
            
            {!allTokensLoading && !allTokensError && (
              <>
                {(() => {
                  const arbuzTokens = allTokens.filter(token => {
                    if (token.runes && token.runes.length > 0) {
                      return token.runes.some(rune => 
                        rune.rune && 
                        rune.rune.name === 'ARBUZ' &&
                        rune.rune.id && 
                        rune.rune.id.block === '0x2' && 
                        (rune.rune.id.tx === '0x36f' || rune.rune.id.tx === '0x6305') // 879 или 25349
                      );
                    }
                    return false;
                  });
                  
                  return arbuzTokens.length > 0 ? (
                    <Box>
                      {arbuzTokens.map((token, index) => (
                      <Paper
                        key={index}
                        className={`arbuz-card-${index}`}
                        sx={{
                          mb: 2,
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'linear-gradient(90deg, #7c3aed 0%, #2d1b4e 100%)',
                          color: '#fffbe6',
                          border: '1.5px solid #ffd70055',
                          boxShadow: '0 0 8px 1px #7c3aed55',
                          borderRadius: 3,
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
                              {token.runes && token.runes.length > 0 
                                ? token.runes.map(rune => rune.rune.name).join(', ')
                                : (token.name || token.ticker || `Alkane #${index + 1}`)
                              }
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', opacity: 0.85 }}>
                              {token.runes && token.runes.length > 0 
                                ? token.runes.map(rune => {
                                    const block = parseInt(rune.rune.id.block, 16);
                                    const tx = parseInt(rune.rune.id.tx, 16);
                                    return `${block}:${tx}`;
                                  }).join(', ')
                                : (token.inscription_id || 'Unknown ID')
                              }
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', opacity: 0.7, fontSize: '0.75rem' }}>
                              UTXO: {token.outpoint ? `${token.outpoint.txid.slice(0, 8)}...${token.outpoint.txid.slice(-8)}:${token.outpoint.vout}` : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, textShadow: '0 1px 8px #000, 0 0 6px #ffd70088' }}>
                            {token.runes && token.runes.length > 0 
                              ? token.runes.map(rune => {
                                  return parseInt(rune.balance, 16) / 100000000;
                                }).join(', ')
                              : (token.balance || '1')
                            }
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffd700' }}>
                            {token.runes && token.runes.length > 0 
                              ? token.runes.map(rune => rune.rune.symbol).join(', ')
                              : (token.ticker || 'alkanes')
                            }
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="body1">
                      No ARBUZ found in your wallet
                    </Typography>
                  </Box>
                );
                })()}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Модальное окно для минта ARBUZ */}
      <Dialog open={openMintModal} onClose={handleCloseModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
          <span style={{ fontWeight: 700, color: '#ffd700', fontSize: 20 }}>Mint ARBUZ</span>
          <IconButton onClick={handleCloseModal} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Информационное сообщение для Rebar режима */}
          {mintMode === 'rebar' && (
            <Alert 
              severity="warning" 
              sx={{ 
                mt: 1, 
                mb: 2, 
                borderRadius: 2, 
                fontWeight: 700,
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid #7c3aed',
                color: '#fffbe6',
                boxShadow: '0 4px 20px 0px rgba(255, 215, 0, 0.3), 0 2px 12px 0px rgba(124, 58, 237, 0.2)'
              }}
            >
              Please note that after the recent addition of the new F2Pool and SpiderPool as Rebar partners, if your transaction gets included in one of them, the mint will fail and funds will be lost.
            </Alert>
          )}

          {/* Информационное сообщение для Public режима */}
          {mintMode === 'public' && (
            <Alert 
              severity="warning" 
              sx={{ 
                mt: 1, 
                mb: 2, 
                borderRadius: 2, 
                fontWeight: 700,
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid #ffd700',
                color: '#fffbe6',
                boxShadow: '0 4px 20px 0px rgba(255, 215, 0, 0.3), 0 2px 12px 0px rgba(124, 58, 237, 0.2)'
              }}
            >
              You can mint via public pools with any fee. However, this is true gambling because you don't know if your transaction's block will be mined by a Rebar partner pool!
            </Alert>
          )}



          {minting && (
            <Alert severity="info" icon={false} sx={{ mt: 1, mb: 2, borderRadius: 2, fontWeight: 700 }}>
              <CircularProgress size={18} sx={{ color: '#ffd700', mr: 1 }} />
              Signing Transaction...
            </Alert>
          )}
          
          {mintResult?.error && (
            <Alert severity="error" sx={{ mt: 1, mb: 2, borderRadius: 2, fontWeight: 700 }} icon={<ErrorIcon />}>
              {mintResult.error}
            </Alert>
          )}

          {mintResult?.txid && (
            <Card sx={{ mt: 1, background: 'linear-gradient(135deg, #2d1b4e 60%, #7c3aed 100%)', border: '2px solid #ffd700', boxShadow: '0 8px 32px 0px rgba(255, 215, 0, 0.5), 0 4px 16px 0px rgba(124, 58, 237, 0.3)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CheckCircleIcon sx={{ color: '#ffd700', fontSize: 28, filter: 'drop-shadow(0 0 6px #ffd70088)' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#fffbe6', textShadow: '0 1px 8px #000, 0 0 6px #ffd70088' }}>
                    ARBUZ minted successfully!
                  </Typography>
                </Box>
                <Box sx={{ color: '#fffbe6', fontSize: '1rem', fontFamily: 'monospace', ml: 1 }}>
                  <div><strong>TXID:</strong> {mintResult.txid}</div>
                  <div style={{ marginTop: '8px' }}>
                    <a 
                      href={`https://mempool.space/signet/tx/${mintResult.txid}`} 
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
          )}


        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Dashboard; 