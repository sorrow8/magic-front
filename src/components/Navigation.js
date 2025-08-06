import { NavLink } from 'react-router-dom';
import { Paper, Button, Box } from '@mui/material';
import { Dashboard as DashboardIcon, Add as AddIcon, Collections as CollectionsIcon } from '@mui/icons-material';

function Navigation() {
  return (
    <Paper sx={{
      p: 1,
      background: 'linear-gradient(135deg, #2d1b4e 60%, #7c3aed 100%)',
      border: '2px solid #ffd700',
      boxShadow: '0 4px 32px 0px rgba(255, 215, 0, 0.5), 0 2px 16px 0px rgba(124, 58, 237, 0.3)',
      borderRadius: 5.2,
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <NavLink to="/" end style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <Button
              variant="contained"
              startIcon={<DashboardIcon />}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#2d1b4e' : '#fff',
                background: isActive
                  ? 'linear-gradient(90deg, #ffd700 0%, #7c3aed 100%)'
                  : 'linear-gradient(90deg, #7c3aed 0%, #ffd700 100%)',
                boxShadow: isActive ? '0 0 16px 2px #ffd70088' : '0 0 8px 1px #7c3aed55',
                opacity: 1,
                border: '1.5px solid #ffd700',
                '& .MuiSvgIcon-root': {
                  color: isActive ? '#2d1b4e' : '#fff',
                },
                '&:hover': {
                  background: 'linear-gradient(90deg, #ffd700 0%, #7c3aed 100%)',
                  color: '#2d1b4e',
                  boxShadow: '0 0 24px 4px #ffd700cc',
                  '& .MuiSvgIcon-root': {
                    color: '#2d1b4e',
                  },
                },
                transition: 'all 0.2s',
              }}
            >
              Dashboard
            </Button>
          )}
        </NavLink>
        
        <NavLink to="/send" style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#2d1b4e' : '#fff',
                background: isActive
                  ? 'linear-gradient(90deg, #ffd700 0%, #7c3aed 100%)'
                  : 'linear-gradient(90deg, #7c3aed 0%, #ffd700 100%)',
                boxShadow: isActive ? '0 0 16px 2px #ffd70088' : '0 0 8px 1px #7c3aed55',
                opacity: 1,
                border: '1.5px solid #ffd700',
                '& .MuiSvgIcon-root': {
                  color: isActive ? '#2d1b4e' : '#fff',
                },
                '&:hover': {
                  background: 'linear-gradient(90deg, #ffd700 0%, #7c3aed 100%)',
                  color: '#2d1b4e',
                  boxShadow: '0 0 24px 4px #ffd700cc',
                  '& .MuiSvgIcon-root': {
                    color: '#2d1b4e',
                  },
                },
                transition: 'all 0.2s',
              }}
            >
              Mint Card
            </Button>
          )}
        </NavLink>
        
        <NavLink to="/cards" style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <Button
              variant="contained"
              startIcon={<CollectionsIcon />}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#2d1b4e' : '#fff',
                background: isActive
                  ? 'linear-gradient(90deg, #ffd700 0%, #7c3aed 100%)'
                  : 'linear-gradient(90deg, #7c3aed 0%, #ffd700 100%)',
                boxShadow: isActive ? '0 0 16px 2px #ffd70088' : '0 0 8px 1px #7c3aed55',
                opacity: 1,
                border: '1.5px solid #ffd700',
                '& .MuiSvgIcon-root': {
                  color: isActive ? '#2d1b4e' : '#fff',
                },
                '&:hover': {
                  background: 'linear-gradient(90deg, #ffd700 0%, #7c3aed 100%)',
                  color: '#2d1b4e',
                  boxShadow: '0 0 24px 4px #ffd700cc',
                  '& .MuiSvgIcon-root': {
                    color: '#2d1b4e',
                  },
                },
                transition: 'all 0.2s',
              }}
            >
              My Cards
            </Button>
          )}
        </NavLink>
      </Box>
    </Paper>
  );
}

export default Navigation; 