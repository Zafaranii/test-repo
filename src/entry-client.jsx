import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { DEMO_MODE } from './demo/config';
import { installMockApi } from './demo/installMockApi';
import './index.css';

// Demo build: answer /api/v1 requests from sample data instead of a real backend.
if (DEMO_MODE) installMockApi();

const dehydratedState = window.__TANSTACK_DEHYDRATED_STATE__ || null;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App
      RouterComponent={BrowserRouter}
      dehydratedState={dehydratedState}
    />
  </React.StrictMode>
);
