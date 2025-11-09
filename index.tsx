
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Import config verification (runs automatically in dev mode)
import './services/llm/verify-config';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log LLM config status in development
if (import.meta.env.DEV) {
  import('./services/llm/verify-config').then(({ printConfigStatus }) => {
    printConfigStatus();
  });
}
