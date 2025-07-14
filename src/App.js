import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Send from './pages/Send';
import Cart from './pages/Cart';
import Settings from './pages/Settings';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1 style={{ 
          fontWeight: '900', 
          fontSize: '20px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          width: '100%',
          textAlign: 'center',
          margin: '0',
          padding: '0',
          transform: 'scaleX(8)'
        }}>YUZU ZUZU</h1>
      </header>
      

      
      <main className="App-main">
        <nav className="App-nav">
          <Navigation />
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/send" element={<Send />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
