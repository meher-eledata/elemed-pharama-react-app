// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';

// const root = document.getElementById('root') || document.body

// ReactDOM.createRoot(root).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';  
import { store } from './redux/store';  

const root = document.getElementById('root') || document.body;

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Provider store={store}>  
      <App />
    </Provider>
  </React.StrictMode>
);
