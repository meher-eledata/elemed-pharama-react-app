import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';  
import { store } from './redux/store';  
import { ThemeProvider } from "@mui/material/styles";
import theme from './components/Theme/Theme';


// Import MUI date adapter
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const root = document.getElementById('root') || document.body;

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>

    <Provider store={store}>  
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <App />
      </LocalizationProvider>
    </Provider>
    </ThemeProvider>

  </React.StrictMode>
);
