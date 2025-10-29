import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Pages } from './pages';
import { useTokenExpiration } from './hooks/useTokenExpiration';

const AppContent = () => {
  useTokenExpiration();

  return <Pages />;
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
