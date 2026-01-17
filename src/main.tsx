import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // This should contain the Tailwind directives
import { BrowserRouter } from 'react-router-dom';

// Global error handler for network errors and blocked requests
window.addEventListener('error', (event) => {
  // Suppress errors related to Bugsnag or blocked tracking requests
  if (event.message && (
    event.message.includes('bugsnag') ||
    event.message.includes('ERR_BLOCKED_BY_CLIENT') ||
    event.message.includes('NetworkError') ||
    event.filename && event.filename.includes('bugsnag')
  )) {
    event.preventDefault();
    console.warn('Suppressed tracking/network error:', event.message);
    return false;
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  // Suppress unhandled rejections related to Bugsnag or tracking
  if (event.reason && (
    event.reason.message && event.reason.message.includes('bugsnag') ||
    event.reason.message && event.reason.message.includes('ERR_BLOCKED_BY_CLIENT') ||
    event.reason.toString().includes('bugsnag')
  )) {
    event.preventDefault();
    console.warn('Suppressed tracking promise rejection:', event.reason);
    return false;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
