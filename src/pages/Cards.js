import React, { useState, useEffect } from 'react';
import { useCards } from '../hooks/useCards';
import { useTarotCard } from '../hooks/useTarotCard';
import { useLaserEyes } from '@omnisat/lasereyes-react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Alert
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StyleIcon from '@mui/icons-material/Style';

function Cards() {
  const { connected, address } = useLaserEyes();
  const { error, cards, loadCards, loading } = useCards();
  const { loadTarotCard, executeTarotCard } = useTarotCard();
  const [selectedCard, setSelectedCard] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [cardLoaded, setCardLoaded] = useState(false);

  useEffect(() => {
    const loadAllCards = async () => {
      if (!connected || !address) return;
      try {
        await loadCards(address);
      } catch (err) {
        console.error('❌ Error loading cards:', err);
      }
    };
    loadAllCards();
  }, [loadCards, connected, address]);

  const loadSpecificCard = async (card) => {
    try {
      setSelectedCard(card);
      setCardLoaded(false);
      const params = {
        target: { block: card.block.toString(), tx: card.tx.toString() },
        inputs: ["1000"]
      };
      const jsCode = await loadTarotCard(params);
      if (jsCode) {
        const success = executeTarotCard(jsCode, 'dynamic-tarot-card');
        if (success) setCardLoaded(true);
      }
    } catch (err) {
      console.error('❌ Error loading card:', err);
    }
  };

  const uniqueCards = cards.map((card, index) => ({
    ...card,
    uniqueId: `${card.cardNumber}-${card.block}-${card.tx}`,
    displayIndex: index + 1
  }));

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', p: 3, maxWidth: 1000, mx: 'auto' }}>
      {!connected && (
                  <Alert severity="info" sx={{ mb: 2, borderRadius: 3, fontWeight: 700 }}>
          🔗 Please connect your OYL wallet to view your cards
        </Alert>
      )}
      
      {/* Falling Watermelons Background */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        {[...Array(8)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              fontSize: '48px',
              animation: `fallingWatermelon 8s linear infinite`,
              animationDelay: `${i * 1.2}s`,
              left: `${10 + i * 12}%`,
              top: '-100px',
              opacity: 0.18,
              transform: 'rotate(45deg)',
              filter: 'blur(1px)'
            }}
          >
            🍉
          </Box>
        ))}
      </Box>
      {/* Content overlay */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Card Selection Buttons */}
        {cards.length > 0 && (
          <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #2d1b4e 60%, #7c3aed 100%)', border: '2px solid #ffd700', boxShadow: '0 8px 32px 0px rgba(255, 215, 0, 0.5), 0 4px 16px 0px rgba(124, 58, 237, 0.3)' }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#fffbe6', textShadow: '0 1px 8px #000, 0 0 6px #ffd70088', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <StyleIcon sx={{ color: '#ffd700', fontSize: 32, filter: 'drop-shadow(0 0 6px #ffd70088)' }} />
                Select a card:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', alignItems: 'flex-start' }}>
                {uniqueCards.map(card => {
                  const isSelected = selectedCard && selectedCard.block === card.block && selectedCard.tx === card.tx;
                  return (
                    <Paper
                      key={card.uniqueId}
                      onClick={() => loadSpecificCard(card)}
                      translate="no"
                      sx={{
                        background: isSelected
                          ? 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)'
                          : 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
                        color: isSelected ? '#2d1b4e' : '#fffbe6',
                        border: '2.5px solid',
                        borderColor: isSelected ? '#ffd700' : '#ffd70055',
                        boxShadow: isSelected 
                          ? '0 4px 24px 0px rgba(255, 215, 0, 0.6), 0 2px 12px 0px rgba(255, 215, 0, 0.3)' 
                          : '0 2px 16px 0px rgba(124, 58, 237, 0.3), 0 1px 8px 0px rgba(124, 58, 237, 0.2)',
                        borderRadius: 3,
                        px: 3,
                        py: 2,
                        minWidth: 90,
                        width: 90,
                        height: 70,
                        flexShrink: 0,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.18s',
                        position: 'relative',
                        '&:hover': {
                          boxShadow: '0 6px 32px 0px rgba(255, 215, 0, 0.8), 0 3px 16px 0px rgba(255, 215, 0, 0.4)',
                          background: 'linear-gradient(90deg, #ffd700 0%, #fffbe6 100%)',
                          color: '#2d1b4e',
                        },
                      }}
                    >
                      <span translate="no">#{card.cardNumber}</span>
                      <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', opacity: 0.7 }} translate="no">
                        {card.block}:{card.tx}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        )}
        {/* Selected Card Display - Clean */}
        {selectedCard ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            mx: -6,
            px: 6,
            py: 10,
            backgroundColor: 'transparent'
          }}>
            <Box 
              id="dynamic-tarot-card" 
              sx={{
                padding: '60px',
                margin: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minWidth: '550px',
                minHeight: '750px',
                overflow: 'visible',
                boxSizing: 'border-box'
              }}
            />
          </Box>
        ) : (
          <Box sx={{ mt: 2, minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h2" sx={{ fontSize: 48, mb: 2, color: '#ffd700', textAlign: 'center', filter: 'drop-shadow(0 0 6px #ffd70088)' }}>
              🎴
            </Typography>
            <Typography variant="h6" sx={{ color: '#fffbe6', textAlign: 'center', mb: 1 }}>
              {!connected ? 'Connect wallet to view cards' : 
               loading ? 'Loading cards...' : 
               error ? `Error: ${error}` :
               cards.length > 0 ? 'Select a card above' : 'No cards found'}
            </Typography>
          </Box>
        )}
        {/* Ошибка */}
        {error && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: 2, fontWeight: 700 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
}

export default Cards; 