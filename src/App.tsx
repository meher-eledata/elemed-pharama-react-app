import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Pages } from './pages';
import { useTokenExpiration } from './hooks/useTokenExpiration';
import ErrorBoundary from './components/ErrorBoundary';

const AppContent = () => {
  useTokenExpiration();

  return <Pages />;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
