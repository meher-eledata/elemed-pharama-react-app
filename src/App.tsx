import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Pages } from './pages';
// Removed useDisplayScale - rem units now handle scaling naturally
// import { useDisplayScale } from './hooks/useDisplayScale';
import ErrorBoundary from './components/ErrorBoundary';

const AppContent = () => {
  // Rem units now handle scaling automatically - no need for manual scaling
  // useDisplayScale(); // Removed - conflicts with rem-based scaling

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
