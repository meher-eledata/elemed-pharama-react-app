import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Pages } from './pages';

function App() {
  return <BrowserRouter>
    <Pages />
  </BrowserRouter>;
}

export default App;
