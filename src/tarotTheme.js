import { createTheme } from '@mui/material/styles';

const tarotTheme = createTheme({
  palette: {
    primary: {
      main: '#7c3aed', // Mystic purple
      contrastText: '#fff',
    },
    secondary: {
      main: '#ffd700', // Gold
      contrastText: '#2d1b4e',
    },
    background: {
      default: '#1a1333', // Deep night
      paper: 'rgba(34, 24, 58, 0.95)',
    },
    info: {
      main: '#6ee7b7', // Magic turquoise
    },
    text: {
      primary: '#fffbe6', // светло-золотой/белый
      secondary: '#ffd700', // золотой для акцентов
    },
  },
  typography: {
    fontFamily: '"Cinzel Decorative", "Roboto", serif',
    h6: {
      fontFamily: '"Cinzel Decorative", "Roboto", serif',
      letterSpacing: 2,
      textShadow: '0 1px 8px #000, 0 0 6px #ffd70088',
    },
    h5: {
      textShadow: '0 1px 8px #000, 0 0 6px #ffd70088',
    },
    h4: {
      textShadow: '0 1px 8px #000, 0 0 6px #ffd70088',
    },
    h3: {
      textShadow: '0 1px 8px #000, 0 0 6px #ffd70088',
    },
    h2: {
      textShadow: '0 1px 8px #000, 0 0 6px #ffd70088',
    },
    h1: {
      textShadow: '0 1px 12px #000, 0 0 8px #ffd700cc',
    },
    body1: {
      color: '#fffbe6',
      textShadow: '0 1px 6px #000, 0 0 4px #ffd70055',
    },
    body2: {
      color: '#fffbe6',
      textShadow: '0 1px 6px #000, 0 0 4px #ffd70055',
    },
    overline: {
      color: '#ffd700',
      textShadow: '0 1px 6px #000, 0 0 8px #ffd700cc',
    },
    caption: {
      color: '#fffbe6',
      textShadow: '0 1px 6px #000, 0 0 4px #ffd70055',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          background: 'linear-gradient(90deg, #7c3aed 0%, #ffd700 100%)',
          color: '#fff',
          boxShadow: '0 4px 20px 0px rgba(255, 215, 0, 0.5), 0 2px 12px 0px rgba(124, 58, 237, 0.3)',
          border: '2px solid #ffd700',
          textTransform: 'none',
          fontWeight: 700,
          '&:hover': {
            background: 'linear-gradient(90deg, #ffd700 0%, #7c3aed 100%)',
            boxShadow: '0 6px 32px 0px rgba(255, 215, 0, 0.7), 0 4px 20px 0px rgba(124, 58, 237, 0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'linear-gradient(135deg, #2d1b4e 60%, #7c3aed 100%)',
          border: '2px solid #ffd700',
          boxShadow: '0 8px 32px 0px rgba(124, 58, 237, 0.3), 0 4px 16px 0px rgba(255, 215, 0, 0.2)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'linear-gradient(90deg, #7c3aed 0%, #ffd700 100%)',
          color: '#fff',
          boxShadow: '0 0 16px 2px #ffd70088',
          border: '2px solid #ffd700',
        },
        icon: {
          color: '#ffd700',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #7c3aed 0%, #ffd700 100%)',
          color: '#fff',
          border: '1px solid #ffd700',
          fontWeight: 700,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #2d1b4e 60%, #7c3aed 100%)',
          border: '1px solid #ffd700',
          boxShadow: '0 4px 24px 0px rgba(255, 215, 0, 0.2), 0 2px 12px 0px rgba(124, 58, 237, 0.3)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'linear-gradient(90deg, #7c3aed 0%, #ffd700 100%)',
          color: '#fff',
          border: '2px solid #ffd700',
          fontWeight: 700,
          '&.Mui-selected': {
            background: 'linear-gradient(90deg, #ffd700 0%, #7c3aed 100%)',
            color: '#2d1b4e',
            boxShadow: '0 0 12px 2px #ffd70088',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: 'linear-gradient(90deg, #7c3aed 0%, #ffd700 100%)',
          color: '#2d1b4e',
          fontWeight: 700,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: '#fffbe6',
          background: 'rgba(34,24,58,0.7)',
          borderRadius: 12,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ffd700',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ffd700',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ffd700',
            boxShadow: '0 0 8px 1px #ffd70088',
          },
        },
        input: {
          color: '#fffbe6',
          '::placeholder': {
            color: '#ffe066',
            opacity: 0.8,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: '#fffbe6',
          '::placeholder': {
            color: '#ffe066',
            opacity: 0.8,
          },
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: '#ffd700',
          filter: 'drop-shadow(0 0 6px #ffd70088)',
        },
      },
    },
  },
});

export default tarotTheme; 