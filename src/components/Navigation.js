import { NavLink } from 'react-router-dom';

function Navigation() {
  const navStyle = {
    display: 'flex',
    gap: '2px',
    background: '#f3f4f6',
    padding: '4px',
    borderRadius: '8px',
    marginBottom: '32px'
  };

  const linkStyle = {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
    color: '#6b7280',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
    display: 'block'
  };

  const activeLinkStyle = {
    ...linkStyle,
    background: '#fff',
    color: '#1f2937',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };

  return (
    <nav style={navStyle}>
      <NavLink 
        to="/" 
        style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
        end
      >
        Dashboard
      </NavLink>
      <NavLink 
        to="/send" 
        style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
      >
        Place Bid
      </NavLink>
      <NavLink 
        to="/cart" 
        style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
      >
        Cart
      </NavLink>
      <NavLink 
        to="/settings" 
        style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
      >
        Settings
      </NavLink>
    </nav>
  );
}

export default Navigation; 