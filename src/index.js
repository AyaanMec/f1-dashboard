import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { RaceProvider } from './context/RaceContext';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <RaceProvider>
        <App />
      </RaceProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
