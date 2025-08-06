import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { LaserEyesProvider } from '@omnisat/lasereyes-react'
import { MAINNET, SIGNET, OYL } from '@omnisat/lasereyes-core'

// Простой провайдер только с MAINNET
function DynamicLaserEyesProvider({ children }) {
  return (
    <LaserEyesProvider config={{ 
      networks: [MAINNET, SIGNET],
      defaultNetwork: MAINNET,
      walletProviders: [OYL],
      autoConnect: false
    }}>
      {children}
    </LaserEyesProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <DynamicLaserEyesProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    </DynamicLaserEyesProvider>
  </React.StrictMode>
);


